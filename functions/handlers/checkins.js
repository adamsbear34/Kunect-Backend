const { db } = require('../util/admin');

const config = require('../util/config');

/*
  This Cloud Function is for Check In
  In order to call this function, the POST request needed
  Also, the json should be send with the place_id, name, latitude and longtitude
  Example of JSON: {
    "place_id": "hwdv1jh2eDY12GD61udgcu",
    "name": "Starbucks Coffee",
    "lat": "298.257",
    "lng": "462.341"
  }
*/
exports.checkIn = (req, res) => {

  //  If flagPlaceExistence equals to 0 => Place does not exist in the database
  //  if flagPlaceExistence equals to 1 => Place exists in the database
  let flagPlaceExistence = 0;
  //  If checkInFlag equals to 0 => Current user is not checked in at any place
  //  If checkInFlag equals to 1 => Current user is checked in at some place
  let checkInFlag = 1;

  // Parse current user data
  db.collection("users").doc(req.user.handle)
    .get()
    .then(function(doc) {
      if (doc.exists) {
        userData = doc.data();
        checkInFlag = userData.checkInStatus;
        checkInIdFlag = userData.checkInId;
        userImage = userData.imageUrl;

        //  Create the respond with the checkInFlag and ImageUrl
        const respond = {
          imageUrl: userImage,
          checkInFlag: checkInFlag
        }
        return respond;
      } else {
        res.status(500).json({ error: "No such document!" });
      }})
    .then((respond) => {
        let bool = 0;

        // Check whether user is checked in or not. If yes => send an error. Else => continue
        if (respond.checkInFlag === 1) {
          bool = 1;
          res.status(500).json({ error: "You are already checked in!" });
        }

        //  Create the response with the Flag and imageUrl
        const respondNext = {
          bool: bool,
          imageUrl: respond.imageUrl
        }
        return respondNext;
    })
    .then((respondNext) => {
      //  Initialize the Place for CheckIn
      const place = {
        place_id: req.body.place_id,
        name: req.body.name,  //  Name of the Place
        lat: req.body.lat,  //  Latitude
        lng: req.body.lng,  //  Longtitude
        createdAt: new Date().toISOString(),
        users: [{name: req.user.handle, image: respondNext.imageUrl }]
      };

      // If user checked in => Search for checkin with the same place_id
      if (respondNext.bool === 0) {
        db.collection('checkins').orderBy('createdAt', 'desc')
          .get()
          .then(data => {
            let checkins = [];
            data.forEach(doc2 => {
              //  Add a new user to existed place
              //  If the check in with the same place_id found => add user to that check in
              if (doc2.data().place_id == place.place_id) {
                flagPlaceExistence = 1;
                usersArray = doc2.data().users;
                usersArray.push({name: req.user.handle, image: respondNext.imageUrl });

                //  Add new user to the found check in
                db.collection('checkins').doc(doc2.id).update({
                  users: usersArray
                });

                //  Change the checkInStatus of the user
                db.collection('users').doc(req.user.handle).update({
                  checkInStatus: 1,
                  checkInId: req.body.place_id
                });

                return res.json({ message: 'Hooray! You Checked In!' });
              }
            });

            //  If the check in with the same place_id was not found =>
            //  => create a new check in and add new user to that check in
            if (flagPlaceExistence == 0) {

              db.collection('checkins')
                .add(place)
                .then((doc) => {
                  const resCheckIn = place;
                  resCheckIn.placeId = doc.id;
                  res.json(resCheckIn);
                })
                .then(() => {
                  //  Change the checkInStatus of the user
                  db.collection('users').doc(req.user.handle).update({
                    checkInStatus: 1,
                    checkInId: req.body.place_id
                  });

                  return res.json({ message: 'Hooray! You checked In!' });
                })
                .catch((err) => {
                  res.status(500).json({ error: 'Something went wrong' });
                  console.error(err);
                });
            }
          })
          .catch(err => console.log(err));
      }
    })
    .catch(err => res.json({ message: 'Lol!' }));
}


/*
  This Cloud Function is for Check Out
  In order to call this function, the POST request needed
*/
exports.checkOut = (req, res) => {
  // Parse current user data
  db.collection("users").doc(req.user.handle)
    .get()
    .then(function(doc) {
      if (doc.exists) {
        userData = doc.data();
        checkInFlag = userData.checkInStatus;
        checkInId = userData.checkInId;
        return checkInFlag;
      } else {
        res.status(500).json({ error: 'No such a user!' });
    }})
    .then((checkInFlag) => {
      //  IF user Checked In => Check out
      //  ELSE => Throw an ERROR
      if (checkInFlag === 1) {
        //  Change the CheckInStatus of the user
        db.collection('users').doc(req.user.handle).update({
          checkInStatus: 0,
          checkInId: ""
        });

        //  Search for the Check In
        db.collection('checkins').orderBy('createdAt', 'desc')
          .get()
          .then(data => {
            let checkins = [];
            data.forEach(doc2 => {
              //  If the place was found => Check Out
              //  If the last user Checked Out =>  Delete the Place from the DataBase
              if (doc2.data().place_id == checkInId) {
                usersArray = doc2.data().users;
                if (usersArray.length < 2) {
                  db.collection("checkins").doc(doc2.id)
                    .delete()
                    .then(function() {
                      console.log("Document successfully deleted!");
                    })
                    .catch(function(error) {
                      console.error("Error removing document: ", error);
                    });
                }

                for(var i = usersArray.length - 1; i >= 0; i--) {
                  if(usersArray[i].name === req.user.handle) {
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
    });
}

/*
  This Cloud Function is for retrieving Check In information
  In order to call this function, the GET request needed
*/
exports.checkInInfo = (req, res) => {
  //  Parse all the User Information ...
  db.collection("users").doc(req.user.handle)
    .get().then(function(doc) {
      if (doc.exists) {
        userData = doc.data();
        checkInFlag = userData.checkInStatus;
        checkInId = userData.checkInId;
        return checkInFlag;
      } else {
        res.status(500).json({ error: 'No such a user!' });
      }}).then((checkInFlag) => {  //  Check if user is checked in or not
        let bool = 1;
        if (checkInFlag === 0) {
          bool = 0;
          res.status(500).json({ error: "You are not checked in!" });
          return bool;
        }
        return bool;
      }).then((bool) => {
        if (bool === 1) {
          let usersDataTemp = [];
          let userInformation = [];

          //  If user is checked in => send the check in information back
          db.collection('checkins').orderBy('createdAt', 'desc').get()
            .then(data => {
                data.forEach(docCheckIn => {
                  if (docCheckIn.data().place_id === checkInId) {
                    usersArray = docCheckIn.data().users;
                    placeName = docCheckIn.data().name;

                    const checkInInformation = {
                      place_id: checkInId,
                      name: placeName,
                      users: usersArray
                    }
                    return res.json(checkInInformation);
                  }
                })
            });
        }
      });
}

/*
  This Cloud Function is for retrieving all the Checkins from the DataBase
  with all the information about it
  In order to call this function, the GET request needed
*/
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
