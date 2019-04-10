const passport = require('passport');
const Credentials = require('../models/credentials');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

const jwtLogin = new JwtStrategy(jwtOptions, function (payload, done) {

    // If the token is expired, return 401 Unauthorized with no further information.
    const currentTime = new Date().getTime();
    if (payload.exp > currentTime) {
        return done(null, false);
    }

    Credentials.default.find({_id: {$eq: payload.sub}}, function (err, user) {
        if (err) {
            return done(err, false)
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false)
        }
    })
});

// Tell passport to use this strategy
passport.use(jwtLogin);
