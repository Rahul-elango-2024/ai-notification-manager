const nodemailer = require("nodemailer");

// ============================================
// EMAIL TRANSPORTER CONFIGURATION
// ============================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },

  requireTLS: true,

  tls: {
    rejectUnauthorized: false,
  },

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

// ============================================
// VERIFY EMAIL CONNECTION
// ============================================

async function verifyEmailConnection() {
  try {
    await transporter.verify();

    console.log("=======================================");
    console.log("✅ Email service connected successfully");
    console.log(`📧 Gmail Account: ${process.env.EMAIL_USER}`);
    console.log("=======================================");

    return true;
  } catch (error) {
    console.error("=======================================");
    console.error("❌ Email service connection failed");
    console.error(error);
    console.error("=======================================");

    return false;
  }
}

// ============================================
// SEND EMAIL
// ============================================

async function sendEmail(to, subject, text, html = null) {
  try {
    if (!to) {
      throw new Error("Recipient email address is required.");
    }

    const mailOptions = {
      from: `"AI Notification Manager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    if (html) {
      mailOptions.html = html;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log("=======================================");
    console.log("✅ Email Sent Successfully");
    console.log(`To        : ${to}`);
    console.log(`Subject   : ${subject}`);
    console.log(`Message ID: ${info.messageId}`);
    console.log("=======================================");

    return info;
  } catch (error) {
    console.error("=======================================");
    console.error(`❌ Failed to send email to ${to}`);
    console.error(error);
    console.error("=======================================");

    throw error;
  }
}

// ============================================
// WAIT HELPER
// ============================================

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    html = null,
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `📨 Email Attempt ${attempt + 1}/${maxRetries + 1} -> ${to}`
      );

      const info = await sendEmail(
        to,
        subject,
        text,
        html
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
        `❌ Attempt ${attempt + 1} failed: ${error.message}`
      );

      if (attempt < maxRetries) {
        console.log(
          `⏳ Retrying in ${retryDelay / 1000} seconds...\n`
        );

        await wait(retryDelay);
      }
    }
  }

  console.error("=======================================");
  console.error("❌ Email delivery failed after retries");
  console.error(lastError);
  console.error("=======================================");

  return {
    success: false,
    info: null,
    retryCount: maxRetries,
    attempts: maxRetries + 1,
    error: lastError?.message || "Unknown error",
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