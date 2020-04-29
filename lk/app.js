const express = require('express');
const request = require('request');
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
const cookieSession = require('cookie-session');

const profileURL = 'https://id.trusted.plus/trustedapp/rest/user/profile/get';

const app = express();

// cookieSession config
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000,
  keys: ['secret-personalize']
}));

app.use(passport.initialize());
app.use(passport.session());

//Strategy config

passport.use(new OAuth2Strategy({
  authorizationURL: 'https://id.trusted.plus/idp/sso/oauth',
  tokenURL: 'https://id.trusted.plus/idp/sso/oauth/token',
  clientID: 'cefda20f222e588b07921d8ae15b04fe',
  clientSecret: '11111111',
  callbackURL: "https://lk.kloud.one/auth/oauth2/callback",
  response_type: 'code',
  scope: 'userprofile'
},
  (accessToken, refreshToken, profile, done) => {
    done(null, accessToken);
  }
));

// Used to decode the received cookie and persist session

passport.deserializeUser((user, done) => {
  done(null, user);

});

passport.serializeUser(function (user, done) {
  done(null, user);
});

function getProfile(profileURL, access_token, cb) {
  request({
    url: profileURL,
    headers: { 'Authorization': "Bearer " + access_token },
    jar: true
  }, function (err, resp, data) {
    if (err) return cb(null);
    try {
      cb(JSON.parse(data).data);
    } catch (e) { cb(null) }
  })
}
// Middleware to check if the User is authenticated

app.get('/auth/oauth2', passport.authenticate('oauth2'));

function isUserAuthenticated(req, res, next) {
  if (req.user) {
    next();
  } else {
    //res.send('you must login!');
    res.redirect('/auth/oauth2');
  }
}

// Routes
// The middleware receives the data from AuthPRovider and runs the function on Strategy config

app.get('/auth/oauth2/callback', passport.authenticate('oauth2'), (req, res) => {
  res.redirect('/profile');
});

// secret route

app.get('/profile', isUserAuthenticated, (req, res) => {
  getProfile(profileURL, req.user, (profile) => res.send(profile))
});

// Logout route

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

app.use(express.static('public'));

app.listen(8000, () => {
  console.log('Server Started 8000');
});