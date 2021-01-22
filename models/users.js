const mongoose = require('mongoose')
const { Schema } = mongoose

const userSchema = new Schema({
    twitchID: { type: String, required: true },
    username: { type: String, required: true },
    is_player: { type: Boolean, default: false }
})

mongoose.model('users', userSchema)