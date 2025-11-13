// ==================== utils/emailService.js ====================
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendBookingConfirmation = async (booking) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.email,
    subject: 'Booking Confirmation - NOVUS Consultation',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
          .details h3 { margin-top: 0; color: #667eea; }
          .details ul { list-style: none; padding: 0; }
          .details li { padding: 8px 0; border-bottom: 1px solid #eee; }
          .details li:last-child { border-bottom: none; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NOVUS</h1>
            <h2>Booking Confirmed!</h2>
          </div>
          <div class="content">
            <p>Dear ${booking.name},</p>
            <p>Thank you for scheduling a consultation with NOVUS. We're excited to speak with you!</p>
            
            <div class="details">
              <h3>Booking Details</h3>
              <ul>
                <li><strong>Date:</strong> ${new Date(booking.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>
                <li><strong>Time:</strong> ${booking.time_slot}</li>
                <li><strong>Duration:</strong> 30 minutes</li>
                ${booking.company ? `<li><strong>Company:</strong> ${booking.company}</li>` : ''}
              </ul>
            </div>
            
            <p>Please make sure to be available at the scheduled time. If you need to reschedule or cancel, please contact us as soon as possible.</p>
            
            <div class="footer">
              <p>Best regards,<br><strong>NOVUS Team</strong></p>
              <p>3913 St Andrew's Road | +234 708 279 5914 | contact@novus.com</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent to:', booking.email);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};

exports.sendContactNotification = async (contact) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: `New Contact Message from ${contact.name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Message</h2>
          </div>
          <div class="content">
            <div class="info">
              <p><strong>Name:</strong> ${contact.name}</p>
              <p><strong>Email:</strong> ${contact.email}</p>
              ${contact.subject ? `<p><strong>Subject:</strong> ${contact.subject}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p>${contact.message}</p>
            </div>
            <p><small>Received at: ${new Date(contact.created_at).toLocaleString()}</small></p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact notification email sent');
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};