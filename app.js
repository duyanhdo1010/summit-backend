const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cors = require('cors');
const path = require('path');

// file app chịu trách nghiệm khởi tạo và cấu hình ứng dụng express
const app = express();

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// nhận các request từ bên frontend
app.use(cors({ credentials: true, origin: 'http://localhost:5173' }));

// trả về thông tin liên quan đến request được gửi đến
app.use(morgan('dev'));

// Số request mỗi IP có thể thực hiện trên 1 khoảng thời gian
// ở đây là 100 request mỗi 1 tiếng từ 1 IP
// const limiter = rateLimit({
//   max: 100, //lưu ý chỉnh cho giới hạn phù hợp với app
//   windowMs: 60 * 60 * 1000,
//   // Lỗi nếu như vượt quá request,
//   message: 'Too many requests from this IP, Please try again in an hour',
// });
// app.use('/api', limiter);

// đọc data từ body chuyển sang req.body
app.use(express.json({ limit: '10kb' })); //kiểu dữ liệu truyền vào body thường nhỏ

// Làm sạch dữ liệu chống NOSQL query injection
app.use(mongoSanitize()); //lọc ký hiệu $ và .

// Chống lại XSS
app.use(xss()); //xoá mã html độc hại khỏi input (có thể có mã js trong đó)

// đọc cookie từ header chuyển sang req.cookies
app.use(cookieParser());

// app.use((req, res, next) => {
//   console.log('cookies: ', req.cookies);
//   next();
// });

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
