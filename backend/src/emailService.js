const nodemailer = require("nodemailer");

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Function to send alert email
const sendAlertEmail = async ({
  recipient,
  kpiName,
  department,
  status,
  currentValue,
  unit,
  message,
}) => {
  try {
    const mailOptions = {
      from: `"AI Notification Manager" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: `${status} Alert: ${kpiName}`,

      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          
          <h2>AI Notification Manager</h2>

          <h3>${status} Alert</h3>

          <p>${message}</p>

          <hr />

          <p>
            <strong>KPI:</strong> ${kpiName}
          </p>

          <p>
            <strong>Department:</strong> ${department}
          </p>

          <p>
            <strong>Status:</strong> ${status}
          </p>

          <p>
            <strong>Current Value:</strong> 
            ${currentValue} ${unit}
          </p>

          <hr />

          <p>
            Please check the AI Notification Manager dashboard
            for more details and take the appropriate action.
          </p>

        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Error sending email:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
};

// Export function for use in server.js
module.exports = {
  sendAlertEmail,
};