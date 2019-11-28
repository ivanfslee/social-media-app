//User controlling functions
const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

exports.doesUsernameExist = function(req, res) {
    //findByUsername resolves with a doc from mongodb if it finds a doc
    User.findByUsername(req.body.username).then(function() {
        res.json(true); //axios request from frontend will receive a response in json format - true
    }).catch(function() {
        res.json(false);
    })
}

exports.sharedProfileData = async function(req, res, next) { //middleware to track followers and follows and if they are currently following user
    let isVisitorsProfile = false; //check if we are on our own profile or not - if so, we use this to hide our follow button (to not follow ourself)
    let isFollowing = false;
    console.log(req.isFollowing)
    if (req.session.user) {
        isVisitorsProfile = req.profileUser._id.equals(req.session.user._id); //returns true or false; check if we are on our own profile - 
        isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId); 
    }

    req.isVisitorsProfile = isVisitorsProfile;
    req.isFollowing = isFollowing; //add isFollowing prop to req to be used in 'exports.profilePostsScreen' method 
    console.log(req.isFollowing)
    //retrieve post, follower, and following counts
    let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
    let followerCountPromise = Follow.countFollowersById(req.profileUser._id);
    let followingCountPromise = Follow.countFollowingById(req.profileUser._id);
    let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]); //wait for all promises to complete. store their values into variables with array destructuring syntax 

    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;
    next();
}


exports.mustBeLoggedIn = function(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        req.flash('errors', 'You must logged in ')
        req.session.save(function() {
            res.redirect('/');
        })
    }
}


exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        //session is unique for each visitor to the site. 
        //We add a property to session called 'user', its value will be an object 
        //session object will allow verification that the user is logged in 
        console.log('after login, user.data looks like this: ', user.data);
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id}; //stamp avatar and username and _id into session obj 
        //session package recognizes we are changing the session data
        // and in response, this will change the database session entry as well (which is asynchronous)
        req.session.save(function() { //we manually save to database and after that is done, callback function with res.redirect will run
            res.redirect('/');
        })
    }).catch(function(err) {
        // under the hood, req.flash will add another property to sessions
        req.flash('errors', err); //first arg is array of messages, second arg is string of text we want to add to array
        //flash adds a 'flash' prop to req.session. flash prop has a prop called 'errors' which is an array with err string in it 
        //req.session looks like this -> req.session.flash.errors = [err]

        //anytime we modify session, it will change the session doc in database which is an async action, so 
        //we manually save it and then we do the redirect. 
        //we have to make sure the change in the database is finished until we redirect the user
        req.session.save(function() {
            res.redirect('/'); //this will trigger home function 
        })
        
    });
}

exports.logout = function(req, res) {
    //if request from browser has a cookie with a valid session id to our database, execute destroy() method
    //removes session doc in database also 
    //session package doesn't return promises so we will use callback method to deal with asynchronous destroy method
    //we need to wait for session to be destroyed in database before we redirect them to home page 
    req.session.destroy(function() {
        res.redirect('/');
    });
}

exports.register = (req, res) => {
    //console.log(req.body); //req.body contains username/email/password from form submission by user registering

    let user = new User(req.body); 
    //create new object using User.js as blueprint and passing in req.body as data parameter
    
    user.register().then(() => { //user.register() returns a promise, so we use a .then and .catch 
        req.session.user = {avatar: user.avatar, username: user.data.username, _id: user.data._id};
        req.session.save(function() {
            res.redirect('/');
        })
    }).catch((regErrors) => {
        regErrors.forEach(function(error) {
            req.flash('regErrors', error);
        });
        req.session.save(function() {
            res.redirect('/');
        });
    }); 
}

exports.home = async (req, res) => {
    if (req.session.user) { //req.session.user only exists if user has logged on successfully in the login function - 
        //fetch feed of posts for current user
        let posts = await Post.getFeed(req.session.user._id); //getFeed will get posts to display into users dashboard 
        //if they have session data, send them to their dashboard. 
        //The only way they have session data is if they logged in before
        //console.log(req.session)
        //res.render('home-dashboard', {avatar: req.session.user.avatar, username: req.session.user.username});  //second arg will pass data into the ejs template -
        // later we removed the second arg and instead used a middleware in app.js to inject the req.session props to the html using res.locals object. 
        res.render('home-dashboard', {posts: posts});
        //second arg is an obj that grabs the username from the req.session object 
    } else { //if not logged in 
        res.render('home-guest', {regErrors: req.flash('regErrors')});  //render our ejs file and inject error message from flash package
        //when we retrieve the 'errors' from the flash obj in database, it will remove the error message from the database session array also
    }
}


exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) { //findByUsername returns a user doc from database 
        req.profileUser = userDocument; //we will make use of req.profileUser in profilePostsScreen method
        next();
    }).catch(function() {
        res.render('404');
    })
}

exports.profilePostsScreen = function(req, res) {
    //ask post model for posts by certain author id 
    Post.findByAuthorId(req.profileUser._id).then(function(posts) { //findByAuthorId will return array of posts 
        //
        res.render('profile', {
            title: `Profile for ${req.profileUser.username}`,
            currentPage: 'posts',
            posts: posts,
            profileUsername: req.profileUser.username, //values are stored in req.profileUser that was defined in ifUserExists method
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing, 
            isVisitorsProfile: req.isVisitorsProfile, //this is to hide follow button if you are viewing your own profile 
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        }); //second argument is passed into 'profile.ejs' and injected into the ejs template

    }).catch(function() {
        res.render('404');
    });
}

exports.profileFollowersScreen = async function(req, res) {
    try {
        let followers = await Follow.getFollowersById(req.profileUser._id)
        res.render('profile-followers', {
            title: `Followers for ${req.profileUser.username}`,
            currentPage: 'followers',
            followers: followers,
            profileUsername: req.profileUser.username, //values are stored in req.profileUser that was defined in ifUserExists method
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing, 
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
        })
    } catch {
        res.render('404');
    }
}

exports.profileFollowingScreen = async function(req, res) {
    try {
        let following = await Follow.getFollowingById(req.profileUser._id)
        res.render('profile-following', {
            title: `${req.profileUser.username} is Following`,
            currentPage: 'following',
            following: following,
            profileUsername: req.profileUser.username, //values are stored in req.profileUser that was defined in ifUserExists method
            profileAvatar: req.profileUser.avatar,
            isFollowing: req.isFollowing, 
            isVisitorsProfile: req.isVisitorsProfile,
            counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount} 
        })
    } catch {
        res.render('404');
    }
}