const Post = require('../models/Post');

exports.viewCreateScreen = function(req, res) {
    //res.render('create-post', {username: req.session.user.username, avatar: req.session.user.avatar}); //render ejs file and pass in obj with username and avatar
    res.render('create-post'); //we get rid of second argument because we now use a middleware in app.js to inject req.session props via res.locals object
}

exports.create = function(req, res) {
    let post = new Post(req.body , req.session.user._id); //req.body contains the form data user submits, req.session contains the avatar, id, username
    post.create().then(function() {
        res.send('New post created');
    }).catch(function(errors) {
        res.send(errors);
    });
}

exports.viewSingle = async function(req, res) {
    try {
        console.log('req is ', req);
        console.log('req.params is ', req.params)
        let post = await Post.findSingleById(req.params.id); //retrieve Post document in database by id. 
        //request has params prop with id - id refers to dynamic  part of the url route in router.js
        //router.get('/post/:id'   <- the ':id' changes depending on the post 
        //also we will define findSingleById to return a promise, so we prepend with 'await'  
        res.render('single-post-screen', {post: post});
    } catch {
        res.render('404');
    }
    
}