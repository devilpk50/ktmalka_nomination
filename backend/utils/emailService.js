const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Sender email - use SENDER_EMAIL env var, or fall back to SMTP_USER
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER;

// Log email config on startup (hide password)
console.log('Email Config:', {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER || 'NOT SET',
    password: process.env.SMTP_PASSWORD ? '***SET***' : 'NOT SET',
    senderEmail: SENDER_EMAIL || 'NOT SET'
});

// Create transporter using environment variables
// Default to Brevo (Sendinblue) SMTP which works on cloud hosting like Render
// Gmail SMTP is blocked by most cloud providers
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
});

// Handle transporter errors gracefully to prevent server crashes
transporter.on('error', (error) => {
    console.error('Email transporter error (non-fatal):', error.message);
});

// Verify SMTP connection on startup
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    transporter.verify()
        .then(() => {
            console.log('SMTP connection verified successfully - Email service is ready');
        })
        .catch((error) => {
            console.error('SMTP verification FAILED:', error.message);
            console.error('Full SMTP error:', JSON.stringify(error, null, 2));
        });
} else {
    console.log('Email service not configured - SMTP credentials missing');
}

/**
 * Get logo file path and CID for email attachments
 */
function getLogoAttachment() {
    try {
        const logoPath = path.join(__dirname, '../../frontend/images/logo.png');
        if (fs.existsSync(logoPath)) {
            return {
                filename: 'logo.png',
                path: logoPath,
                cid: 'leoclub-logo' // Content-ID for referencing in HTML
            };
        } else {
            console.warn('Logo file not found at:', logoPath);
            return null;
        }
    } catch (error) {
        console.error('Error reading logo file:', error);
        return null;
    }
}

/**
 * Send membership approval email
 * @param {Object} membershipData - Membership application data
 */
async function sendApprovalEmail(membershipData) {
    const { email, fullName } = membershipData;
    const logoAttachment = getLogoAttachment();
    const logoImgTag = logoAttachment 
        ? `<img src="cid:leoclub-logo" alt="Leo Club Logo" style="max-width: 120px; height: auto; background-color: white; padding: 10px; border-radius: 8px; display: block; margin: 0 auto;" />`
        : '<h1 style="font-size: 24px; font-weight: 600; margin: 0;">Leo Club</h1>';
    
    const mailOptions = {
        from: `"Leo Club" <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Membership Application Approved - Leo Club',
        attachments: logoAttachment ? [logoAttachment] : [],
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo-container {
                        margin-bottom: 15px;
                    }
                    .logo-container img {
                        max-width: 120px;
                        height: auto;
                        background-color: white;
                        padding: 10px;
                        border-radius: 8px;
                    }
                    .header h1 {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    .content {
                        padding: 40px 30px;
                        background-color: #ffffff;
                    }
                    .success-badge {
                        text-align: center;
                        margin-bottom: 25px;
                    }
                    .success-icon {
                        display: inline-block;
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        border-radius: 50%;
                        line-height: 80px;
                        font-size: 48px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
                    }
                    h2 {
                        color: #0066cc;
                        font-size: 26px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .message-box {
                        background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
                        border-left: 4px solid #28a745;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 5px;
                    }
                    .message-box p {
                        margin: 0;
                        color: #2e7d32;
                        font-weight: 500;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                        margin: 20px 0;
                    }
                    ul li {
                        padding: 12px 0;
                        color: #555;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 15px;
                    }
                    ul li:last-child {
                        border-bottom: none;
                    }
                    p {
                        margin-bottom: 15px;
                        color: #555;
                        font-size: 15px;
                    }
                    .signature {
                        margin-top: 35px;
                        padding-top: 25px;
                        border-top: 2px solid #e0e0e0;
                    }
                    .signature p {
                        margin: 5px 0;
                        color: #333;
                    }
                    .signature strong {
                        color: #0066cc;
                        font-size: 16px;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #e0e0e0;
                    }
                    .footer p {
                        margin: 5px 0;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            ${logoImgTag}
                        </div>
                        <h1>Leo Club of Kathmandu Alka</h1>
                    </div>
                    <div class="content">
                        <h2>Congratulations, ${fullName}!</h2>
                        <div class="message-box">
                            <p>We are pleased to inform you that your membership application has been <strong>APPROVED</strong>!</p>
                        </div>
                        <p>Welcome to the Leo Club family! We are excited to have you join us in our mission to serve the community and make a positive impact.</p>
                        <p>As an approved member, you will now have access to:</p>
                        <ul style="list-style: none; padding: 0; margin: 20px 0;">
                            <li style="padding: 12px 0; color: #555; border-bottom: 1px solid #f0f0f0; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">🎉</span> Participate in club events and activities</li>
                            <li style="padding: 12px 0; color: #555; border-bottom: 1px solid #f0f0f0; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">🤝</span> Join community service projects</li>
                            <li style="padding: 12px 0; color: #555; border-bottom: 1px solid #f0f0f0; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">💼</span> Attend meetings and networking opportunities</li>
                            <li style="padding: 12px 0; color: #555; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">⭐</span> Access member resources and benefits</li>
                        </ul>
                        <p>We look forward to working with you and seeing the great contributions you will make to our club and community.</p>
                        <p>If you have any questions or need further information, please don't hesitate to contact us.</p>
                        <div class="signature">
                            <p>Best regards,</p>
                            <p><strong>Leo Club Administration Team</strong></p>
                            <p>Leo Club of Kathmandu Alka</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>&copy; ${new Date().getFullYear()} Leo Club of Kathmandu Alka. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Congratulations, ${fullName}!

            We are pleased to inform you that your membership application has been APPROVED!

            Welcome to the Leo Club family. We are excited to have you join us in our mission to serve the community and make a positive impact.

            As an approved member, you will now have access to:
            - Participate in club events and activities
            - Join community service projects
            - Attend meetings and networking opportunities
            - Access member resources and benefits

            We look forward to working with you and seeing the great contributions you will make to our club and community.

            If you have any questions or need further information, please don't hesitate to contact us.

            Best regards,
            Leo Club Administration Team
        `
    };

    try {
        console.log('Attempting to send approval email to:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Approval email sent successfully:', info.messageId, 'to:', email);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending approval email to:', email);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        return { success: false, error: error.message };
    }
}

