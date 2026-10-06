const https = require("https");
const dns = require("dns");

const sendOtpEmail = async (email, otp) => {
    return new Promise((resolve) => {
        try {
            const apiKey = process.env.BREVO_API_KEY;

            if (!apiKey || apiKey === "your_brevo_api_key_here") {
                console.error("❌ BREVO_API_KEY is not set");
                resolve(false);
                return;
            }

            console.log("=========================================");
            console.log("🔔 OTP =>", otp, "| To:", email);
            console.log("🔑 Using Brevo key:", apiKey.substring(0, 20) + "...");
            console.log("=========================================");

            const body = JSON.stringify({
                sender: { name: "Hangout", email: process.env.SMTP_USER || "support.hangout@gmail.com" },
                to: [{ email }],
                subject: "Your Hangout Verification OTP",
                htmlContent: `
                    <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; background-color: #FCFBF9; border-radius: 12px; border: 1px solid #F0EBE6;">
                        <h2 style="color: #D97757; font-size: 28px; margin-bottom: 5px;">Hangout</h2>
                        <hr style="border: none; border-top: 1px solid #F0EBE6; margin-bottom: 25px;">
                        <p style="color: #2D2825; font-size: 16px;">Hello 👋,</p>
                        <p style="color: #8E8782; font-size: 15px;">Your One-Time Verification Code:</p>
                        <div style="background: #fff; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; border: 1px solid #F0EBE6;">
                            <h1 style="color: #D97757; letter-spacing: 8px; font-size: 36px; margin: 0;">${otp}</h1>
                        </div>
                        <p style="color: #8E8782; font-size: 13px;">⏱ Expires in <strong>10 minutes</strong>.</p>
                        <hr style="border: none; border-top: 1px solid #F0EBE6; margin-top: 25px;">
                        <p style="color: #8E8782; font-size: 12px; text-align: center;">© Hangout App</p>
                    </div>
                `,
            });

            // Force IPv4 DNS lookup for api.brevo.com
            dns.lookup("api.brevo.com", { family: 4 }, (dnsErr, address) => {
                if (dnsErr) {
                    console.error("❌ DNS lookup failed:", dnsErr.message);
                    resolve(false);
                    return;
                }

                console.log("🌐 Resolved api.brevo.com to (IPv4):", address);

                const options = {
                    host: address,           // use resolved IPv4 address
                    path: "/v3/smtp/email",
                    method: "POST",
                    headers: {
                        "api-key": apiKey,
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(body),
                        "Host": "api.brevo.com", // required for SNI/TLS
                    },
                };

                const req = https.request(options, (res) => {
                    let data = "";
                    res.on("data", (chunk) => (data += chunk));
                    res.on("end", () => {
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            console.log("✅ Email sent via Brevo. Status:", res.statusCode);
                            resolve(true);
                        } else {
                            console.error("❌ Brevo API error:", res.statusCode, data);
                            resolve(false);
                        }
                    });
                });

                req.on("error", (err) => {
                    console.error("❌ Brevo request error:", err.message);
                    resolve(false);
                });

                req.setTimeout(20000, () => {
                    console.error("❌ Brevo request timed out");
                    req.destroy();
                    resolve(false);
                });

                req.write(body);
                req.end();
            });

        } catch (err) {
            console.error("❌ sendOtpEmail exception:", err.message);
            resolve(false);
        }
    });
};

module.exports = { sendOtpEmail };
