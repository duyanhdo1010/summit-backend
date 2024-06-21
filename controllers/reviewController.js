const Review = require('../models/reviewModel');

exports.getAllReviews = async (req, res) => {
  try {
    let filter = {};
    // nếu có tourId trong URL đầu vào thì sẽ trả về tất cả các review của tour đó
    // nếu không thì trả về toàn bộ review
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const reviews = await Review.find(filter);

    res.status(200).json({
      status: 'success',
      results: reviews.length,
      data: {
        review: reviews,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.createReview = async (req, res) => {
  try {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    // Tìm review theo ID
    const review = await Review.findById(req.params.id);

    // Nếu không tìm thấy review, ném lỗi
    if (!review) throw new Error('No Review found with that ID');

    // Kiểm tra quyền sở hữu hoặc quyền admin
    // ở đây trong trường hợp người dùng không phải là tác giả cũng không phải là admin
    if (
      req.user._id.toString() !== review.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new Error('You are not the review author or admin');
    }

    // Nếu vượt qua kiểm tra, tiến hành xoá review
    await Review.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'deleted successfully',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.updateReview = async (req, res) => {
  try {
    // Tìm review theo ID
    const review = await Review.findById(req.params.id);

    // Nếu không tìm thấy review, ném lỗi
    if (!review) throw new Error('No Review found with that ID');

    // Kiểm tra quyền sở hữu hoặc quyền admin
    // ở đây trong trường hợp người dùng không phải là tác giả cũng không phải là admin
    if (
      req.user._id.toString() !== review.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new Error('You are not the review author');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      status: 'success',
      data: {
        updatedReview,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new Error('No Review found with that ID');
    res.status(201).json({
      status: 'success',
      data: {
        review,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};
