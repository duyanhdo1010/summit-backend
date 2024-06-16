const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// file app chịu trách nghiệm khởi tạo và cấu hình ứng dụng express
const app = express();

// trả về thông tin liên quan đến request được gửi đến
app.use(morgan('dev'));
// đọc data từ body chuyển sang req.body
app.use(express.json());
// đọc cookie từ header chuyển sang req.cookies
app.use(cookieParser());

// Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res) => {
  res.status(404).json({
    status: 'failed',
    message: `Can't find ${req.originalUrl} on this server`,
  });
});

module.exports = app;
