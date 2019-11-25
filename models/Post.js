const postsCollection = require('../db').db().collection('posts');               
//require('../db') is the client.    
//require('../db').db() gets the actual database.  
//.collection('posts') gives us access to posts collection in database 

const ObjectID = require('mongodb').ObjectID; //mongoDB treats ids specially. Essentially, we create an objectId object type 

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
            return; 
        } 

        //go through database to find  _id - await because any database lookups are async
        //we need to wait for it to complete before it goes on in the code 
        let post = await postsCollection.findOne({_id: new ObjectID(id)}); 
        if (post) {
            resolve(post)
        } else {
            reject()
        }
    })
}

module.exports = Post