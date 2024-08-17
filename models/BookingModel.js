const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      require: [true, 'Booking must belong to a Tour!'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Booking must belong to a User!'],
    },
    price: {
      type: Number,
      require: [true, 'Booking must have a price'],
    },
    paid: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.index({ tour: 1, user: 1 }, { unique: true });

bookingSchema.pre(/^find/, function (next) {
  this.populate({
    //giờ đây chỉ lấy dữ liệu review trên tour thôi còn review để biết nó ở tour nào là được rồi
    path: 'tour',
    select: 'name price createdAt',
  });
  // .populate({
  //   path: 'user',
  //   select: 'name photo',
  // });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
