const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session); // MongoStore is a constructor. We pass in express-session package 
const flash = require('connect-flash'); //flash messaging package 
const markdown = require('marked');
const csrf = require('csurf'); //package to deal with cross site request forgery
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

app.use(csrf()); //any requests that modify state (post/put/delete) will need to have valid and matching csrf token, otherwise, the request will be rejected and throw an error
app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();   //contains csrf token that will be outputted into html template 
    next();
})

app.use('/', router);

app.use(function(err, req, res, next) {
    if (err) {
        if (err.code == "EBADCSRFTOKEN") {
            req.flash('errors', 'Cross site request forger detected');
            req.session.save(() => res.redirect('/'));
        } else {
            res.render('404');
        }
    }
})

const server = require('http').createServer(app); //'http' is included. This line creates a server that is going to use Express app as its handler 

//add socket functionality to the server
const io = require('socket.io')(server);

//express session package integrated with socket io package
io.use(function(socket, next) {
    sessionOptions(socket.request, socket.request.res, next); //makes express session data available from within context of socket.io 
})

io.on('connection', function(socket) {  //socket parameter represents connection between server and browser - new connection established
        if (socket.request.session.user) { //only if you are logged in
            let user = socket.request.session.user; //store session data in variable user

            socket.emit('welcome', {username: user.username, avatar: user.avatar}) //new event called 'welcome' will send obj with username and avatar props to browser - 

            socket.on('chatMessageFromBrowser', function(data) {  //when server gets 'chatMessageFromBrowser' event, it emits 'chatMessageFromServer' event 
                socket.broadcast.emit('chatMessageFromServer', {message: sanitizeHTML(data.message, {allowedTags: [], allowedAttributes: {}}), username: user.username, avatar: user.avatar})//broadcast message, username, and avatar, out to all connected users except to the person who sent it (socket connection that sent it) 
            //if you wanted to emit event only to the browser that sent you the message, you would use socket.emit()

            //essentially we're just taking the message that one browser sent to the server //socket.on('chatMessageFromBrowser', function(data)
            // and then the server is sending that out to all connected browsers. //io.emit('chatMessageFromServer', {message: data.message})
    
        }) //when server detects event of the type 'chatMessageFromBrowser' (defined in chat.js). Function's data parameter is object we sent from chat.js emit() method call
    }  
})

module.exports = server;