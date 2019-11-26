const usersCollection = require('../db').db().collection('users');
const followsCollection = require('../db').db().collection('follows');
const ObjectID = require('mongodb').ObjectID;
const User = require('./User');

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

Follow.getFollowersById = function(id) { //id is current user profile id we are logged in as 
    return new Promise(async (resolve, reject) => {
        try {
            //in aggregate, it takes an array of operations and each operation is an object 
            let followers = await followsCollection.aggregate([
                {$match: {followedId: id}}, //operation - finds any document in our follows collection where followedId field matches id that was passed into this function
                {$lookup: {from: 'users', localField: 'authorId', foreignField: '_id', as: "userDoc"}}, //userDoc will array 
                {$project: {
                    username: {$arrayElemAt: ['$userDoc.username', 0]},
                    email: {$arrayElemAt: ['$userDoc.email', 0]}
                }} //project will dictate the output of this aggregate method - 
                //ultimately, an array will be returned. each item in array will be an obj with prop username and email (from project)
            ]).toArray() //aggregate does a bunch of operations we define in mongodb. and the entire line resolves with the value of an array because it technically returns a promise
            followers = followers.map(function(follower) {
                let user = new User(follower, true); //true figures out users gravatar based on email address 
                return {username: follower.username, avatar: user.avatar} //we return username of who is doing the following and the avatar of who is doing the following 
            })
            resolve(followers);
        } catch {
            reject();
        }        
    })
}

Follow.getFollowingById = function(id) { //id is current user profile id we are logged in as 
    return new Promise(async (resolve, reject) => {
        try {
            //in aggregate, it takes an array of operations and each operation is an object 
            let followers = await followsCollection.aggregate([
                {$match: {authorId: id}}, //operation - finds any document in our follows collection where authorId field matches id that was passed into this function
                {$lookup: {from: 'users', localField: 'followedId', foreignField: '_id', as: "userDoc"}}, //userDoc will array 
                {$project: {
                    username: {$arrayElemAt: ['$userDoc.username', 0]},
                    email: {$arrayElemAt: ['$userDoc.email', 0]}
                }} //project will dictate the output of this aggregate method - 
                //ultimately, an array will be returned. each item in array will be an obj with prop username and email (from project)
            ]).toArray() //aggregate does a bunch of operations we define in mongodb. and the entire line resolves with the value of an array because it technically returns a promise
            followers = followers.map(function(follower) {
                let user = new User(follower, true); //true figures out users gravatar based on email address 
                return {username: follower.username, avatar: user.avatar} //we return username of who is doing the following and the avatar of who is doing the following 
            })
            resolve(followers);
        } catch {
            reject();
        }        
    })
}

Follow.countFollowersById = function(id) {
    return new Promise(async (resolve, reject) => {
        let followerCount = await followsCollection.countDocuments({followedId: id});
        resolve(followerCount);
    })
}

Follow.countFollowingById = function(id) {
    return new Promise(async (resolve, reject) => {
        let followingCount = await followsCollection.countDocuments({authorId: id});
        resolve(followingCount);
    })
}

module.exports = Follow;