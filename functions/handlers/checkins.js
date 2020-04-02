const { db } = require('../util/admin');

const config = require('../util/config');

/*
  {
  "place_id": "ChIJrTLr-GyuEmsRBfy61i59si0",
  "name": "Australian Cruise Group",
  "lat": "-33.867591",
  "lng": "151.201196"
  }
 */

/*
 {
   "email": "testingUser@gmail.com",
   "password": "qwerty1234"
 }
 */

exports.checkIn = (req, res) => {

  let flag = 0;
  let flagId = "";

  const place = {
    place_id: req.body.place_id,
    name: req.body.name,  //  Name of the Place
    lat: req.body.lat,  //  Latitude
    lng: req.body.lng,  //  Longtitude
    createdAt: new Date().toISOString(),
    users: [req.user.handle]
  }

  //  Parse all the User Information ...
  db.collection("users").doc(req.user.handle)
    .get().then(function(doc) {
      if (doc.exists) {
        userData = doc.data();
        checkInFlag = userData.checkInStatus;
        checkInIdFlag = userData.checkInId;
      } else {
        console.log("No such document!");
      }}).catch(function(error) {
        console.log("Error getting document: ", error);
      });

  if (checkInFlag === 1) {
    return res.status(500).json({ error: "You are already Checked In!" });
  } else {
    db.collection('checkins').orderBy('createdAt', 'desc').get()
      .then(data => {
          let checkins = [];
          data.forEach(doc2 => {
            //  Add a new user to existed place
            if (doc2.data().place_id == place.place_id) {
              flag = 1;
              flagId = doc2.data().placeId;
              usersArray = doc2.data().users;
              usersArray.push(req.user.handle);

              db.collection('checkins').doc(doc2.id).update({
                users: usersArray
              });

              db.collection('users').doc(req.user.handle).update({
                checkInStatus: 1,
                checkInId: req.body.place_id
              });

              return res.json({ message: 'Hooray! You checked in!' });
            }
          });

          //  Create a New Place
          if (flag == 0){
            db.collection('checkins')
              .add(place)
              .then((doc) => {
                const resCheckIn = place;
                resCheckIn.placeId = doc.id;
                res.json(resCheckIn);
              })
              .then(() => {
                db.collection('users').doc(req.user.handle).update({
                  checkInStatus: 1,
                  checkInId: req.body.place_id
                });
              })
              .catch((err) => {
                res.status(500).json({ error: 'something went wrong' });
                console.error(err);
              });
          }
      })
      .catch(err => console.log(err));
  }
}

exports.checkOut = (req, res) => {
  db.collection("users").doc(req.user.handle)
    .get().then(function(doc) {
      if (doc.exists) {
        userData = doc.data();
        checkInFlag = userData.checkInStatus;
        checkInId = userData.checkInId;
      } else {
        res.status(500).json({ error: 'No such a user!' });
      }}).catch(function(error) {
        res.status(500).json({ error: 'Error getting a user!' });
      });

  if (checkInFlag === 1 && checkInId != "") {
    db.collection('users').doc(req.user.handle).update({
      checkInStatus: 0,
      checkInId: ""
    });

    db.collection('checkins').orderBy('createdAt', 'desc').get()
      .then(data => {
          let checkins = [];
          data.forEach(doc2 => {
            if (doc2.data().place_id == checkInId) {
              usersArray = doc2.data().users;
              if (usersArray.length < 2) {
                db.collection("checkins").doc(doc2.id).delete().then(function() {
                    console.log("Document successfully deleted!");
                }).catch(function(error) {
                    console.error("Error removing document: ", error);
                });
              }
              for(var i = usersArray.length - 1; i >= 0; i--) {
                  if(usersArray[i] === req.user.handle) {
                      usersArray.splice(i, 1);
                  }
              }
              db.collection('checkins').doc(doc2.id).update({
                users: usersArray
              });
            } else {
              res.status(500).json({ error: 'something went wrong' });
            }
          })
        });

    return res.json({ message: 'Hooray! You checked out!' });
  } else {
    return res.json({ message: 'You cannot checkout if you are not checked in!' });
  }
}

exports.checkInInfo = (req, res) => {
  //  Parse all the User Information ...
  db.collection("users").doc(req.user.handle)
    .get().then(function(doc) {
      if (doc.exists) {
        userData = doc.data();
        checkInFlag = userData.checkInStatus;
        checkInId = userData.checkInId;
      } else {
        res.status(500).json({ error: 'No such a user!' });
      }}).catch(function(error) {
        res.status(500).json({ error: 'Error getting a user!' });
      });

  let usersDataTemp = [];

  if (checkInFlag === 0) {
    res.status(500).json({ error: 'You are not checked in' });
  } else {
    db.collection('checkins').orderBy('createdAt', 'desc').get()
      .then(data => {
          data.forEach(doc2 => {
            if (doc2.data().place_id === checkInId) {
              usersArray = doc2.data().users;
              placeName = doc2.data().name;

              for (var i = 0; i < usersArray.length; i++) {
                db.collection("users").doc(usersArray[i])
                  .get().then(function(doc) {
                    if (doc.exists) {
                      userData = doc.data();
                      usersDataTemp.push(userData);
                    } else {
                      res.status(500).json({ error: 'No such a user!' });
                    }}).catch(function(error) {
                      res.status(500).json({ error: 'Error getting a user!' });
                    });
              }

              res.json(usersDataTemp);

              const checkInInformation = {
                place_id: checkInId,
                name: placeName,
                users: usersDataTemp
              }

              res.json(checkInInformation);
            }
          })
      });
  }
}

exports.showPlaces = (req, res) => {
  db.collection('checkins').orderBy('createdAt', 'desc').get()
      .then(data => {
          let checkins = [];
          data.forEach(doc => {
              checkins.push(
                {
                  place_id: doc.data().place_id,
                  name: doc.data().name,
                  lat: doc.data().lat,
                  lng: doc.data().lng,
                  createdAt: doc.data().createdAt,
                  users: doc.data().users
                }
              );
          });
          return res.json(checkins);
      })
      .catch(err => console.log(err));
}
