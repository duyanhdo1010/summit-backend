const Tour = require('../models/tourModel');
const sharp = require('sharp');
const multer = require('multer');

const multerStorage = multer.memoryStorage();

// kiểm tra tệp có phải hình ảnh không
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    // không lỗi thì null, trả về true nếu đúng là image
    cb(null, true);
  } else {
    // trả về lỗi và false (không phải image)
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
// upload.single('imageCover') //req.file
// Xử lý upload nhiều ảnh
// upload.array('images', 3) //req. files
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// Resize hình ảnh
exports.resizeTourImages = async (req, res, next) => {
  try {
    if (!req.files.imageCover || !req.files.images) return next();

    // 1) imageCover
    if (req.files.imageCover) {
      req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; //dữ liệu nhận vào create và update dưới dạng req.body
      await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333) //resize(width, height),
        .toFormat('jpeg')
        .jpeg({ quality: 90 }) //kiểu giúp nén nó lại xíu
        .toFile(`public/img/tours/${req.body.imageCover}`); //lưu vào disk
    }

    // 2) images
    if (req.files.images) {
      req.body.images = [];

      await Promise.all(
        req.files.images.map(async (file, i) => {
          const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
          await sharp(file.buffer)
            .resize(2000, 1333) //resize(width, height),
            .toFormat('jpeg')
            .jpeg({ quality: 90 }) //kiểu giúp nén nó lại xíu
            .toFile(`public/img/tours/${filename}`); //lưu vào disk

          req.body.images.push(filename);
        })
      );
    }
    next();
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.aliasTopTours = async (req, res, next) => {
  // đơn giản là set các cái trường này theo ý mình muốn xong vào getAll
  req.query.limit = '5';
  req.query.sort = '-averageRating,price';
  req.query.fields = 'name,price,averageRating';
  next();
};

exports.createTour = async (req, res) => {
  try {
    // khi submit về dưới dạng form data thì nó convert hết thành chuỗi
    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.discount) req.body.discount = Number(req.body.discount);

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
      message: err.message,
    });
  }
};

exports.getAllTours = async (req, res) => {
  try {
    // Cách 1: const tours = await Tour.find().where('duration').equals(5).where('discount').equals(0)

    // Cách 2
    // BUILD QUERY

    // 1A) Filtering

    const queryObj = { ...req.query }; //tạo 1 bản copy của req.query để lọc đầu vào
    const excludedFields = ['page', 'sort', 'limit', 'fields']; //lọc các trường mà không ném vào filter
    excludedFields.forEach((el) => delete queryObj[el]); //xoá các phần tử của query tồn tại trong excludedFields

    // 1B) Advanced filtering

    //  { duration: { gte: '5' } } ==> { duration: { $gte: '5' } }
    // gte, gt, lte, lt (các toán tử)
    let queryStr = JSON.stringify(queryObj);
    // tìm kiếm toán tử tương ứng (\b: chỉ tìm kiếm các từ trùng (bgte sẽ không được), g: tìm kiếm toàn bộ chuỗi khớp)
    // VD: gte ==> $gte
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    let query = Tour.find(JSON.parse(queryStr));

    // 2) Sorting (- là giảm dần)
    if (req.query.sort) {
      // ?sort=-price,averageRating ==> -price averageRating
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
      // sort('price averageRating')
    } else {
      // mặc định trả về tour sort từ mới đến cũ
      query = query.sort('-createdAt');
    }

    // 3) Field limiting
    if (req.query.fields) {
      // ?fields=name,duration,price => name duration price
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // mặc định bỏ __v
      query = query.select('-__v');
    }

    // 4) Pagination
    // page=2&limit=10 ==> skip(10).limit(10) (trang 2 lấy 11-20 => skip 10 trang đầu)
    const page = req.query.page * 1 || 1; //convert thành số và mặc định trang 1
    const limit = req.query.limit * 1 || 100; //convert thành số  và mặc định 1 trang 100 doc
    const skip = page * limit - limit; //page = 3, limit = 10 => skip 20 doc đầu

    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip > numTours) {
        throw new Error('This page does not exist');
      }
    }

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
      message: err.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    // Tour.findOne({ _id: req.params.id })
    const tour = await Tour.findById(tourId).populate({ path: 'reviews' });
    if (!tour) {
      throw new Error('No tour found with that ID');
    }
    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // khi submit về dưới dạng form data thì nó convert hết thành chuỗi
    if (req.body.price) req.body.price = Number(req.body.price);
    if (req.body.discount) req.body.discount = Number(req.body.discount);
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      // return updated tour
      new: true,
      runValidators: true,
    });
    if (!updatedTour) {
      throw new Error('No tour found with that ID');
    }
    res.status(201).json({
      status: 'success',
      data: {
        updatedTour,
      },
    });
  } catch (err) {
    console.log('error: ', err.message);
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndDelete(req.params.id);
    if (!tour) {
      throw new Error('No tour found with that ID');
    }
    res.status(204).json({
      status: 'delete successfully',
      data: null,
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getTourStats = async (req, res) => {
  try {
    const stats = await Tour.aggregate([
      {
        // giống filter
        $match: {
          // lọc tài liệu có rating >= 4.3
          averageRating: { $gte: 4.3 },
        },
      },
      {
        // Nhóm giá trị từ nhiều tài liệu
        $group: {
          // nhóm tất cả tài liệu vào 1 nhóm duy nhất
          // như kiểu nhóm theo duration thì các tour duration giống nhau nhóm chung, còn lại nhóm riêng
          // _id: { $toUpper: '$name' } //nhóm theo tên nhưng nó trả về tên viết hoa
          _id: null,
          numTours: { $sum: 1 }, //mỗi doc đi qua +1
          numRatings: { $sum: '$ratingQuantity' },
          avgRating: { $avg: '$averageRating' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: {
          //chỉ sử dụng các trường được tạo trong $group
          avgPrice: 1, //1 là tăng dần -1 là giảm dần
        },
      },
      // { //có thể repeat lại stage
      //   $match: {  //lọc lại đống ở trên nếu group theo tên
      // _id: { $ne: 'Ha Noi'} //mà chỉ lấy những cái tour tên khác HN
      //   }
      // }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(404).json({
      status: 'failed',
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates', //1 tour có nhiều startDates thì ở đây ta tách riêng ra
    },
    {
      $match: {
        //lọc tour có trong năm (2021)
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //chia ra từng tháng theo $startDates
        numTourStarts: { $sum: 1 }, //tính toán số tour mỗi tháng
        tours: { $push: '$name' }, //đẩy tên của những tour có trong tháng vào
      },
    },
    {
      $addFields: { month: '$_id' }, //thêm thường month với giá trị của trường id
    },
    {
      $project: {
        _id: 0, //ẩn trường id khỏi output
      },
    },
    {
      $sort: { numTourStarts: -1 }, //xếp theo số tour theo tháng giảm dần
    },
    {
      $limit: 12, //chỉ trả lại 12 tour
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
};
