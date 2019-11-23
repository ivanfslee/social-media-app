const express = require('express');
const app = express();
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