//User controlling functions
const User = require('../models/User');

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        //session is unique for each visitor to the site. 
        //We add a property to session called 'user', its value will be an object 
        //session object will allow verification that the user is logged in 
        req.session.user = {avatar: user.avatar, username: user.data.username}; //stamp avatar and username into session obj 
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
        req.session.user = {avatar: user.avatar, username: user.data.username};
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

exports.home = (req, res) => {
    if (req.session.user) { //req.session.user only exists if user has logged on successfully in the login function - 
    //if they have session data, send them to their dashboard. 
    //The only way they have session data is if they logged in before
        console.log(req.session)
        res.render('home-dashboard', {avatar: req.session.user.avatar, username: req.session.user.username});  //second arg will pass data into the ejs template 
        //second arg is an obj that grabs the username from the req.session object 
        //res.send('Welcome to the actual application');
    } else {
        res.render('home-guest', {errors: req.flash('errors'), regErrors: req.flash('regErrors')});  //render our ejs file and inject error message from flash package
        //when we retrieve the 'errors' from the flash obj in database, it will remove the error message from the database session array also
    }
}

