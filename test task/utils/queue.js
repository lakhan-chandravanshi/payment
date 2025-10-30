const Queue = require('bull');
const nodemailer = require('nodemailer');

// Create email queue
const emailQueue = new Queue('email processing', process.env.REDIS_URL || 'redis://localhost:6379');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Process email jobs
emailQueue.process('send-confirmation-email', async (job) => {
  const { orderId, userId, userEmail, totalAmount } = job.data;

  try {
    // In a real application, you would send an actual email here
    // For this demo, we'll just log the email content
    console.log(`📧 Sending confirmation email to ${userEmail}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Total Amount: $${totalAmount}`);
    console.log(`Email sent successfully!`);

    // Mock email sending (replace with actual email sending)
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: 'Order Confirmation - E-Commerce API',
      html: `
        <h2>Order Confirmation</h2>
        <p>Dear Customer,</p>
        <p>Thank you for your order! Your payment has been processed successfully.</p>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Total Amount:</strong> $${totalAmount}</p>
        <p>We will notify you when your order ships.</p>
        <p>Best regards,<br>E-Commerce Team</p>
      `
    };

    // Uncomment the line below to actually send emails
    // await transporter.sendMail(mailOptions);
    
    console.log('✅ Email job completed successfully');
  } catch (error) {
    console.error('❌ Email job failed:', error);
    throw error;
  }
});

// Handle job events
emailQueue.on('completed', (job, result) => {
  console.log(`Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err);
});

emailQueue.on('stalled', (job) => {
  console.warn(`Email job ${job.id} stalled`);
});

module.exports = { emailQueue };
