// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;

var sessionDB = require('./database');

var uuid = require('node-uuid');

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        console.log(JSON.stringify(user));
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {

      sessionDB
        .run('MATCH (n:User {id: {idParam}}) RETURN n', {idParam: id})
        .then(function(result) {

          done(null, result.records[0]._fields[0].properties);
        })
        .catch(function(err) {
          console.log(err);
        });

    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {
        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
          sessionDB
            .run('MATCH (n:User {email:{emailParam} }) RETURN n', {emailParam: email})
            .then(function(result) {

              if(result.records.length === 0) {
                return done(null, false, req.flash('loginMessage', 'No user found.'));
              }

              if (! (result.records[0]._fields[0].properties.password === password) ) {
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
              }

              else {
                console.log('login succeded');
                return done(null, result.records[0]._fields[0].properties);
              }

            })
            .catch(function(err) {
              console.log(err);
            });

        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
          // by default, local strategy uses username and password, we will override with email
          usernameField : 'email',
          passwordField : 'password',
          passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
      },
      function(req, email, password, done) {
  
        var firstname = req.body.firstname;
        var lastname = req.body.lastname;
        var password = req.body.password;
        var email = req.body.email;

        if (email)
            email = email.toLowerCase(); // Use lower-case e-mails to avoid case-sensitive e-mail matching

        // asynchronous
        process.nextTick(function() {
            // if the user is not already logged in:
            if (!req.user) {
              var uid = uuid.v4();
              sessionDB
                .run('CREATE(n:User {id: {idParam}, firstname:{firstnameParam}, lastname: {lastnameParam}, email: {emailParam}, password: {passwordParam} }) RETURN n',
                {idParam: uid, firstnameParam: firstname, lastnameParam: lastname, emailParam: email, passwordParam: password})
                .then(function(result) {
                  console.log('result = ' + result)
                  return done(null, result.records[0]._fields[0].properties);
                })
                .catch(function(err) {
                  console.log(err);
                });

            // if the user is logged in but has no local account...
            }  else {

                // user is logged in and already has a local account. Ignore signup. (You should log out before trying to create a new account, user!)
                return done(null, req.user);
            }

        });

    }));

};
