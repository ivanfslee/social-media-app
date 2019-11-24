const postsCollection = require('../db').db().collection('posts');               
//require('../db') is the client.    
//require('../db').db() gets the actual database.  
//.collection('posts') gives us access to posts collection in database 

let Post = function(data) {
    this.data = data;
    this.errors = [];
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
        createdDate: new Date() //built in JS constructor for date objects 
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

module.exports = Post