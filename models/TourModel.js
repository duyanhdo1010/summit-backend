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
      // hàm này chạy mỗi lần cái này có giá trị mới
      // hàm round này kiểu 4.6666 làm tròn thành 5 -> * 10 thành 46.666 làm tròn thành 47 xong /10 là đẹp
      set: (val) => Math.round(val * 10) / 10,
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
    // tạo trường ảo để khi nào cần (trường ảo là trường được tính từ trường khác, không lưu vào DB)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes (giúp tăng tốc cho việc query các trường nhưng đồng thời cũng tốn tài nguyên)
// 1 tăng dần -1 giảm dần
TourSchema.index({ price: 1, ratingsAverage: -1 });
TourSchema.index({ slug: 1 });

// Virtual Populate
TourSchema.virtual('reviews', {
  ref: 'Review', //chỉ định tên Model tham chiếu
  foreignField: 'tour', //kiểu khoá ngoại tham chiếu đến tour (là id) trong ReviewModel
  localField: '_id', //tham chiếu đến id của document hiện tại
});

// run before save and create
TourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); //tạo 1 trường slug
  next();
});

const Tour = mongoose.model('Tour', TourSchema);

module.exports = Tour;
