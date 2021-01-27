const router = require('express').Router()
const passport = require('passport')

router.get('/twitch', passport.authenticate('twitch', { scope: 'user_read' }))

// Set route for OAuth redirect
router.get('/twitch/callback', passport.authenticate('twitch', { successRedirect: '/auth/api/current_user', failureRedirect: '/failed' }))
// http://localhost:3001

router.get('/api/current_user', (req, res) => {
    console.log(req)
})

router.get('/api/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

module.exports = router