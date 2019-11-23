//require in our database and our collection within the database 
const bcrypt = require('bcryptjs');
const usersCollection = require('../db').collection('users'); 
const validator = require('validator');


//Constructor function for User objects
//Do not use arrow function here
let User = function(data)  {
    this.data = data;
    this.errors = [];
    
}

// Clean up user input 
User.prototype.cleanUp = function() {
    //verify user input is a string and not an obj/array or other data type 
    if (typeof this.data.username !== 'string') {
        this.data.username = '';
    }

    if (typeof this.data.email !== 'string') {
        this.data.email = '';
    }

    if (typeof this.data.password !== 'string') {
        this.data.password = '';
    }

    //get rid of any properties user may inject by redefining our this.data property
    this.data = {
        username: this.data.username.trim().toLowerCase(), //trim to negate spaces
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

// Validates user registration 
User.prototype.validate = function() {
    if (this.data.username === '') {
        this.errors.push('You must provide a username.')
    }

    if (this.data.username != '' && !validator.isAlphanumeric(this.data.username)) {
        this.errors.push('Username can only contain letters and numbers.')
    }

    if (!validator.isEmail(this.data.email)) {
        this.errors.push('You must provide a valid email address.')
    }

    if (this.data.password === '') {
        this.errors.push('You must provide a password.')
    }

    if (this.data.password.length > 0 && this.data.password.length < 12) {
        this.errors.push('Password must be at least 12 characters.')
    }

    if (this.data.password.length > 50) {
        this.errors.push('Password cannot exceed 50 characters.')
    }

    if (this.data.username.length > 0 && this.data.username.length < 3) {
        this.errors.push('Username must be at least 3 characters.')
    }

    if (this.data.username.length > 30) {
        this.errors.push('Username cannot exceed 30 characters.')
    }
}


User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        //check if username exists in database
        //then method is passed an arrow function to not rebind 'this'. Without arrow, this will be global var because mongo findOne method is calling  
        usersCollection.findOne({username: this.data.username}).then((dbUser) => { //if database lookup is successful, it will pass that db document into 'then' method
            if (dbUser && bcrypt.compareSync(this.data.password, dbUser.password)) { //compareSync compares a hash of the users password input (this.data.password) with the hashed password in our db (dbUser.password)
                resolve('Congrats!!!!4!!!');
            } else {
                reject('invalid username and/or password!!!!!!!!!!!5');
            }
        }).catch(function() {
            reject('Please try again later')
        }) 
    }) 
}


User.prototype.register = function() {
    this.cleanUp();
    this.validate(); 

    //if no errors, save this.data as a new doc in database
    if (!this.errors.length) {
        // hash user password
        let salt = bcrypt.genSaltSync(10);
        this.data.password = bcrypt.hashSync(this.data.password, salt);  //hashSync takes 2 args, the value to be hashed and the salt
        // Create new user in usersCollection database with this.data object
        usersCollection.insertOne(this.data);
    }

}

module.exports = User;