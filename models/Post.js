const postsCollection = require('../db').db().collection('posts');               
//require('../db') is the client.    
//require('../db').db() gets the actual database.  
//.collection('posts') gives us access to posts collection in database 


const ObjectID = require('mongodb').ObjectID; //mongoDB treats ids specially. Essentially, we create an objectId object type 

const User = require('./User')
const sanitizeHTML = require('sanitize-html');
let Post = function(data, userid, requestedPostId) {
    this.data = data;
    this.errors = [];
    this.userid = userid;
    this.requestedPostId = requestedPostId;
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
        title: sanitizeHTML(this.data.title.trim(), {allowedTags: [], allowedAttributes: {}}),
        body: sanitizeHTML(this.data.body.trim(), {allowedTags: [], allowedAttributes: {}}), //first arg is what we want to sanitize, second arg is configuration - sanitize so malicious users cannot execute javascript or html from the post 
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
            postsCollection.insertOne(this.data).then((info) => {
                resolve(info.ops[0]._id); //new post will have ops array in it, we want the id prop in that array - this will go to postController's create method 
            }).catch(function() {
                this.errors.push('Please try again later');
                reject(this.errors);
            })
        } else {
            reject(this.errors);
        }
    })
}

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        //find relevant post document in database 
        //we need to check if post id is validated 
        //we need to check if the visitor is the owner of the post as well
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userid); //findSingleById returns a promise 
            //if
            if (post.isVisitorOwner) {
                // visitor is the owner of the post
                //update the db 
                let status = await this.actuallyUpdate(); //this actuallyUpdate method will update the database and resolves to 'success' or 'failure'
                resolve(status);
            } else {
                //visitor not the owner
                reject();
            }
        } catch {
            reject();
        }
    })
}


Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        this.validate();
        if (!this.errors.length) { //no validation errors, so update the database
            await postsCollection.findOneAndUpdate({_id: new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}}) //first arg is the id we want to match, second arg is setting what we want to change, the title and body of the post
            resolve('success');
        } else {
            //there are validation errors
            resolve('failure');
        }
    })
}





//not an object oriented approach, we store a property called findSingleById which is a function into 'Post'
//we can treat 'Post' as a constructor (OOP approach) and we can also call a simple function on it 
Post.reusablePostQuery = function(uniqueOperations, visitorId) { 
    return new Promise(async function(resolve, reject) { //async because we have await in the body of code below
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: 'users', localField: 'author', foreignField: '_id', as: 'authorDocument' }},  //2nd operation -we are in posts collection, we need to lookup from 'users' collection. localfield - the field from within the current post item that we want to perform that match on is the author field, which contains the id of the matching user
            // looking for _id in foreignField.  mongodb will use 'authorDocument' to add an authorDocument property
            //$lookup will return an array 
            {$project: {
                title:1, 
                body: 1, 
                createdDate: 1, 
                authorId: '$author', //mongodb - dollar sign in quotes means you are trying to access that field - so here we are accessing the original author field that contains the id and setting it to new prop 'authorId'
                author: {$arrayElemAt: ["$authorDocument", 0]} //we want the array element at the 0th position
            }} //project allows us to spell out exactly what fields we want resulting object to have 
        ])
        //go through database to find  _id. await because any database lookups are async
        //we need to wait for it to complete before it goes on in the code 
        let posts = await postsCollection.aggregate(aggOperations).toArray() 
        //aggregate performs multiple operations at once. aggregate returns mongodb obj, we convert to array so we can work with it 

        // clean up author prop in each post object 
        //posts will return an array 
        //we modify the posts so that in only includes username and avatar in the author prop
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId); //equals method returns true or false - we use that new authorId to determine if user accessing post is the author or visitor 
            post.authorId = undefined; //we don't need authorId anymore so we set it to undefined - authorId was only used to determine the previous line of code - if isVisitorOwner true or false

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts);
    })
}


//not an object oriented approach, we store a property called findSingleById which is a function into 'Post'
//we can treat 'Post' as a constructor (OOP approach) and we can also call a simple function on it 
Post.findSingleById = function(id, visitorId) { 
    return new Promise(async function(resolve, reject) { //async because we have await in the body of code below
        //check id isnt malicious and is just a string and id is an ObjectID
        if (typeof id !== 'string' || !ObjectID.isValid(id)) {
            reject()
            return; //return to end function entirely (in case malicious user tried to put in a non-string or invalid id into URL
        } 

        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectID(id)}}
        ], visitorId)

        if (posts.length) {
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findByAuthorId = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createdDate: -1}} //sort the posts by created date, by descending date (-1 is descending, 1 would be ascending)
    ]);
}


Post.delete = function(postIdToDelete, currentUserId) {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(postIdToDelete, currentUserId); //findSingleById will add a prop called isVisitorOwner (via resuablePostQuery call)
            if (post.isVisitorOwner) {
                await postsCollection.deleteOne({_id: new ObjectID(postIdToDelete)})
                resolve()
            } else {
                //someone trying to delete post they dont own
                reject()
            }
        } catch {
            //post id is not valid or post does not exist
            reject()
        }
    })
}


Post.search = function(searchTerm) {
    return new Promise(async (resolve, reject) => {
        //verify search term is just a string a not an object - from malicious user
        if (typeof searchTerm === 'string') { 
            let posts = await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}}, //perform text search - we need to create an index of our titles and body of posts in our mongoDB so the results are cached already -otherwise search is an incredibly taxing operation on the database without indexing
                {$sort: {score : {$meta: 'textScore'}}}
            ]) //sort results by textScore
            //resuablePostQuery takes an array of operations as an argument
            //we give it a match and sort operation to perform on the database 
            resolve(posts);
        } else {
            reject();
        }
    })
}

Post.countPostsByAuthor = function(id) {
    return new Promise(async (resolve, reject) => {
        let postCount = await postsCollection.countDocuments({author: id});
        resolve(postCount);
    })
}



module.exports = Post