//User controlling functions
const User = require('../models/User');

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
        req.session.user = {username: user.data.username};    
        //session is unique for each visitor to the site. 
        //We add a property to session called 'user', its value will be an object 
        //session object will allow verification that the user is logged in 
        
        res.send(result);
    }).catch(function(err) {
        res.send(err);
    });
}

exports.logout = function() {

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
    if (req.session.user) { 
    //if they have session data, send them to their dashboard. 
    //The only way they have session data is if they logged in before
        res.send('Welcome to the actual application');
    } else {
        res.render('home-guest');  //render our ejs file 
    }
}

