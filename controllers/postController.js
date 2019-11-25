const Post = require('../models/Post');

exports.viewCreateScreen = function(req, res) {
    //res.render('create-post', {username: req.session.user.username, avatar: req.session.user.avatar}); //render ejs file and pass in obj with username and avatar
    res.render('create-post'); //we get rid of second argument because we now use a middleware in app.js to inject req.session props via res.locals object
}


exports.create = function(req, res) {
    let post = new Post(req.body , req.session.user._id); //req.body contains the form data user submits, req.session contains the avatar, id, username
    post.create().then(function(newId) {
        req.flash('success', 'New post created');
        req.session.save(() => res.redirect(`/post/${newId}`)); 
    }).catch(function(errors) {
        errors.forEach(error => req.flash('errors', error));
        req.session.save(() => res.redirect('/create-post'));
    });
}

exports.viewSingle = async function(req, res) {
    try {
        console.log('req is ', req);
        console.log('req.params is ', req.params);
        let post = await Post.findSingleById(req.params.id, req.visitorId); //retrieve Post document in database by id. req.visitor id will determine if user is logged in or not logged in
        //request has params prop with id - id refers to dynamic  part of the url route in router.js
        //router.get('/post/:id'   <- the ':id' changes depending on the post 
        //also we will define findSingleById to return a promise, so we prepend with 'await'  
        res.render('single-post-screen', {post: post});
    } catch {
        res.render('404');
    }
    
}

exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id)
        console.log('post.authorId is, ', post.authorId);
        console.log('typeof post.authorId is, ', typeof post.authorId); //object
        console.log('req.visitorId is, ', req.visitorId);
        console.log('typeof req.visitorId is, ', typeof req.visitorId); //string
        if (post.authorId == req.visitorId) { //needs to be double equals here because authorId and visitorId are different data types. Triple equals will not work 
            res.render('edit-post', {post: post});
        } else {
            req.flash('errors', 'You do not have permission to do that!!!');
            req.session.save(() => res.redirect('/'))
        }
    } catch {
        res.render('404')
    }
}

exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id); //pass in ejs form data as req.body, visitorId, and id of the post 
    post.update().then((status) => {// we will have our update() method resolve with a status value 
        //post was successfully updated in database
        //or user did permission, but there were post content validation errors (e.g. - title was blank, body content was blank)
        if (status === 'success') {
            //post was updated in db
            //redirect to 
            //give them green flash message 
            req.flash('success', 'Post successfully updated');
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`);
            })
        } else {
            //title or body content was blank 
            //so we redirect them and show them flash messages
            post.errors.forEach(function(error) {
                req.flash('errors', error)
            }) //loop through each error and flash them 
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`) //redirect them to post they were trying to edit 
            })

        }
    }).catch(() => {
        //post with requested id doesn't exist
        //or if current visitor is not the owner of requested post
        //we will redirect user and give flash messages
        req.flash('errors', 'You do not have permission to edit');
        req.session.save(function() {
            res.redirect('/');
        }) //edit the session obj and save which changes the database 
    });
}