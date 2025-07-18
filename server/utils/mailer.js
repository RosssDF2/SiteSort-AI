const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,   // your Gmail (e.g., sitesort.ai@gmail.com)
    pass: process.env.MAIL_PASS,   // 16-digit App Password from Google
  },
});

exports.send2FACode = async (email, code) => {
  const info = await transporter.sendMail({
    from: `"SiteSort AI" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "🔐 Your SiteSort 2FA Code",
    html: `
      <div style="font-family: sans-serif; line-height: 1.5;">
        <h2>SiteSort AI</h2>
        <p>Here is your 2FA code:</p>
        <h1 style="letter-spacing: 4px;">${code}</h1>
        <p>This code is valid for 5 minutes.</p>
        <br/>
        <p>If you did not attempt to log in, please ignore this email.</p>
      </div>
    `
  });

  console.log("✅ 2FA email sent to", email, "| Message ID:", info.messageId);
};


exports.sendResetEmail = async (to, link) => {
  const subject = "🔐 SiteSort Password Reset";
  const html = `
    <div style="font-family: sans-serif; line-height: 1.5;">
      <h2>SiteSort AI</h2>
      <p>You requested a password reset.</p>
      <p>
        <a href="${link}" style="display: inline-block; background: #10B981; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Reset Your Password
        </a>
      </p>
      <p>This link is valid for 30 minutes.</p>
      <br/>
      <p>If you did not request a reset, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"SiteSort AI" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};
