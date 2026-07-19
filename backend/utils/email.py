"""
Email sending helpers. send_email() is the shared low-level Brevo sender used
by every other email helper in the app (auth emails, collab notifications,
account-lock alerts). Auth-specific templates (verification, welcome,
password reset) live here too since routes/auth.py depends on them.
"""
from datetime import datetime
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from sib_api_v3_sdk.models import SendSmtpEmail

from config import logger, TEST_MODE
from extensions import brevo_client, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME


def send_email(recipient_emails, subject, html_body):
    """
    Send transactional email via Brevo.
    
    recipient_emails: str (single) or list of dicts [{'email':..,'name':..}, ...]
    """
    # Prepare recipient list
    if isinstance(recipient_emails, str):
        to_list = [{"email": recipient_emails}]
    elif isinstance(recipient_emails, list):
        to_list = []
        for r in recipient_emails:
            if isinstance(r, str):
                to_list.append({"email": r})
            elif isinstance(r, dict) and "email" in r:
                to_list.append(r)
    else:
        raise ValueError("recipient_emails must be str or list of emails/dicts")

    # Construct Brevo email
    email_to_send = SendSmtpEmail(
        to=to_list,
        html_content=html_body,
        sender={"name": BREVO_SENDER_NAME, "email": BREVO_SENDER_EMAIL},
        subject=subject
    )

    try:
        # Try sending via Brevo
        response = brevo_client.send_transac_email(email_to_send)
        logger.info(f"Email sent successfully to {to_list} via Brevo!")
        return True

    except ApiException as api_err:
        logger.error(f"Brevo API exception: {api_err}")
        return False

    except Exception as e:
        logger.error(f"General error sending email: {e}")
        return False




