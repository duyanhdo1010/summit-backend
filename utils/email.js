const nodemailer = require('nodemailer');

// tạo hàm sendEmail
const sendEmail = async (options) => {
  // 1) Create a transporter (ngoài đời hình như hay dùng sendgrid và mailgun)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, //kết nối an toàn (idk)
    auth: {
      // gmail account that create the app
      user: process.env.EMAIL_USERNAME,
      // app password
      pass: process.env.APP_PASSWORD,
    },
  });
  // 2) Define the email options
  const mailOptions = {
    from: 'Duy Anh <duyanhdo1010@gmail.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: (về sau có thể làm html template cho email)
  };
  // 3) Actually send the email
  await transporter.sendMail(mailOptions);

  // transporter.sendMail(mailOptions, (error, info) => {
  //   if (error) {
  //     console.error("Error sending email: ", error);
  //   } else {
  //     console.log("Email sent: ", info.response);
  //   }
  // });
};

module.exports = sendEmail;
