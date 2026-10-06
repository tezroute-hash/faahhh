const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
    try {
        // Port 465 with secure:true works on Render (port 587 is often blocked)
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: 465,
            secure: true, // SSL
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false, // Avoids cert issues on cloud hosts
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });

        const mailOptions = {
            from: `"Hangout" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your Hangout Verification OTP",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; background-color: #FCFBF9; border-radius: 12px; border: 1px solid #F0EBE6;">
                    <h2 style="color: #2D2825; font-size: 24px; margin-bottom: 5px;">Hangout</h2>
                    <hr style="border: none; border-top: 1px solid #F0EBE6; margin-bottom: 25px;">
                    <p style="color: #2D2825; font-size: 16px;">Hello 👋,</p>
                    <p style="color: #8E8782; font-size: 15px;">Here is your One-Time Verification Code:</p>
                    <div style="background: #fff; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 1px solid #F0EBE6;">
                        <h1 style="color: #D97757; letter-spacing: 8px; font-size: 36px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #8E8782; font-size: 13px;">⏱ This code expires in <strong>10 minutes</strong>.</p>
                    <p style="color: #8E8782; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #F0EBE6; margin-top: 25px;">
                    <p style="color: #8E8782; font-size: 12px; text-align: center;">© Hangout App</p>
                </div>
            `,
        };

        console.log("=========================================");
        console.log("🔔 OTP =>", otp, "| To:", email);
        console.log("=========================================");

        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Email sent:", info.response);
        return true;
    } catch (error) {
        console.error("❌ Email error:", error.message);
        return false;
    }
};

module.exports = { sendOtpEmail };