/**
 * Send membership rejection email
 * @param {Object} membershipData - Membership application data
 */
async function sendRejectionEmail(membershipData) {
    const { email, fullName } = membershipData;
    const logoAttachment = getLogoAttachment();
    const logoImgTag = logoAttachment 
        ? `<img src="cid:leoclub-logo" alt="Leo Club Logo" style="max-width: 120px; height: auto; background-color: white; padding: 10px; border-radius: 8px; display: block; margin: 0 auto;" />`
        : '<h1 style="font-size: 24px; font-weight: 600; margin: 0;">Leo Club</h1>';
    
    const mailOptions = {
        from: `"Leo Club" <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Membership Application Status - Leo Club',
        attachments: logoAttachment ? [logoAttachment] : [],
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo-container {
                        margin-bottom: 15px;
                    }
                    .logo-container img {
                        max-width: 120px;
                        height: auto;
                        background-color: white;
                        padding: 10px;
                        border-radius: 8px;
                    }
                    .header h1 {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    .content {
                        padding: 40px 30px;
                        background-color: #ffffff;
                    }
                    .info-badge {
                        text-align: center;
                        margin-bottom: 25px;
                    }
                    .info-icon {
                        display: inline-block;
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
                        border-radius: 50%;
                        line-height: 80px;
                        font-size: 48px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 4px 8px rgba(255, 193, 7, 0.3);
                    }
                    h2 {
                        color: #0066cc;
                        font-size: 26px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .message-box {
                        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                        border-left: 4px solid #ff9800;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 5px;
                    }
                    .message-box p {
                        margin: 0;
                        color: #e65100;
                        font-weight: 500;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                        margin: 20px 0;
                    }
                    ul li {
                        padding: 12px 0;
                        color: #555;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 15px;
                    }
                    ul li:last-child {
                        border-bottom: none;
                    }
                    p {
                        margin-bottom: 15px;
                        color: #555;
                        font-size: 15px;
                    }
                    .signature {
                        margin-top: 35px;
                        padding-top: 25px;
                        border-top: 2px solid #e0e0e0;
                    }
                    .signature p {
                        margin: 5px 0;
                        color: #333;
                    }
                    .signature strong {
                        color: #0066cc;
                        font-size: 16px;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #e0e0e0;
                    }
                    .footer p {
                        margin: 5px 0;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            ${logoImgTag}
                        </div>
                        <h1>Leo Club of Kathmandu Alka</h1>
                    </div>
                    <div class="content">
                        <h2>Dear ${fullName},</h2>
                        <p>Thank you for your interest in joining the Leo Club and for taking the time to submit your membership application.</p>
                        <div class="message-box">
                            <p>After careful review of your application, we regret to inform you that we are unable to approve your membership at this time.</p>
                        </div>
                        <p>This decision was made after thorough consideration of all applications we received. We understand this may be disappointing, and we want you to know that this decision does not reflect on your character or potential.</p>
                        <p>We encourage you to:</p>
                        <ul style="list-style: none; padding: 0; margin: 20px 0;">
                            <li style="padding: 12px 0; color: #555; border-bottom: 1px solid #f0f0f0; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">⭐</span> Reapply in the future when you feel ready</li>
                            <li style="padding: 12px 0; color: #555; border-bottom: 1px solid #f0f0f0; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">🤝</span> Stay connected with our community through our public events</li>
                            <li style="padding: 12px 0; color: #555; font-size: 15px;"><span style="font-size: 18px; margin-right: 8px;">💡</span> Continue your involvement in community service activities</li>
                        </ul>
                        <p>If you have any questions about this decision or would like feedback on your application, please feel free to contact us. We are here to help and support you.</p>
                        <div class="signature">
                            <p>Best regards,</p>
                            <p><strong>Leo Club Administration Team</strong></p>
                            <p>Leo Club of Kathmandu Alka</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>&copy; ${new Date().getFullYear()} Leo Club of Kathmandu Alka. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Dear ${fullName},

            Thank you for your interest in joining the Leo Club and for taking the time to submit your membership application.

            After careful review of your application, we regret to inform you that we are unable to approve your membership at this time.

            This decision was made after thorough consideration of all applications we received. We understand this may be disappointing, and we want you to know that this decision does not reflect on your character or potential.

            We encourage you to:
            - Reapply in the future when you feel ready
            - Stay connected with our community through our public events
            - Continue your involvement in community service activities

            If you have any questions about this decision or would like feedback on your application, please feel free to contact us. We are here to help and support you.

            Best regards,
            Leo Club Administration Team
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        // console.log('Rejection email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        // Handle connection errors gracefully
        const errorMessage = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' 
            ? 'Email service connection error. Please check your network and SMTP settings.'
            : error.message;
        console.error('Error sending rejection email:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

/**
 * Send newsletter subscription confirmation email
 * @param {String} email - Subscriber email address
 */
async function sendNewsletterConfirmationEmail(email) {
    const logoAttachment = getLogoAttachment();
    const logoImgTag = logoAttachment 
        ? `<img src="cid:leoclub-logo" alt="Leo Club Logo" style="max-width: 120px; height: auto; background-color: white; padding: 10px; border-radius: 8px; display: block; margin: 0 auto;" />`
        : '<h1 style="font-size: 24px; font-weight: 600; margin: 0;">Leo Club</h1>';
    
    const mailOptions = {
        from: `"Leo Club" <${SENDER_EMAIL}>`,
        to: email,
        subject: 'Welcome to Leo Club Newsletter!',
        attachments: logoAttachment ? [logoAttachment] : [],
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background-color: #f4f4f4;
                        padding: 20px;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
                        color: white;
                        padding: 30px 20px;
                        text-align: center;
                    }
                    .logo-container {
                        margin-bottom: 15px;
                    }
                    .header h1 {
                        font-size: 24px;
                        font-weight: 600;
                        margin: 0;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    }
                    .content {
                        padding: 40px 30px;
                        background-color: #ffffff;
                    }
                    .success-badge {
                        text-align: center;
                        margin-bottom: 25px;
                    }
                    .success-icon {
                        display: inline-block;
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                        border-radius: 50%;
                        line-height: 80px;
                        font-size: 48px;
                        color: white;
                        font-weight: bold;
                        box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
                    }
                    h2 {
                        color: #0066cc;
                        font-size: 26px;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .message-box {
                        background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
                        border-left: 4px solid #28a745;
                        padding: 20px;
                        margin: 25px 0;
                        border-radius: 5px;
                    }
                    .message-box p {
                        margin: 0;
                        color: #2e7d32;
                        font-weight: 500;
                    }
                    ul {
                        list-style: none;
                        padding: 0;
                        margin: 20px 0;
                    }
                    ul li {
                        padding: 12px 0;
                        color: #555;
                        border-bottom: 1px solid #f0f0f0;
                        font-size: 15px;
                    }
                    ul li:last-child {
                        border-bottom: none;
                    }
                    p {
                        margin-bottom: 15px;
                        color: #555;
                        font-size: 15px;
                    }
                    .signature {
                        margin-top: 35px;
                        padding-top: 25px;
                        border-top: 2px solid #e0e0e0;
                    }
                    .signature p {
                        margin: 5px 0;
                        color: #333;
                    }
                    .signature strong {
                        color: #0066cc;
                        font-size: 16px;
                    }
                    .footer {
                        background-color: #f8f9fa;
                        padding: 20px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                        border-top: 1px solid #e0e0e0;
                    }
                    .footer p {
                        margin: 5px 0;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            ${logoImgTag}
                        </div>
                        <h1>Leo Club of Kathmandu Alka</h1>
                    </div>
                    <div class="content">
                        <div class="success-badge">
                            <div class="success-icon">✓</div>
                        </div>
                        <h2>Thank You for Subscribing!</h2>
                        <p>We're excited to have you join our newsletter community! You'll now receive regular updates about:</p>
                        <ul>
                            <li>📅 Upcoming events and activities</li>
                            <li>🎉 Community stories and achievements</li>
                            <li>💡 Volunteer opportunities</li>
                            <li>🌟 Member spotlights and highlights</li>
                            <li>📢 Important announcements</li>
                        </ul>
                        <div class="message-box">
                            <p>Your subscription has been confirmed. You'll start receiving our newsletter soon!</p>
                        </div>
                        <p>Stay connected with us on social media for even more updates:</p>
                        <ul>
                            <li>📘 Facebook: <a href="https://www.facebook.com/leoktmalka" style="color: #0066cc;">@leoktmalka</a></li>
                            <li>📷 Instagram: <a href="https://www.instagram.com/leo_ktmalka/" style="color: #0066cc;">@leo_ktmalka</a></li>
                            <li>🐦 Twitter: <a href="https://x.com/leo_ktmalka" style="color: #0066cc;">@leo_ktmalka</a></li>
                        </ul>
                        <p>If you ever wish to unsubscribe, you can do so by replying to this email or contacting us directly.</p>
                        <div class="signature">
                            <p>Best regards,</p>
                            <p><strong>Leo Club Communication Team</strong></p>
                            <p>Leo Club of Kathmandu Alka</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>&copy; ${new Date().getFullYear()} Leo Club of Kathmandu Alka. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            Thank You for Subscribing!

            We're excited to have you join our newsletter community! You'll now receive regular updates about:
            - Upcoming events and activities
            - Community stories and achievements
            - Volunteer opportunities
            - Member spotlights and highlights
            - Important announcements

            Your subscription has been confirmed. You'll start receiving our newsletter soon!

            Stay connected with us on social media:
            - Facebook: https://www.facebook.com/leoktmalka
            - Instagram: https://www.instagram.com/leo_ktmalka/
            - Twitter: https://x.com/leo_ktmalka

            If you ever wish to unsubscribe, you can do so by replying to this email or contacting us directly.

            Best regards,
            Leo Club Communication Team
            Leo Club of Kathmandu Alka
        `
    };

    try {
        console.log('Attempting to send newsletter confirmation email to:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Newsletter confirmation email sent successfully:', info.messageId, 'to:', email);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending newsletter confirmation email to:', email);
        console.error('Error details:', error.message);
        console.error('Error code:', error.code);
        console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        return { success: false, error: error.message };
    }
}

