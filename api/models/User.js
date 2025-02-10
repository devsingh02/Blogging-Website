const mongoose = require('mongoose');
const {Schema, model} = mongoose;

// throws error if following conditions are not met
const UserSchema = new Schema({
  username: {type: String, required: true, min: 4, unique: true},
  password: {type: String, required: true},
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;