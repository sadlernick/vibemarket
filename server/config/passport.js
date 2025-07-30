const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Only configure Google OAuth if credentials are provided and not placeholder values
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && 
                           process.env.GOOGLE_CLIENT_SECRET &&
                           process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here' &&
                           process.env.GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here';

if (isGoogleConfigured) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let user = await User.findOne({ 'oauth.google.id': profile.id });
      
      if (user) {
        return done(null, user);
      }
      
      // Check if user exists with same email
      user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        // Link Google account to existing user
        user.oauth.google = {
          id: profile.id,
          email: profile.emails[0].value
        };
        await user.save();
        return done(null, user);
      }
      
      // Create new user
      user = new User({
        username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
        email: profile.emails[0].value,
        profileImage: profile.photos[0]?.value || null,
        oauth: {
          google: {
            id: profile.id,
            email: profile.emails[0].value
          }
        },
        isVerified: true
      });
      
      await user.save();
      done(null, user);
      
    } catch (error) {
      done(error, null);
    }
  }));
}

// Apple OAuth strategy would go here when Apple Developer account is available
// For now, we'll implement the route structure to support it

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;