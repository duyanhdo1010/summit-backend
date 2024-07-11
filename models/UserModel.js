const { mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, 'Please tell us your name!'],
      trim: true, //loại bỏ khoảng trắng 2 đầu
    },
    email: {
      type: String,
      unique: true,
      require: [true, 'Please provide your email!'],
      lowercase: true,
    },
    phone: {
      type: String,
      require: [true, 'Please provide your phone number!'],
    },
    photo: { type: String },
    password: {
      type: String,
      require: [true, 'Please provide a password'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      require: [true, 'Please confirm your password'],
      validate: {
        // custom validator (confirmPassword chính là giá trị của trường đó trong body khi có yêu cầu save)
        // Chỉ dùng được với yêu cầu create và save
        validator: function (confirmPassword) {
          return confirmPassword === this.password;
        },
        message: 'Password and Confirm Password is not the same',
      },
    },
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    // tạo ra createdAt và updatedAt (có cập nhật dựa trên các thay đổi)
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  // kiểm tra xem password có được cập nhật không
  if (!this.isModified('password')) return next();

  // default là 10, nma để 12 cũng oke (kiểu tăng độ phức tạp nma dựa phải trên cấu hình CPU)
  this.password = await bcrypt.hash(this.password, 12);

  // Xoá passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

// áp dụng với các query liên quan đến find
userSchema.pre(/^find/, function (next) {
  // this ở đây là query
  this.find({ active: { $ne: false } });
  next();
});

// candidatePassword: password from login, userPassword: hashed password from exist user
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  // tạo ra token ngẫu nhiên rồi mã hoá
  // độ dài 32 byte --> chuyển thành chuỗi hex (0-9A-F)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // tạo ra chuỗi hash từ chuỗi ngẫu nhiên -> tạo giá trị hash dưới chuỗi hex(0-9A-F)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // thời gian sử dụng link reset là 10p tính từ dùng chức năng reset password
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // trả lại token về để gắn vào link reset password (chưa mã hoá để còn compare với cái bị mã hoá)
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
