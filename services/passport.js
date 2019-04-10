const passport = require('passport');
const Credentials = require('../models/credentials');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;


//Setup options for JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};

// Create JWT strategy
const jwtLogin = new JwtStrategy(jwtOptions, function (payload, done) {
  //See if the user ID in the payload exists in our database
  // if it does, call 'done' with that other
  // otherwise, call done with a user object
  Credentials.default.find({_id: {$eq: payload.sub}}, function (err, user) {
    if (err) {
      return done(err, false)
    }
    if (user) {
      done(null, user)
    } else {
      done(null, false)
    }
  })
});

// Tell passport to use this strategy
passport.use(jwtLogin);
