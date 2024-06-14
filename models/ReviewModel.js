const { mongoose } = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      require: [true, 'A review must have content'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      require: [true, 'a review need a user'],
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      require: [true, 'a review need a tour'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    timestamp: true,
  }
);

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
