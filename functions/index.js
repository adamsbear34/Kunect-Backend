const functions = require('firebase-functions');
const app = require('express')();

const FBAuth = require('./util/fbAuth');
const { checkIn, showPlaces, checkInInfo, checkOut } = require('./handlers/checkins');
const { signup, login, uploadImage, addUserDetails,uploadResume, getTheImage } = require('./handlers/users');

//User Routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails)
app.post('/user/resume', FBAuth, uploadResume);

app.post('/checkIn', FBAuth, checkIn);
app.get('/retrieveCheckins', showPlaces);
app.get('/checkInInfo', FBAuth, checkInInfo);
app.post('/checkOut', FBAuth, checkOut);
app.get('/getTheImage', FBAuth, getTheImage);





exports.api = functions.https.onRequest(app);