const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');
const router = express.Router();

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-tours')
  .get(
    authController.protect,
    tourController.aliasTopTours,
    tourController.getAllTours
  );

router
  .route('/tour-stats')
  .get(authController.protect, tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(authController.protect, tourController.getMonthlyPlan);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, tourController.updateTour)
  .delete(authController.protect, tourController.deleteTour);

module.exports = router;
