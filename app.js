const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session); // MongoStore is a constructor. We pass in express-session package 
const flash = require('connect-flash'); //flash messaging package 
const markdown = require('marked');
const app = express();
const sanitizeHTML = require('sanitize-html');
//configuration for sessions 
let sessionOptions = session({
    secret: 'aljsdlfkjsdlfjsdljfsdl',
    store: new MongoStore({client: require('./db')}), //by default session is stored in memory (ram), here we override the default to store session into mongoDB
    resave: false,
    saveUninitialized: false,
    cookie: {
                maxAge: 100 * 60 * 60 * 24 , // time cookie should be valid until expired
                httpOnly: true
            }
});
app.use(sessionOptions);

app.use(flash());
app.use(function(req, res, next) {  //this will run for every request
    // make markdown available from within ejs templates
    res.locals.filterUserHTML = function(content) { //res.locals is available to all our ejs templates
        return sanitizeHTML(markdown(content), {allowedTags: ['p', 'br','ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'], allowedAttributes: {}}); //pass the content parameter into our markdown/marked package 
    } //we sanitize markdown to allow only innocent html tags and not something like <script> or <a> for links 

    //make all error and success flash messages available from all templates
    res.locals.errors = req.flash('errors');
    res.locals.success = req.flash('success');

    //a middleware. app.use - tells express to run this function on every request. We have it arranged before our router on line 25.
    //make current user id a available on the req object
    //if user is logged in, visitor id will be their user id
    //otherwise, if they are not logged in, their visitor id will be a zero 0. 
    if (req.session.user) {
        req.visitorId = req.session.user._id;
    } else {
        req.visitorId = 0;
    }
    
    // make user session data available from within view templates
    res.locals.user = req.session.user;  //res.locals is an object that is available from within ejs template. We add properties to it, in this case, 'user' prop
    next(); //express will then move on to the next function for the particular route 
})

const router = require('./router.js');

app.use(express.urlencoded({extended: false})); 
//data transfer for HTML form submit
//tell express to add the user submitted data onto our request object 

app.use(express.json())
//data transfer via sending JSON data

app.use(express.static('public'));
app.set('views', 'views'); 
//first arg is an express option, second arg is our folder 'views'

app.set('view engine', 'ejs'); 
//let express know what template engine we are using 

app.use('/', router);

module.exports = app;