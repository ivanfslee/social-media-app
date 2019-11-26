const express = require('express');
const router = express.Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');

// user routes
router.get('/', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen)

// creating posts routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.create);
router.get('/post/:id', postController.viewSingle); //:id is flexible address after '/post/'. We also dont include mustBeLoggedIn middleware because we want public to be able to see posts
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.viewEditScreen);
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.edit);
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.delete);
router.post('/search', postController.search);

// follow user routes
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow);

module.exports = router;