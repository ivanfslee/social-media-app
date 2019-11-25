const postsCollection = require('../db').db().collection('posts');               
//require('../db') is the client.    
//require('../db').db() gets the actual database.  
//.collection('posts') gives us access to posts collection in database 

const ObjectID = require('mongodb').ObjectID; //mongoDB treats ids specially. Essentially, we create an objectId object type 

const User = require('./User')

let Post = function(data, userid) {
    this.data = data;
    this.errors = [];
    this.userid = userid
}



Post.prototype.cleanUp = function() {
    //make sure post fields of title and body content are strings 
    //in ejs file, title has name = title and body content has name = body
    if (typeof this.data.title !== 'string') {
        this.data.title = '';
    }

    if (typeof this.data.body !== 'string') {
        this.data.body = '';
    }

    // remove any properties user may maliciously try to add by redefining this.data 
    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(), //built in JS constructor for date objects 
        author: ObjectID(this.userid) //this will return objectID object that mongodb uses
    }
}


Post.prototype.validate = function() {
    if (this.data.title === '') {
        this.errors.push('You must provide a title');
    }

    if (this.data.body === '') {
        this.errors.push('Body content field cannot be blank');
    }
}

Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.length) { //if there are no errors
            //store post document into database
            //we can do .then.catch here after insertOne or we can do async/await 
            //if we are doing multiple async things at once, async/await is cleaner code
            //if we are just doing one async thing, .then.catch is preferred 
            postsCollection.insertOne(this.data).then(function() {
                resolve()
            }).catch(function() {
                this.errors.push('Please try again later');
                reject(this.errors);
            })
        } else {
            reject(this.errors);
        }
    })
}

//not an object oriented approach, we store a property called findSingleById which is a function into 'Post'
//we can treat 'Post' as a constructor (OOP approach) and we can also call a simple function on it 
Post.findSingleById = function(id) { 
    return new Promise(async function(resolve, reject) { //async because we have await in the body of code below
        //check id isnt malicious and is just a string and id is an ObjectID
        if (typeof id !== 'string' || !ObjectID.isValid(id)) {
            reject()
            return; //return to end function entirely (in case malicious user tried to put in a non-string or invalid id into URL
        } 

        //go through database to find  _id. await because any database lookups are async
        //we need to wait for it to complete before it goes on in the code 
        let posts = await postsCollection.aggregate([
            {$match: {_id: new ObjectID(id)}}, //1st operation - looking for a match of _id prop with value of the id that was passed in (converted to mongodb ObjectID) 
            {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument' }},  //2nd operation -we are in posts collection, we need to lookup from 'users' collection. localfield - the field from within the current post item that we want to perform that match on is the author field, which contains the id of the matching user
            // looking for _id in foreignField.  mongodb will use 'authorDocument' to add an authorDocument property
            //$lookup will return an array 
            {$project: {
                title:1, 
                body: 1, 
                createdDate: 1, 
                author: {$arrayElemAt: ["$authorDocument", 0]} //we want the array element at the 0th position
            }} //project allows us to spell out exactly what fields we want resulting object to have 
        ]).toArray() 
        //aggregate performs multiple operations at once. aggregate returns mongodb obj, we convert to array so we can work with it 

        // clean up author prop in each post object 
        //posts will return an array 
        //we modify the posts so that in only includes username and avatar in the author prop
        posts = posts.map(function(post) {
            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })



        if (posts.length) {
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

module.exports = Post