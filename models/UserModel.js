const { mongoose } = require('mongoose');
const bcrypt = require('bcryptjs');
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
    admin: {
      type: Boolean,
      default: false,
    },
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

// candidatePassword: password from login, userPassword: hashed password from exist user
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