/**
 * Send newsletter unsubscribe notification email
 * @param {String} email - Subscriber email address
 */
async function sendNewsletterUnsubscribeEmail(email) {
    const logoAttachment = getLogoAttachment();
    const logoImgTag = logoAttachment 
        ? `<img src="cid:leoclub-logo" alt="Leo Club Logo" style="max-width: 120px; height: auto; background-color: white; padding: 10px; border-radius: 8px; display: block; margin: 0 auto;" />`
        : '<h1 style="font-size: 24px; font-weight: 600; margin: 0;">Leo Club</h1>';
    
    const mailOptions = {
        from: `"Leo Club" <${SENDER_EMAIL}>`,
        to: email,
        subject: 'You have been unsubscribed - Leo Club Newsletter',
        attachments: logoAttachment ? [logoAttachment] : [],
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; padding: 20px; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #0066cc 0%, #004d99 100%); color: white; padding: 30px 20px; text-align: center; }
                    .logo-container { margin-bottom: 15px; }
                    .header h1 { font-size: 24px; font-weight: 600; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                    .content { padding: 40px 30px; background-color: #ffffff; }
                    .info-badge { text-align: center; margin-bottom: 25px; }
                    .info-icon { display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #6c757d 0%, #495057 100%); border-radius: 50%; line-height: 80px; font-size: 48px; color: white; font-weight: bold; box-shadow: 0 4px 8px rgba(108,117,125,0.3); }
                    h2 { color: #0066cc; font-size: 26px; margin-bottom: 20px; text-align: center; }
                    .message-box { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-left: 4px solid #6c757d; padding: 20px; margin: 25px 0; border-radius: 5px; }
                    .message-box p { margin: 0; color: #495057; font-weight: 500; }
                    p { margin-bottom: 15px; color: #555; font-size: 15px; }
                    .signature { margin-top: 35px; padding-top: 25px; border-top: 2px solid #e0e0e0; }
                    .signature p { margin: 5px 0; color: #333; }
                    .signature strong { color: #0066cc; font-size: 16px; }
                    .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0; }
                    .footer p { margin: 5px 0; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <div class="logo-container">
                            ${logoImgTag}
                        </div>
                        <h1>Leo Club of Kathmandu Alka</h1>
                    </div>
                    <div class="content">
                        <div class="info-badge">
                            <div class="info-icon">!</div>
                        </div>
                        <h2>You Have Been Unsubscribed</h2>
                        <div class="message-box">
                            <p>You have been removed from the Leo Club newsletter mailing list by the administrator.</p>
                        </div>
                        <p>You will no longer receive newsletter updates from Leo Club of Kathmandu Alka.</p>
                        <p>If you believe this was done in error, or if you would like to re-subscribe, please visit our website and subscribe again, or contact us directly.</p>
                        <p>We appreciate your past interest in staying connected with our community. Thank you for being part of our journey!</p>
                        <div class="signature">
                            <p>Best regards,</p>
                            <p><strong>Leo Club Communication Team</strong></p>
                            <p>Leo Club of Kathmandu Alka</p>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply to this message.</p>
                        <p>&copy; ${new Date().getFullYear()} Leo Club of Kathmandu Alka. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            You Have Been Unsubscribed

            You have been removed from the Leo Club newsletter mailing list by the administrator.

            You will no longer receive newsletter updates from Leo Club of Kathmandu Alka.

            If you believe this was done in error, or if you would like to re-subscribe, please visit our website and subscribe again, or contact us directly.

            We appreciate your past interest in staying connected with our community. Thank you for being part of our journey!

            Best regards,
            Leo Club Communication Team
            Leo Club of Kathmandu Alka
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        const errorMessage = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' 
            ? 'Email service connection error. Please check your network and SMTP settings.'
            : error.message;
        console.error('Error sending newsletter unsubscribe email:', errorMessage);
        return { success: false, error: errorMessage };
    }
}

module.exports = {
    sendApprovalEmail,
    sendRejectionEmail,
    sendNewsletterConfirmationEmail,
    sendNewsletterUnsubscribeEmail
};
