//var UserService = require('./services/user/es5/UserService');
var sessionDB = require('../config/database');

module.exports = function(app, passport) {

// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {

      //get suggestions
      var suggestions = [];
      sessionDB
        .run('MATCH (n:User) RETURN n')
        .then(function(results) {
          sessionDB.close();
          results.records.forEach(function(result) {
            suggestions.push(result._fields[0].properties);
          });
          console.log(JSON.stringify(suggestions));
          res.render('profile.ejs', {
              user : req.user,
              suggestions: suggestions
          });
        })
        .catch(function(err) {
          console.log(err);
        });

    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        app.get('/user/addfriend', function(req, res) {
          var idUserToAdd = req.query.id;
          var idLoggedUser = req.user.id;
          console.log(req);
          console.log('idUserToAdd => ' + idUserToAdd);
          console.log('idLoggedUser => ' + idLoggedUser);

          sessionDB
            .run('MATCH (a:User {id: {idUser}}), (b:User {id: {idUserFriend}}) MERGE(a)-[r:FRIEND_WITH]-(b) RETURN a,b', {idUser: idLoggedUser, idUserFriend: idUserToAdd})
            .then(function(results) {
              sessionDB.close();

              res.redirect('/profile');

            })
            .catch(function(err) {
              console.log(err);
            });

        });

        app.get('/user/listfriends', function(req, res) {

          var idLoggedUser = req.user.id;
          var friends = [];
          sessionDB
            .run('MATCH (a:User {id: {idUser}})-[r:FRIEND_WITH]->(friends) RETURN friends', {idUser: idLoggedUser})
            .then(function(results) {
              sessionDB.close();
                results.records.forEach(function(result) {
                  friends.push(result._fields[0].properties);
                });
                res.render('friends.ejs', {
                    user : req.user,
                    friends: friends
                });
              //res.json(friends);

            })
            .catch(function(err) {
              console.log(err);
            });

        });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
