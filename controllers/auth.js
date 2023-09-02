const ErrorResponse = require("../utils/errorResponse");
// const dotenv = require("dotenv");
// dotenv.config({ path: "./config/config.env" });
const User = require("../models/User");
const asyncHandler = require("../middleware/async");

// @desc    Register bootcamps
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

  // Create Token
  const token = user.getSignedJwtToken();
  res.status(200).json({ success: true, token: token });
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
  // Create Token
  const token = user.getSignedJwtToken();
  res.status(200).json({ success: true, token: token });
});