def send_verification_email(email, verification_code):
    if TEST_MODE:
        logger.info(f"[TEST MODE] Skipping email to {email}")
        return

    # Unique Subject Line to Prevent Email Threading
    subject = f"🔹 Justice Genie - Verify Your Email ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"
    
    # Justice Genie Logo
    logo_url = "https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png"

    # HTML Email Body
    body = f"""
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f7f9fc;">
        <div style="max-width:600px;margin:40px auto;background:white;padding:40px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <div style="text-align:center;margin-bottom:32px;">
                <img src="{logo_url}" alt="Justice Genie Logo" style="width:120px;height:auto;">
            </div>
            <h1 style="color:#1a1a1a;font-size:24px;text-align:center;margin-bottom:24px;">Verify Your Email Address</h1>
            <p style="color:#444;font-size:16px;line-height:1.6;text-align:center;margin-bottom:32px;">
                Welcome to <strong>Justice Genie</strong>. To ensure the security of your account, please use the verification code below.
            </p>
            <div style="background:#f8f9fa;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
                <span style="font-family:monospace;font-size:32px;font-weight:600;color:#2563eb;letter-spacing:4px;">
                    {verification_code}
                </span>
            </div>
            <p style="color:#666;font-size:14px;text-align:center;margin-top:24px;">
                This code will expire shortly. If you didn't request this verification, please ignore this email.
            </p>
            <div style="border-top:1px solid #eaeaea;margin-top:32px;padding-top:32px;text-align:center;">
                <p style="color:#666;font-size:14px;margin:0;">Justice Genie - Empowering citizens with knowledge</p>
                <p style="color:#666;font-size:12px;margin-top:8px;">This is an automated message, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send the email in a separate thread to avoid blocking
    
    logger.info(f"Preparing to send verification email to: {email}")
    try:
         send_email(email, subject, body)
         logger.info(f"Verification email successfully queued for: {email}")
         return True
    except Exception as e:
         logger.error(f"Failed to send verification email to {email}: {e}")
         return False


def send_welcome_email(email, username):
    
    subject = f"🎉 Welcome to Justice Genie - Your Legal Empowerment Journey Begins!({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Enhanced HTML template with better email client compatibility
    body = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Welcome to Justice Genie</title>
        <!--[if mso]>
        <style type="text/css">
            table {{border-collapse: collapse; border-spacing: 0; margin: 0;}}
            div, td {{padding: 0;}}
            div {{margin: 0 !important;}}
        </style>
        <noscript>
            <xml>
                <o:OfficeDocumentSettings>
                    <o:PixelsPerInch>96</o:PixelsPerInch>
                </o:OfficeDocumentSettings>
            </xml>
        </noscript>
        <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; width: 100%; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased; background-color: #f0f4f8;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin: 0; padding: 0; background-color: #f0f4f8;">
            <tr>
                <td align="center" style="padding: 40px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                                <img src="https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png" 
                                    alt="Justice Genie Logo" 
                                    style="width: 200px; height: auto; margin-bottom: 30px; border: 3px solid white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                                
                                <h1 style="color: white; margin: 0 0 15px; font-size: 32px; line-height: 1.2; font-weight: 700;">
                                    Welcome to Justice Genie, {username}! ⚖️
                                </h1>
                                
                                <p style="color: #e2e8f0; margin: 0; font-size: 18px;">
                                    Your path to legal empowerment starts here
                                </p>
                            </td>
                        </tr>

                        <!-- Introduction -->
                        <tr>
                            <td style="padding: 40px 30px; background-color: white;">
                                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                    We're thrilled to have you join Justice Genie! Here are some powerful features waiting for you:
                                </p>
                            </td>
                        </tr>

                        <!-- Features Grid -->
                        <tr>
                            <td style="padding: 0 30px 40px;">
                                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                    <!-- AI Assistant Feature -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                                                <tr>
                                                    <td style="padding: 20px;">
                                                         <img src="https://tse2.mm.bing.net/th?id=OIP.i3-CCHf7-QIfShu91Jqg9QHaHa&pid=Api" 
                                                            alt="AI and Law Ethics" 
                                                            style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
                                                        <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 22px;">🤖 AI-Powered Legal Assistant</h3>
                                                        <p style="color: #475569; margin: 0; line-height: 1.6;">
                                                            Get instant, accurate legal insights powered by advanced AI technology.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Secure Chat Feature -->
                                    <tr>
                                        <td style="padding-bottom: 30px;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                                                <tr>
                                                    <td style="padding: 20px;">
                                                        <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800" 
                                                            alt="Secure Chat" 
                                                            style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
                                                        <h3 style="color: #1e3a8a; margin: 0 0 10px; font-size: 22px;">🔒 Secure Chat & History</h3>
                                                        <p style="color: #475569; margin: 0; line-height: 1.6;">
                                                            End-to-end encrypted conversations with complete history control.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Stats Section -->
                                    <tr>
                                        <td style="padding: 30px 0;">
                                            <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                                                <tr>
                                                    <td style="width: 33.33%; text-align: center; padding: 0 10px;">
                                                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">95%</h4>
                                                            <p style="color: #475569; margin: 0;">Success Rate</p>
                                                        </div>
                                                    </td>
                                                    <td style="width: 33.33%; text-align: center; padding: 0 10px;">
                                                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">30+</h4>
                                                            <p style="color: #475569; margin: 0;">Users Helped</p>
                                                        </div>
                                                    </td>
                                                    <td style="width: 33.33%; text-align: center; padding: 0 10px;">
                                                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
                                                            <h4 style="color: #1e3a8a; margin: 0 0 5px; font-size: 24px;">24/7</h4>
                                                            <p style="color: #475569; margin: 0;">Support</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- CTA Button -->
                                    <tr>
                                        <td style="padding: 20px 0 40px; text-align: center;">
                                            <a href="https://justice-genie-mu.vercel.app/login" 
                                                style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px;">
                                                Start Your Journey Now ⚖️
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 40px 30px; text-align: center;">
                                <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 20px;">
                                    Follow us on social media:
                                </p>
                                
                                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 240px; margin: 0 auto;">
                                    <tr>
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://x.com/SYaganti44806" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Twitter_colored_svg-512.png" 
                                                    alt="Twitter" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://www.linkedin.com/in/subhash-yaganti-a8b3b626a/" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Linkedin_unofficial_colored_svg-512.png" 
                                                    alt="LinkedIn" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://instagram.com/subhash_spoidy" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Instagram_colored_svg_1-512.png" 
                                                    alt="Instagram" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                        
                                        <td align="center" style="padding: 0 10px;">
                                            <a href="https://github.com/subhash-22-codes" style="text-decoration: none;">
                                                <img src="https://cdn2.iconfinder.com/data/icons/social-icons-33/128/Github-512.png" 
                                                    alt="GitHub" style="width: 32px; height: 32px;">
                                            </a>
                                        </td>
                                  
                                    </tr>
                                </table>

                                <p style="color: #e2e8f0; font-size: 14px; margin: 20px 0 0;">
                                    © 2025 Justice Genie. All rights reserved.<br>
                                    <span style="color: #94a3b8;">Empowering citizens with knowledge, one step at a time.</span>
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    logger.info(f"Preparing to send welcome email to: {email}")
    
    try:
        send_email(email, subject, body)
        logger.info(f"Welcome email successfully queued for: {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {e}")
        return False



def send_forgot_password_email(email, reset_code):
    
    subject = f"🔑 JUSTICE GENIE - Reset Your Password & Unlock Your Legal Power ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')})"

    # Justice Genie Logo (replace with actual URL)
    logo_url = "https://res.cloudinary.com/dggciuh9l/image/upload/v1760548194/profile_pics/sswolspeqyywjimwegbh.png"

    # HTML Email Body
    body = f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f7f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div style="max-width: 600px; margin: 40px auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="{logo_url}" alt="Justice Genie Logo" style="width: 120px; height: auto;">
            </div>

            <h1 style="color: #1a1a1a; font-size: 24px; text-align: center; margin-bottom: 24px;">
                Reset Your Password
            </h1>

            <p style="color: #444444; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px;">
                We received a request to reset your <strong>Justice Genie</strong> password. Use the code below to set up a new password for your account.
            </p>

            <!-- Reset Code Box -->
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 600; color: #2563eb; letter-spacing: 4px;">
                    {reset_code}
                </span>
            </div>

            <p style="color: #666666; font-size: 14px; text-align: center; margin-top: 24px;">
                This code will expire shortly. If you didn't request this reset, please contact our support team.
            </p>

            <!-- Footer -->
            <div style="border-top: 1px solid #eaeaea; margin-top: 32px; padding-top: 32px; text-align: center;">
                <p style="color: #666666; font-size: 14px; margin: 0;">
                    Justice Genie - Empowering citizens with knowledge
                </p>
                <p style="color: #666666; font-size: 12px; margin-top: 8px;">
                    This is an automated message, please do not reply.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


    # Email Setup
    logger.info(f"Preparing to send password reset email to: {email}")
    try:
        send_email(email, subject, body)
        logger.info(f"Password reset email successfully queued for: {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        return False

