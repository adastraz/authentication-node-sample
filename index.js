var express        = require('express')
const mongoose = require('mongoose')
const cookieSession = require('cookie-session')
const keys = require('./config/keys.js')
var passport       = require('passport')
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy
var request        = require('request')
var handlebars     = require('handlebars')
const cors = require('cors')
const helmet = require('helmet')
const authRouter = require('./routes/auth-routes')
require('./models/users')

mongoose.connect(keys.mongoURI, { useNewUrlParser: true })

// Define our constants, you will change these with your own
const CALLBACK_URL     = 'https://twitch-auth-0.herokuapp.com/auth/twitch/callback'  // You can run locally with - http://localhost:3000/auth/twitch/callback

// Initialize Express and middlewares
const app = express()
app.use(helmet())
app.use(cors())
app.use(express.json())
// app.use(session({secret: SESSION_SECRET, resave: false, saveUninitialized: false}));

app.use(
  cookieSession({ 
      maxAge: 5 * 60 * 60 * 1000,
      keys: [keys.cookieKey],
      secure: true
  })
)

const User = mongoose.model('users')
app.use(passport.initialize())
app.use(passport.session())

// Override passport profile function to get user profile from Twitch API
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  var options = {
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      'Client-ID': keys.TWITCH_CLIENT_ID,
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Authorization': 'Bearer ' + accessToken
    }
  }

  request(options, function (error, response, body) {
    if (response && response.statusCode == 200) {
      done(null, JSON.parse(body))
    } else {
      done(JSON.parse(body))
    }
  })
}

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findById( id, (err, user) => {
    if(err){
        done(null, false, {error:err})
    } else {
        done(null, user)
    }
  })
})

passport.use('twitch', new OAuth2Strategy({
    authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: keys.TWITCH_CLIENT_ID,
    clientSecret: keys.TWITCH_SECRET,
    callbackURL: '/auth/twitch/callback',
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken
    profile.refreshToken = refreshToken
    const existing = await User.findOne({ twitchID: profile.data[0].id })
      if(existing){
        return done(null, existing)
      }
      const user = await new User({ twitchID: profile.data[0].id, username: profile.data[0].display_name })
        .save()
      done(null, { user: user, accessToken: profile.accessToken })
    // done(null, profile)

    // Securely store user profile in your DB
    //User.findOrCreate(..., function(err, user) {
    //  done(err, user);
    //});
  }
))

app.use('/auth', authRouter)

app.get('/', function (req, res) {
  res.send('login to get data')
})

const PORT = process.env.PORT || 3000

app.listen(PORT, function () {
  console.log(`Twitch auth sample listening on port ${PORT}!`)
})
