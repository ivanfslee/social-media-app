const express = require('express');
const session = require('express-session');
const app = express();

//configuration for sessions 
let sessionOptions = session({
    secret: 'aljsdlfkjsdlfjsdljfsdl',
    resave: false,
    saveUninitialized: false,
    cookie: {
                maxAge: 100 * 60 * 60 * 24 , // time cookie should be valid until expired
                httpOnly: true
            }
});
app.use(sessionOptions);

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