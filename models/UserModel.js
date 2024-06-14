const { mongoose } = require('mongoose');
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
    password: { type: String, require: [true, 'Please provide a password'] },
    passwordConfirm: {
      type: String,
      require: [true, 'Please confirm your password'],
      validate: {
        // custom validator (confirmPassword chính là giá trị của trường đó trong body khi có yêu cầu save)
        validator: function (confirmPassword) {
          return confirmPassword === this.password;
        },
        message: 'Password is not the same',
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
  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
