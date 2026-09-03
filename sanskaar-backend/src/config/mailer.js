const nodemailer = require('nodemailer');

// Uses Gmail SMTP by default. To set this up:
// 1. Go to your Google Account -> Security -> 2-Step Verification (must be ON)
// 2. Search "App passwords" -> generate one for "Mail"
// 3. Set MAIL_USER=youremail@gmail.com and MAIL_PASS=<the 16-char app password>
//    in your backend's environment variables (Render dashboard, NOT .env only
//    on your laptop — production reads from Render's env settings)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transporter;