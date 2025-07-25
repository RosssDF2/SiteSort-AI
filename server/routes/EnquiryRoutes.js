// server/routes/enquiryRoutes.js
const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  try {
    // ✅ Create mail transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ENQUIRY_EMAIL,
        pass: process.env.ENQUIRY_PASSWORD, // Use App Password if 2FA enabled
      },
    });

    await transporter.sendMail({
      from: email,
      to: "rosnanda.dhaifullah@gmail.com",
      subject: `📩 Enquiry: ${subject}`,
      html: `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({ message: "Enquiry sent successfully" });
  } catch (err) {
    console.error("❌ Email failed:", err);
    res.status(500).json({ error: "Failed to send enquiry" });
  }
});

module.exports = router;
