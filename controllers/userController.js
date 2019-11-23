//User controlling functions
const User = require('../models/User');

exports.login = function(req, res) {
    let user = new User(req.body);
    user.login().then(function(result) {
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
    res.render('home-guest');  //render our ejs file 
}

