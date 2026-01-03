// backend/services/emailService.js
import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

// Feature Flag: Set to 1 to enable email sending, 0 to disable
const EMAIL_ENABLED = parseInt(process.env.EMAIL_ENABLED || '0');

// List of fake email domain patterns to skip
const FAKE_EMAIL_PATTERNS = [
    '@ex.com',
    '@ex.',
    '@example.com',
    '@example.',
    '@test.com',
    '@test.',
    '@fake.',
    '@demo.',
    '@sample.'
];

/**
 * Check if email is valid (not a fake/test email)
 */
const isValidEmail = (email) => {
    if (!email) return false;

    const lowerEmail = email.toLowerCase();

    // Check against fake email patterns
    for (const pattern of FAKE_EMAIL_PATTERNS) {
        if (lowerEmail.includes(pattern)) {
            console.log(`📧 Skipping fake email: ${email}`);
            return false;
        }
    }

    return true;
};

/**
 * Create email transporter
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Send login notification email
 * @param {Object} user - User object with email, first_name, last_name
 * @param {string} role - User role (client, lawyer, admin, etc.)
 * @param {string} ip - IP address (optional)
 */
export const sendLoginNotification = async (user, role, ip = 'غير معروف') => {
    // Check if email feature is enabled
    if (!EMAIL_ENABLED) {
        console.log('📧 Email notifications disabled (EMAIL_ENABLED=0)');
        return { success: false, reason: 'disabled' };
    }

    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('📧 Email credentials not configured');
        return { success: false, reason: 'not_configured' };
    }

    // Check if email is valid (not fake)
    if (!isValidEmail(user.email)) {
        return { success: false, reason: 'fake_email' };
    }

    try {
        const transporter = createTransporter();

        const roleNames = {
            client: 'عميل',
            lawyer: 'محامي',
            admin: 'مسؤول',
            super_admin: 'مسؤول عام',
            court_clerk: 'موظف قلم محكمة'
        };

        const roleName = roleNames[role] || role;
        const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'المستخدم';
        const loginTime = new Date().toLocaleString('ar-EG', {
            timeZone: 'Asia/Jerusalem',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const mailOptions = {
            from: `"المنصة القانونية" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: '🔐 تسجيل دخول جديد إلى حسابك',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1e40af, #0891b2); padding: 30px; border-radius: 15px 15px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0;">⚖️ المنصة القانونية</h1>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 15px 15px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #1e40af; margin-top: 0;">مرحباً ${userName}!</h2>
                        
                        <p style="color: #334155; font-size: 16px; line-height: 1.8;">
                            تم تسجيل الدخول إلى حسابك بنجاح.
                        </p>
                        
                        <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0; border-right: 4px solid #0891b2;">
                            <p style="margin: 10px 0; color: #475569;">
                                <strong>⌛ الوقت:</strong> ${loginTime}
                            </p>
                            <p style="margin: 10px 0; color: #475569;">
                                <strong>👤 الدور:</strong> ${roleName}
                            </p>
                            <p style="margin: 10px 0; color: #475569;">
                                <strong>📧 البريد:</strong> ${user.email}
                            </p>
                        </div>
                        
                        <div style="background: #fef3c7; border-radius: 10px; padding: 15px; margin: 20px 0;">
                            <p style="color: #92400e; margin: 0; font-size: 14px;">
                                ⚠️ إذا لم تقم بتسجيل الدخول، يرجى تغيير كلمة المرور فوراً والتواصل مع الدعم الفني.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;">
                        
                        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
                            هذه رسالة تلقائية من المنصة القانونية. لا ترد على هذا البريد.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Login notification sent to: ${user.email}`);
        return { success: true };

    } catch (error) {
        console.error('📧 Error sending login email:', error.message);
        return { success: false, reason: 'error', error: error.message };
    }
};

export default { sendLoginNotification, isValidEmail };
