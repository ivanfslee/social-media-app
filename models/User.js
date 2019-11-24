//require in our database and our collection within the database 
const bcrypt = require('bcryptjs');
const usersCollection = require('../db').db().collection('users'); 
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
    return new Promise(async (resolve, reject) => { //arrow function so 'this' will not be rebound 
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
    
        // only if username is valid, check if username is unique and isn't already in our database
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({username: this.data.username}) //if document is found, usernameExists will be the doc obj, otherwise, it will be null 
            //findOne is mongoDB method that returns a promise so we can use 'await', so that findOne method will complete before the if statement below is executed
            //for await to work, we also need it within an 'async' function which is the User.prototype.validate function. 
    
            if (usernameExists) { 
                this.errors.push('Username is already taken')
            }
        }
    
        // only if email is valid, check if email is unique and isn't already in our database
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({email: this.data.email}) 
    
            if (emailExists) { 
                this.errors.push('Email is already taken')
            }
        }
        resolve(); //register function continues after the this.validate() 
    })
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
                reject('invalid username and/or password!!!!!!!!!!!');
            }
        }).catch(function() {
            reject('Please try again later')
        }) 
    }) 
}


User.prototype.register = function() {
    return new Promise( async (resolve, reject) => {
        this.cleanUp();
        await this.validate(); //validate function is made async so we need to account for that because validate() has to completed before the following if statements are run 
   
       //if no errors, save this.data as a new doc in database
        if (!this.errors.length) {
            // hash user password
            let salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password, salt);  //hashSync takes 2 args, the value to be hashed and the salt
            // Create new user in usersCollection database with this.data object
            await usersCollection.insertOne(this.data); //make sure database action completes before we call resolve below it, so we add 'await' to the insertOne method call
            resolve();
        } else {
            //there were errors so we reject
            reject(this.errors); 
       }
   });
}

module.exports = User;