const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Please add a valid email"],
  },
  role: {
    type: String,
    enum: ['user', 'publisher'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minLength: 6,
    select: false // Doesn't return the password in the api results
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using Bcrypt
UserSchema.pre('save', async function(next) {
  // If the password is not modified, move to the next middleware
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt)
})

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
}

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token, hash it and set it to the resetPasswordToken field
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set the expire time to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
}

module.exports = mongoose.model('User', UserSchema)
