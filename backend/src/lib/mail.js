import nodemailer from "nodemailer";

function createTransporter() {
  const auth = {
    user: process.env.SMTP_MAIL?.trim(),
    pass: process.env.SMTP_PASSWORD?.trim().replace(/\s/g, ""),
  };

  const service = process.env.SMTP_SERVICE?.trim();

  if (service) {
    return nodemailer.createTransport({ service, auth });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth,
  });
}

export async function verifySmtpConnection() {
  const transporter = createTransporter();
  await transporter.verify();
}

export async function sendOtpEmail(email, otp) {
  const from = process.env.SMTP_MAIL?.trim();
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Surplus" <${from}>`,
    to: email,
    subject: "Your Surplus verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <p>Your Surplus verification code is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This code expires in 10 minutes.</p>
    `,
  });
}
