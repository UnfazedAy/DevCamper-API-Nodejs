const ErrorResponse = require("../utils/errorResponse");
const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const geocoder = require("../utils/geocoder");
const Course = require("../models/Course");
const asyncHandler = require("../middleware/async");

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// access   Public

exports.getCourses = asyncHandler(async (req, res, next) => {
  let query;

  if (req.params.bootcampId) { // If there is a bootcampId in the params
    query = Course.find({ bootcamp: req.params.bootcampId });
  } else {
    query = Course.find().populate({ // Populate the bootcamp field with the name and description
      path: "bootcamp",
      select: "name description"
    });
  }

  const courses = await query;
  res.status(200).json({
    success: true,
    count: courses.length,
    data: courses
  });
});