const Post = require('../models/Post');

exports.viewCreateScreen = function(req, res) {
    //res.render('create-post', {username: req.session.user.username, avatar: req.session.user.avatar}); //render ejs file and pass in obj with username and avatar
    res.render('create-post'); //we get rid of second argument because we now use a middleware in app.js to inject req.session props via res.locals object
}

exports.create = function(req, res) {
    let post = new Post(req.body); //req.body contains the form data user submits
    post.create().then(function() {
        res.send('New post created');
    }).catch(function(errors) {
        res.send(errors);
    });
}