import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;

    if (host && port && user && pass) {
      this.config = {
        host,
        port: parseInt(port, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass },
        from: from || user,
      };

      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });

      console.log('✓ Email service initialized');
    } else {
      console.warn('⚠️  Email service not configured. Set SMTP_* environment variables to enable email notifications.');
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async sendSpendingAlert(
    to: string,
    keyLabel: string,
    actualSpend: number,
    threshold: number,
    thresholdType: 'daily' | 'monthly'
  ): Promise<boolean> {
    if (!this.transporter || !this.config) {
      console.log('Email notifications not configured, skipping email send');
      return false;
    }

    try {
      const subject = `⚠️  API Cost Alert: ${keyLabel}`;
      const timeframe = thresholdType === 'daily' ? 'today' : 'this month';

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f59e0b; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
            .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
            .metric { font-size: 24px; font-weight: bold; color: #dc2626; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⚠️  Spending Alert</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Your API key <strong>${keyLabel}</strong> has exceeded its ${thresholdType} spending threshold.</p>

              <div class="alert-box">
                <p style="margin: 0 0 10px 0;"><strong>Alert Details:</strong></p>
                <p style="margin: 5px 0;">Threshold: <strong>$${threshold.toFixed(2)}</strong></p>
                <p style="margin: 5px 0;">Actual spend ${timeframe}: <span class="metric">$${actualSpend.toFixed(2)}</span></p>
                <p style="margin: 5px 0;">Overage: <strong style="color: #dc2626;">$${(actualSpend - threshold).toFixed(2)}</strong></p>
              </div>

              <p>Please review your usage and consider:</p>
              <ul>
                <li>Checking your recent API activity for unusual patterns</li>
                <li>Adjusting your spending thresholds if needed</li>
                <li>Reviewing your alert settings in the dashboard</li>
              </ul>

              <p>This is an automated alert from your API Cost Tracker.</p>
            </div>
            <div class="footer">
              <p>API Cost Tracker - Automated Spending Monitoring</p>
              <p>You received this email because you set up a spending alert for this API key.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const text = `
Spending Alert: ${keyLabel}

Your API key "${keyLabel}" has exceeded its ${thresholdType} spending threshold.

Alert Details:
- Threshold: $${threshold.toFixed(2)}
- Actual spend ${timeframe}: $${actualSpend.toFixed(2)}
- Overage: $${(actualSpend - threshold).toFixed(2)}

Please review your usage and check the dashboard for more details.

---
API Cost Tracker - Automated Spending Monitoring
      `.trim();

      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject,
        text,
        html,
      });

      console.log(`✓ Spending alert email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending spending alert email:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    if (!this.transporter || !this.config) {
      throw new Error('Email service not configured');
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        to,
        subject: 'API Cost Tracker - Test Email',
        text: 'This is a test email from your API Cost Tracker. Email notifications are working correctly!',
        html: '<p>This is a test email from your <strong>API Cost Tracker</strong>. Email notifications are working correctly!</p>',
      });

      console.log(`✓ Test email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
