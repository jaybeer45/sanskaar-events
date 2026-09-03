const transporter = require('../config/mailer');
const axios = require('axios');

const isEmail = (identifier) => identifier.includes('@');

// MSG91 detects country from the number's leading digits — a bare 10-digit
// Indian number starting with "93..." gets misread as Afghanistan's country
// code (+93) instead of a Jio/Airtel number, so India's 91 must be explicit.
const formatIndianMobile = (phone) => {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 10) return `91${digitsOnly}`;
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) return digitsOnly;
  return digitsOnly;
};

const sendOtpMessage = async (identifier, code) => {
  if (isEmail(identifier)) {
    try {
      await transporter.sendMail({
        from: `"Sanskaar Events" <${process.env.MAIL_USER}>`,
        to: identifier,
        subject: 'Your Sanskaar Events OTP',
        html: `
          <p>Your one-time password is:</p>
          <p style="font-size:28px; font-weight:bold; font-family:monospace;">
            ${code}
          </p>
          <p>This code expires in 5 minutes.</p>
        `,
      });
      return { channel: 'email', delivered: true };
    } catch (err) {
      console.error('[OTP EMAIL FAILED]', err.message);
      console.log(`[FALLBACK DEV OTP] ${identifier} -> ${code}`);
      return { channel: 'email', delivered: false };
    }
  }

  try {
    const response = await axios.post(
      'https://control.msg91.com/api/v5/otp',
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: formatIndianMobile(identifier),
        otp: code,
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('[MSG91 OTP SENT]', response.data);
    return { channel: 'sms', delivered: true };
  } catch (err) {
    console.error('[MSG91 OTP FAILED]', err.response?.data || err.message);
    console.log(`[FALLBACK DEV OTP] ${identifier} -> ${code}`);
    return { channel: 'sms', delivered: false };
  }
};

module.exports = {
  sendOtpMessage,
  isEmail,
  formatIndianMobile,
};