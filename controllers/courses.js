const ErrorResponse = require("../utils/errorResponse");
const Course = require("../models/Course");
const asyncHandler = require("../middleware/async");
const Bootcamp = require("../models/Bootcamp");

// @desc    Get all courses
// @route   GET /api/v1/courses
// @route   GET /api/v1/bootcamps/:bootcampId/courses
// access   Public

exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) { // If there is a bootcampId in the params
    const courses = await Course.find({ bootcamp: req.params.bootcampId });
    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    })
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc    Get single courses
// @route   GET /api/v1/courses/:id
// access   Public

exports.getCourse = asyncHandler(async (req, res, next) => {
  const courses = await Course.findById(req.params.id).populate({
    path: 'bootcamp',
    select: 'name description'
  });

  if (!courses) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  res.status(200).json({
    success: true,
    data: courses
  });
});

// @desc    Add a courses
// @route   POST /api/v1/bootcamps/:bootcampId/courses
// access   Private

exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id; // req.user is set in the protect middleware

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`No bootcamp with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  if(bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to add a course to bootcamp ${bootcamp._id}`, 401)
    );
  }
  const course = await Course.create(req.body);

  res.status(201).json({
    success: true,
    data: course
  });
});

// @desc    Update course
// @route   POST /api/v1/courses/:id
// access   Private

exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  if(course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update course ${course._id}`, 401)
    );
  }
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: course
  });
});

// @desc    Delete course
// @route   delete /api/v1/courses/:id
// access   Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`),
      404
    );
  }

  // Make sure user is course owner
  if(course.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete course ${course._id}`, 401)
    );
  }

  await course.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});