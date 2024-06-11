const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// file app chịu trách nghiệm khởi tạo và cấu hình ứng dụng express
const app = express();

// trả về thông tin liên quan đến request được gửi đến
app.use(morgan('dev'));
// đọc data từ body chuyển sang req.body
app.use(express.json());
// đọc cookie từ header chuyển sang req.cookies
app.use(cookieParser());

module.exports = app;
