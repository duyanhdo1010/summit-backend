const { mongoose } = require('mongoose');
const Tour = require('./tourModel');

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
      min: [1, 'Rating must be more than or equal to 1'],
      max: [5, 'Rating must be less than or equal to 5'],
    },
  },
  {
    timestamps: true,
    // tạo trường ảo để khi nào cần (trường ảo là trường được tính từ trường khác, không lưu vào DB)
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Sự kết hợp giữa tour và user trong 1 review phải là duy nhất
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

ReviewSchema.pre(/^find/, function (next) {
  this //giờ đây chỉ lấy dữ liệu review trên tour thôi còn review để biết nó ở tour nào là được rồi
    // .populate({
    //   path: 'tour',
    //   select: 'name',
    // })
    .populate({
      path: 'user',
      select: 'name photo',
    });
  next();
});

// statics (gọi luôn từ modal (Review.calcAverageRatings())) thay vì (methods gọi trên doc)
ReviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this trỏ đến modal hiện tại
  const stats = await this.aggregate([
    {
      // lấy các review của tour mà mình truyền vào
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, // +1 khi đi qua mỗi bản ghi đã match
        avgRating: { $avg: '$rating' }, //tính trung bình của tất cả các rating mỗi bản ghi đã match
      },
    },
  ]);
  // cập nhật giá trị vào tour
  if (stats.length > 0) {
    //vì delete hết thì stats bằng [] nên không lấy được các biến

    await Tour.findByIdAndUpdate(tourId, {
      averageRating: stats[0].avgRating,
      ratingQuantity: stats[0].nRating,
    });
  } else {
    // nếu bị xoá hết review trả về giá trị mặc định
    await Tour.findByIdAndUpdate(tourId, {
      averageRating: 4.5,
      ratingQuantity: 0,
    });
  }
};

// để post vì pre thì chưa có dữ liệu review hẳn --> chưa có tourID
ReviewSchema.post('save', function () {
  //post không có next
  // this là review hiện tại
  // this.constructor chính là Review nhưng ở đây ta không thể gọi vào Review được
  // cho dù nếu chuyển cái này xuống dưới phần khai báo Review thì cái pre.save không gọi được vì đã chốt schema rồi
  this.constructor.calcAverageRatings(this.tour);
});

// Tính toán lại số lượng và rating trung bình
// findByIdAndUpdate && findByIdAndDelete
// Bản thân 2 cái trên cùng là FindOneAnd với id được truyền vào
ReviewSchema.pre(/^findOneAnd/, async function (next) {
  // gán vào biến r để mình sử dụng được trong middleware tiếp theo
  this.r = await this.findOne(); //lấy review trước khi chạy query
});

ReviewSchema.post(/^findOneAnd/, async function (next) {
  // await this.findOne(); does NOT work here, query has already executed
  // this.r là document đã được lưu ở trên thì .contructor của doc sẽ trỏ đến Model
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review', ReviewSchema);
module.exports = Review;
