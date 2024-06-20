const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

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

    const cookiesOption = {
      // sẽ hết hạn sau 90 ngày (cái biến kia giá trị là 90)
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      // chỉ gửi trên https
      // secure: true,
      // làm trình duyệt không thể truy cập và sửa đồi cookie
      // trình duyệt cũng nhận, lưu, tự động gửi cookie với request
      httpOnly: true,
    };

    res.cookie('jwt', token, cookiesOption);

    // remove password from output
    newUser.password = undefined;

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

    const cookiesOption = {
      // sẽ hết hạn sau 90 ngày (cái biến kia giá trị là 90)
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      // chỉ gửi trên https
      // secure: true,
      // làm trình duyệt không thể truy cập và sửa đồi cookie
      // trình duyệt cũng nhận, lưu, tự động gửi cookie với request
      httpOnly: true,
    };

    res.cookie('jwt', token, cookiesOption);

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

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      // authController.restrictTo('admin')
      // roles có thể là 1 array: ['admin', 'random-role']
      //người dùng đã được đưa vào đây khi đi qua protect
      if (!roles.includes(req.user.role))
        throw new Error('You do not have permission to perform this action');

      next();
    } catch (err) {
      res.status(400).json({
        status: 'failed',
        message: err.message,
      });
    }
  };
};

exports.forgotPassword = async (req, res) => {
  try {
    // 1) Get user from posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) throw new Error('There is no user with that email address!');
    // 2) Generate random reset password token
    const resetToken = user.createPasswordResetToken();
    // để lưu cái token được tạo và thời gian token hết hạn
    await user.save({ validateBeforeSave: false }); //do kiểu save phải có tất cả các trường require -> phải tắt
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to ${resetURL}.\n 
    If you didn't forget your password, please forget this email
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 mins)',
        message,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw new Error('There was an error sending the email. Try again later!');
    }
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // 1) Get User from forgot password token

    // mã hoá y hệt như token trong schema
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      // Nếu thời gian hết hạn lớn hơn thời gian hiện tại thì lấy
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) Set new password if token chưa hết hạn, và user có tồn lại
    if (!user) throw new Error('Token is invalid or has expired ');

    // Cập nhật thông tin user
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // 3) Log the user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const cookiesOption = {
      // sẽ hết hạn sau 90 ngày (cái biến kia giá trị là 90)
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      // chỉ gửi trên https
      // secure: true,
      // làm trình duyệt không thể truy cập và sửa đồi cookie
      // trình duyệt cũng nhận, lưu, tự động gửi cookie với request
      httpOnly: true,
    };

    res.cookie('jwt', token, cookiesOption);

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

exports.updatePassword = async (req, res) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    // 2) Check if POSTed current password is correct
    const { passwordCurrent, password, passwordConfirm } = req.body;

    if (
      !user ||
      !(await user.correctPassword(passwordCurrent, user.password))
    ) {
      throw new Error('Your current password is wrong!');
    }
    // 3) If so update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();
    // 4) Log user in, send JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const cookiesOption = {
      // sẽ hết hạn sau 90 ngày (cái biến kia giá trị là 90)
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      // chỉ gửi trên https
      // secure: true,
      // làm trình duyệt không thể truy cập và sửa đồi cookie
      // trình duyệt cũng nhận, lưu, tự động gửi cookie với request
      httpOnly: true,
    };

    res.cookie('jwt', token, cookiesOption);

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
