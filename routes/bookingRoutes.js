const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true }); //để lấy tourId phía TourRoutes

router.use(authController.protect);

router.route('/me').get(bookingController.getMyBookings);
router
  .route('/')
  .post(bookingController.createBooking)
  .get(authController.restrictTo('admin'), bookingController.getAllBookings);

router.use(authController.restrictTo('admin'));

router
  .route('/:bookingId')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
