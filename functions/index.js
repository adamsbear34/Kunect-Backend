const functions = require('firebase-functions');
const app = require('express')();
const {signup, login, uploadImage, addUserDetails, uploadResume} = require('./handlers/users');
const FBAuth = require('./util/fbAuth');


//User Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails)
app.post('/user/resume', FBAuth, uploadResume);





exports.api = functions.https.onRequest(app);






