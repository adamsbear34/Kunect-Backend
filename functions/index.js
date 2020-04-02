const functions = require('firebase-functions');
const app = require('express')();
const {signup, login, uploadImage, addUserDetails, uploadResume} = require('./handlers/users');
const FBAuth = require('./util/fbAuth');
const { checkIn, showPlaces, checkInInfo, checkOut } = require('./handlers/checkins');


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





exports.api = functions.https.onRequest(app);