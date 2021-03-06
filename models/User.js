//require in our database and our collection within the database 
const bcrypt = require('bcryptjs');
const usersCollection = require('../db').db().collection('users'); 
const validator = require('validator');
const md5 = require('md5');


//Constructor function for User objects
//Do not use arrow function here
let User = function(data, getAvatar)  {
    this.data = data;
    this.errors = [];
    if (getAvatar === undefined) {
        getAvatar = false
    }

    if (getAvatar) {
        this.getAvatar();
    }
    
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
                this.data = dbUser; //to grab email address (this.data.email) for getAvatar
                this.getAvatar(); //gets avatar image using registered email address and gravatar and md5 algo
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
            this.getAvatar(); //storing avatar prop in memory on the user object. We do it after the database insertOne operator because email/image may change in the future
            //we will not store this.avatar in the database. also md5 is a quick and cheap operation to do 
            resolve();
        } else {
            //there were errors so we reject
            reject(this.errors); 
       }
   });
}


User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}/?s=128` //s = 128 is size in pixels of the image. md5 hashing algo for hashing email
}

//not an OOP approach here, so we don't need to add it to prototype
User.findByUsername = function(username) {
    return new Promise(function(resolve, reject) {
        if (typeof username !== 'string') {
            reject();
            return;
        }

        usersCollection.findOne({username: username}).then(function(userDoc) {
            if (userDoc) {
                //we could resolve the entire userDoc, but userDoc has alot of extra info we don't necessarily need like hashed password
                //so we will clean up the userDoc before passing it to resolve()
                //we clean, by creating a new User instance 
                
                userDoc = new User(userDoc, true) //true argument will get avatar based on email address
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                //now userDoc will only have those 3 props - id, username, and avatar

                resolve(userDoc);
            } else {
                reject();
            }
        }).catch(function() {
            reject();
        });
    })
}

User.doesEmailExist = function(email) {
    return new Promise(async function(resolve, reject) {
        if (typeof email !== 'string') {
            resolve(false);
            return;
        }

        let user = await usersCollection.findOne({email: email})
        if (user) { //if user is found
            resolve(true);
        } else {
            resolve(false);
        }
    })
}
module.exports = User;