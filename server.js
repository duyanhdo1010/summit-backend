const mongoose = require('mongoose');
const dotenv = require('dotenv');

// lấy các biến môi trường từ file .env
dotenv.config();

// liên kết với ứng dụng express (app.js)
const app = require('./app');

// Ta dùng port chính là 3000 và port phụ là 8000
const port = process.env.PORT || 8000;

// Kết nối với mongoDB
const DATABASE = process.env.DATABASE;
mongoose
  .connect(DATABASE)
  .then(() => {
    console.log('Connected to the database!');
    // app bắt đầu lắng nghe mọi request được truyền đến
    app.listen(port, () => {
      console.log('Server is listening on port: ', port);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to the database', err);
  });
