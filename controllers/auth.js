const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const sendEmail = require("../utils/sendEmail");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  sendTokenResponse(user, 200, res);
});

// @desc    Register bootcamps
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Validate email and password
  if (!email || !password) {
    return next (new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  // Note select was false in the user models hence above since it's needed here
  if (!user) {
    return next (new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next (new ErrorResponse("Invalid credentials", 401));
  }
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   POST /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)
  res.status(200).json({ success: true, data: user });
})

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expire: new Date(Date.now + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  }

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token: token });
}

// @desc    Forgot password
// @route   POST /api/auth/forgot password
// @access  Private
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next (new ErrorResponse("There is no user with that email", 404));
  }
  // Get reset token
  user.getResetPasswordToken();
  // Save the user
  await user.save({ validateBeforeSave: false });
  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${user.resetPasswordToken}`;
  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });
    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next (new ErrorResponse("Email could not be sent", 500));
  }
  res.status(200).json({ success: true, data: user });
})