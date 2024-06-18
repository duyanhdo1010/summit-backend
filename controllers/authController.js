const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });

    // Sign Token: payload -->  secret key --> expires time
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(201).json({
      status: 'success',
      token,
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) check email and password exists
    if (!email || !password)
      throw new Error('Please provide email and password');

    // 2) check if user exists && password is correct
    // do mình để select của password trong schema = false nên phải gọi lại để check
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new Error('Incorrect email or password');
    }

    // 3) If everything ok, send token to client
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

// thêm next vì đây sẽ là middleware function
exports.protect = async (req, res, next) => {
  try {
    // 1) Get and check token
    let token;

    if (
      req.header('Authorization') &&
      req.header('Authorization').startsWith('Bearer')
    ) {
      token = req.header('Authorization').split(' ')[1];
    }

    if (!token)
      throw new Error('You are not logged in! Please login to gain access');
    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) throw new Error('User no longer exist.');

    // 4) Add user to next middleware
    req.user = currentUser;

    // Grant access to protected route
    next();
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};
