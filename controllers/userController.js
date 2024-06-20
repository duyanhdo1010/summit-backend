const User = require('../models/userModel');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
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
exports.getUser = async (req, res) => {};

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
    const filteredBody = filterObj(req.body, 'name', 'email');

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

exports.updateUser = async (req, res) => {};

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
exports.deleteUser = async (req, res) => {};
