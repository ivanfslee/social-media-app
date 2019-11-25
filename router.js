const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');

// user routes
router.get('/', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// creating posts routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.create);
router.get('/post/:id', postController.viewSingle); //:id is flexible address after '/post/'. We also dont include mustBeLoggedIn middleware because we want public to be able to see posts
module.exports = router;