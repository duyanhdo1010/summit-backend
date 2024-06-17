const { mongoose } = require('mongoose');

const slugify = require('slugify');

const TourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      require: [true, 'A tour must have a name!'],
      unique: true,
      maxlength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
    },
    slug: String,
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
    discount: {
      type: Number,
      default: 0,
      validate: {
        validator: function (val) {
          return val < this.price; // (điều kiện)
        },
        message: 'Discount ({VALUE}) should be below regular price', // nếu điều kiện sai
      },
    },
    locations: {
      type: [String],
      require: [true, 'A tour must have a location'],
    },
    startDates: [Date],
  },
  {
    timestamps: true,
  }
);

// run before save and create
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //tạo 1 trường slug
  next();
});

const Tour = mongoose.model('Tour', TourSchema);

module.exports = Tour;
