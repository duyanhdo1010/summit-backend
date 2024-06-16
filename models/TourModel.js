const { mongoose } = require('mongoose');

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      require: [true, 'A tour must have a name!'],
      unique: true,
    },
    description: {
      type: String,
      require: [true, 'A tour must have a description!'],
    },
    averageRating: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    imageCover: {
      type: String,
      require: [true, 'A tour must have a image cover!'],
    },
    duration: {
      type: Number,
      require: [true, 'A tour must have a duration'],
    },
    images: { type: [String] },
    maxGroupSize: {
      type: Number,
      require: [true, 'A tour must have a group size'],
    },
    price: { type: Number, require: [true, 'A tour must have a price'] },
    discount: { type: Number, default: 0 },
    locations: {
      type: [String],
      require: [true, 'A tour must have a location'],
    },
  },
  {
    timestamps: true,
  }
);

const Tour = mongoose.model('Tour', TourSchema);

module.exports = Tour;
