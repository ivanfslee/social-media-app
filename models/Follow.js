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

Follow.prototype.validate = async function(action) { //action will be a string 'create' follow or 'delete' follow
    //check if user they want to follow is a valid account with doc in database 
    let followedAccount = await usersCollection.findOne({username: this.followedUsername})
    if (followedAccount) { //user they want to follow is found
        this.followedId = followedAccount._id;
    } else { //user they want to follow is not found 
        this.errors.push('You cannot follow a user that does not exist')
    }
    let doesFollowAlreadyExist = await followsCollection.findOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)})
    if (action === 'create') {
        //make sure follow not already in database
        if (doesFollowAlreadyExist) {this.errors.push('You are already following user')}
    } 
    
    if (action === 'delete') {
        if (!doesFollowAlreadyExist) {this.errors.push('You cannot stop following someone you do not follow')}
    }

    // should not be able to follow yourself
    if (this.followedId.equals(this.authorId)) {
        this.errors.push('You cannot follow yourself');
    }
}


Follow.prototype.create = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        await this.validate('create'); //pass in a string of 'create' to tell validate how to validate based on if we are deleting a follow or create a follow
        if (!this.errors.length) { //if no errors store follow to database
            await followsCollection.insertOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)}) //obj has 2 args, followedId is user they want to follow, authorId is current user doing the following
            resolve();
        } else { //there are errors
            reject(this.errors);
        }
    })
}

Follow.prototype.delete = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp();
        await this.validate('delete'); //pass in a string of 'delete' to tell validate how to validate based on if we are deleting a follow or create a follow
        if (!this.errors.length) { //if no errors store follow to database
            await followsCollection.deleteOne({followedId: this.followedId, authorId: new ObjectID(this.authorId)}) //obj has 2 args, followedId is user they want to follow, authorId is current user doing the following
            resolve();
        } else { //there are errors
            reject(this.errors);
        }
    })
}

Follow.isVisitorFollowing = async function(followedId, visitorId) {
    let followDoc = await followsCollection.findOne({followedId: followedId, authorId: new ObjectID(visitorId)});
    if (followDoc) {
        return true;
    } else {
        return false;
    }
}


module.exports = Follow;