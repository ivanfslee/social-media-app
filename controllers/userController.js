//User controlling functions
const User = require('../models/User');

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        //session is unique for each visitor to the site. 
        //We add a property to session called 'user', its value will be an object 
        //session object will allow verification that the user is logged in 
        req.session.user = {username: user.data.username}; 
        //session package recognizes we are changing the session data
        // and in response, this will change the database session entry as well (which is asynchronous)
        req.session.save(function() { //we manually save to database and after that is done, callback function with res.redirect will run
            res.redirect('/');
        })
    }).catch(function(err) {
        res.send(err);
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
    
    user.register();
    if (user.errors.length) {
        res.send(user.errors);
    } else {
        res.send('Congrats, there are no errors.')
    }
    
}

exports.home = (req, res) => {
    if (req.session.user) { //req.session.user only exists if user has logged in before or is logging in for the first time and they have user doc in database
    //if they have session data, send them to their dashboard. 
    //The only way they have session data is if they logged in before
        console.log(req.session)
        res.render('home-dashboard', {username: req.session.user.username}); 
        //second arg is an obj that grabs the username from the req.session object 
        //res.send('Welcome to the actual application');
    } else {
        res.render('home-guest');  //render our ejs file 
    }
}

