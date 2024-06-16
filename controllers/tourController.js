const Tour = require('../models/tourModel');

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);
    // 201: Created
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (err) {
    // 400: Bad request
    res.status(400).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getAllTours = async (req, res) => {
  try {
    // Cách 1: const tours = await Tour.find().where('duration').equals(5).where('discount').equals(0)

    // Cách 2
    console.log(req.query);
    // BUILD QUERY
    // 1) Filtering
    const queryObj = { ...req.query }; //tạo 1 bản copy của req.query để lọc đầu vào
    const excludedFields = ['page', 'sort', 'limit', 'fields']; //lọc các trường mà không ném vào filter
    excludedFields.forEach((el) => delete queryObj[el]); //xoá các phần tử của query tồn tại trong excludedFields
    // 2) Advanced filtering
    //  { duration: { gte: '5' } } ==> { duration: { $gte: '5' } }
    // gte, gt, lte, lt (các toán tử)
    let queryStr = JSON.stringify(queryObj);
    // tìm kiếm toán tử tương ứng (\b: chỉ tìm kiếm các từ trùng (bgte sẽ không được), g: tìm kiếm toàn bộ chuỗi khớp)
    // VD: gte ==> $gte
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    const query = Tour.find(JSON.parse(queryStr));

    // EXECUTE QUERY
    const tours = await query;

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (err) {
    // 404: Not Found
    res.status(404).json({
      status: 'failed',
      message: 'error',
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    // Tour.findOne({ _id: req.params.id })
    const tour = await Tour.findById(tourId);
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      // return updated tour
      new: true,
      runValidators: true,
    });
    res.status(201).json({
      status: 'success',
      data: {
        updatedTour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'delete successfully',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};
