const express = require('express');

router.use('/:tourId/reviews', reviewRouter);

const router = express.Router();
module.exports = router;
