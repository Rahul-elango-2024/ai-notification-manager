const nodemailer = require("nodemailer");

// ============================================
// EMAIL TRANSPORTER CONFIGURATION
// ============================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },

  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

// ============================================
// VERIFY EMAIL CONNECTION
// ============================================

async function verifyEmailConnection() {
  try {
    await transporter.verify();

    console.log(
      "Email service connected successfully"
    );

    return true;
  } catch (error) {
    console.error(
      "Email service connection failed:",
      error.message
    );

    return false;
  }
}

// ============================================
// SEND EMAIL
// ============================================

async function sendEmail(to, subject, text) {
  try {
    if (!to) {
      throw new Error(
        "Recipient email address is required"
      );
    }

    const info = await transporter.sendMail({
      from: `"AI Notification Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    console.log(
      `Email sent successfully to ${to}:`,
      info.messageId
    );

    return info;
  } catch (error) {
    console.error(
      `Email sending failed for ${to}:`,
      error.message
    );

    throw error;
  }
}

// ============================================
// WAIT HELPER
// ============================================

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

// ============================================
// SEND EMAIL WITH RETRY
// ============================================

async function sendEmailWithRetry(
  to,
  subject,
  text,
  options = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 5000,
  } = options;

  let lastError = null;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      console.log(
        `Email attempt ${attempt + 1}/${
          maxRetries + 1
        } for ${to}`
      );

      const info = await sendEmail(
        to,
        subject,
        text
      );

      return {
        success: true,
        info,
        retryCount: attempt,
        attempts: attempt + 1,
        error: null,
      };
    } catch (error) {
      lastError = error;

      console.error(
        `Email attempt ${
          attempt + 1
        } failed for ${to}:`,
        error.message
      );

      if (attempt < maxRetries) {
        console.log(
          `Retrying email in ${
            retryDelay / 1000
          } seconds...`
        );

        await wait(retryDelay);
      }
    }
  }

  return {
    success: false,
    info: null,
    retryCount: maxRetries,
    attempts: maxRetries + 1,
    error:
      lastError?.message ||
      "Unknown email delivery error",
  };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  transporter,
  verifyEmailConnection,
  sendEmail,
  sendEmailWithRetry,
};