const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;

let Follow = function(followedUsername, authorId) { //passed in  - user they want to follow, current user
    this.followedUsername = followedUsername;
    this.authorId = authorId;
    this.errors = [];
}


Follow.prototype.cleanUp = function() {
    //clean up followedUsername
    if (typeof this.followedUsername !== 'string') {
        this.followedUsername = '';
    }
}

Follow.prototype.validate = async function() {
    //check if user they want to follow is a valid account with doc in database 
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) { //user they want to follow is found
        this.followedId = followedAccount._id;
    } else { //user they want to follow is not found 
        this.errors.push('You cannot follow a user that does not exist')
    }
}


Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        await this.validate();
        if (!this.errors.length) { //if no errors store follow to database
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)}) //obj has 2 args, followedId is user they want to follow, authorId is current user doing the following
            resolve();
        } else { //there are errors
            reject(this.errors);
        }
    })
}



module.exports = Follow;