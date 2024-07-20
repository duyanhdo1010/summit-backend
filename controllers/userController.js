const User = require('../models/userModel');
const sharp = require('sharp');
const multer = require('multer');

// const multerStorage = multer.diskStorage({
//   // có quyền truy cập vào request, file và 1 hàm callback
//   destination: (req, file, cb) => {
//     // error nếu có, đích nơi lưu file
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1]; //sẽ lấy cái (extension vd: jpg)

//     // đặt tên cho nó unique (user-id-timestamp) (user-731264781-398271938.jpeg)
//     // error nếu có, filename
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

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

// tạo middleware ngay trong controller
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();
    // lưu vào đĩa tên cho giống cái định dạng ở trên
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    // nhờ việc lưu vào buffer trước ta có thế lấy cho sharp
    // các options có thể đọc thêm trên docs
    await sharp(req.file.buffer)
      .resize(500, 500) //resize(width, height),
      .toFormat('jpeg')
      .jpeg({ quality: 90 }) //kiểu giúp nén nó lại xíu
      .toFile(`public/img/users/${req.file.filename}`); //lưu vào disk
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }

  next();
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } });
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error('There is no user with this ID');
    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

// đơn giản là gán id người dùng vào res.params.id rồi chuyển qua getUser
exports.getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  console.log('req.params.id: ', req.params.id);
  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // Object.keys(obj) trả về 1 mảng các key của obj
  Object.keys(obj).forEach((el) => {
    // trả về object mới gồm key và value với các key hợp lệ
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = async (req, res) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm)
      throw new Error('This routes is not for password update');
    // 2) Update user
    // Lọc body đẻ bỏ đi mấy trường mình không mong muốn bị lọc như role
    const filteredBody = filterObj(req.body, 'name', 'email', 'phone');
    // nếu có file thì lưu tên hình ảnh vào document
    if (req.file) filteredBody.photo = req.file.filename;

    // findByIdAndUpdate bởi vì nếu save thì phải vượt qua validate của mấy trường như password
    const newUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidator: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.body.password || req.body.passwordConfirm)
      throw new Error('This routes is not for password update');
    const newUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidator: true,
    });

    if (!newUser) throw new Error('No user found with that ID');

    res.status(200).json({
      status: 'success',
      data: {
        newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        active: false,
      },
      { new: true }
    );
    if (!deletedUser) throw new Error('No user found with that ID');
    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message,
    });
  }
};
