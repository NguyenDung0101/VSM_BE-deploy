import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private resend: Resend;

  constructor(private configService: ConfigService) {
    console.log("🔍 EmailService constructor - checking config:");
    console.log("RESEND_API_KEY:", this.configService.get<string>("RESEND_API_KEY") ? "SET" : "NOT_SET");
    console.log("SMTP_HOST:", this.configService.get<string>("SMTP_HOST") ? "SET" : "NOT_SET");
    console.log("SMTP_USER:", this.configService.get<string>("SMTP_USER") ? "SET" : "NOT_SET");
    console.log("SMTP_PASS:", this.configService.get<string>("SMTP_PASS") ? "SET" : "NOT_SET");
    
    this.initializeTransporter();
    this.initializeResend();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>("SMTP_HOST"),
      port: this.configService.get<number>("SMTP_PORT") || 587,
      secure: this.configService.get<boolean>("SMTP_SECURE") || false,
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
      tls: {
        rejectUnauthorized: false
      }
    };

    // Debug log để xem cấu hình
    console.log("🔍 SMTP Config Debug:", {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user ? `${smtpConfig.auth.user.substring(0, 3)}***` : "NOT_SET",
      pass: smtpConfig.auth.pass ? "***" : "NOT_SET",
    });

    if (smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(smtpConfig);
      this.logger.log("✅ SMTP transporter initialized successfully");
      
      // Test connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.log("❌ SMTP connection test failed:", error);
        } else {
          console.log("✅ SMTP connection test successful");
        }
      });
    } else {
      this.logger.warn("❌ SMTP config incomplete");
      console.log("Missing config:", {
        host: !smtpConfig.host,
        user: !smtpConfig.auth.user,
        pass: !smtpConfig.auth.pass,
      });
    }
  }
  
  
  private initializeResend() {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    if (apiKey) {
      try {
        this.resend = new Resend(apiKey);
        this.logger.log("✅ Resend client initialized successfully");
      } catch (err) {
        this.logger.error("❌ Failed to initialize Resend client", err as any);
      }
    } else {
      this.logger.warn("ℹ️ RESEND_API_KEY not set - Resend disabled");
    }
  }

  // Method public để check status
  public getServiceStatus() {
    return {
      resend: !!this.resend,
      smtp: !!this.transporter,
    };
  }

  async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
    try {
      console.log(`🚀 Starting OTP email send to: ${email}`);
      console.log(`🔍 Available services:`, this.getServiceStatus());

      const subject = "Mã OTP xác thực tài khoản VSM";
      const htmlContent = this.generateOTPEmailHTML(otp, name);

      // Thử gửi qua Resend trước nếu có
      if (this.resend) {
        console.log("📧 Attempting Resend...");
        try {
          const from = this.configService.get<string>("RESEND_FROM_EMAIL") || "VSM <noreply@vsm.dev>";
          const result = await this.resend.emails.send({
            from,
            to: email,
            subject,
            html: htmlContent,
          });
          console.log("📧 Resend response:", result);
          this.logger.log(`✅ OTP email sent via Resend to ${email}`);
          return true;
        } catch (resendError) {
          console.log("❌ Resend failed:", resendError);
        }
      }

      // Chỉ sử dụng SMTP
      if (this.transporter) {
        console.log("📧 Attempting SMTP...");
        try {
          const mailOptions = {
            from: this.configService.get<string>("SMTP_FROM_EMAIL") || "VSM <noreply@gmail.com>",
            to: email,
            subject,
            html: htmlContent,
          };

          console.log("📧 SMTP mail options:", {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
          });

          const result = await this.transporter.sendMail(mailOptions);
          console.log("📧 SMTP response:", result);
          
          this.logger.log(`✅ OTP email sent via SMTP to ${email}`);
          return true;
        } catch (smtpError) {
          console.log("❌ SMTP failed:", smtpError);
          throw smtpError;
        }
      }

      // Fallback: log ra console
      console.log("⚠️ No SMTP service available, logging to console");
      this.logOTPToConsole(email, otp);
      return true;

    } catch (error) {
      console.error(`❌ Email send failed for ${email}:`, error);
      this.logOTPToConsole(email, otp);
      return true;
    }
  }

  async sendVerificationEmail(email: string, verifyUrl: string, name?: string): Promise<boolean> {
    try {
      console.log(`🚀 Starting verification email send to: ${email}`);
      console.log(`🔍 Available services:`, this.getServiceStatus());

      const subject = "Xác minh email tài khoản VSM";
      const htmlContent = this.generateVerifyEmailHTML(verifyUrl, name);

      // Thử gửi qua Resend trước nếu có
      if (this.resend) {
        console.log("📧 Attempting Resend...");
        try {
          const from = this.configService.get<string>("RESEND_FROM_EMAIL") || "VSM <noreply@vsm.dev>";
          const result = await this.resend.emails.send({
            from,
            to: email,
            subject,
            html: htmlContent,
          });
          console.log("📧 Resend response:", result);
          this.logger.log(`✅ Verification email sent via Resend to ${email}`);
          return true;
        } catch (resendError) {
          console.log("❌ Resend failed:", resendError);
        }
      }

      if (this.transporter) {
        console.log("📧 Attempting SMTP...");
        const mailOptions = {
          from: this.configService.get<string>("SMTP_FROM_EMAIL") || "VSM <noreply@gmail.com>",
          to: email,
          subject,
          html: htmlContent,
        };
        const result = await this.transporter.sendMail(mailOptions);
        console.log("📧 SMTP response:", result);
        this.logger.log(`✅ Verification email sent via SMTP to ${email}`);
        return true;
      }

      console.log("⚠️ No SMTP service available, logging link to console");
      console.log("Verification link:", verifyUrl);
      return true;
    } catch (error) {
      console.error(`❌ Verification email send failed for ${email}:`, error);
      console.log("Verification link:", verifyUrl);
      return true;
    }
  }

  private generateOTPEmailHTML(otp: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã OTP VSM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .otp-number { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏃‍♂️ VSM - Vietnam Student Marathon</h1>
            <p>Xác thực tài khoản của bạn</p>
          </div>
          <div class="content">
            <h2>Xin chào${name ? ` ${name}` : ""}!</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản tại VSM. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP sau:</p>
            
            <div class="otp-code">
              <div class="otp-number">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Lưu ý quan trọng:</strong>
              <ul>
                <li>Mã OTP này có hiệu lực trong <strong>10 phút</strong></li>
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này</li>
              </ul>
            </div>
            
            <p>Nếu bạn gặp khó khăn, vui lòng liên hệ với chúng tôi qua email hỗ trợ.</p>
          </div>
          <div class="footer">
            <p>© 2024 VSM - Vietnam Sports Marathon. Tất cả quyền được bảo lưu.</p>
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateVerifyEmailHTML(verifyUrl: string, name?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác minh email VSM</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 20px; background: #667eea; color: #fff; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏃‍♂️ VSM - Vietnam Student Marathon</h1>
            <p>Xác minh email của bạn</p>
          </div>
          <div class="content">
            <h2>Xin chào${name ? ` ${name}` : ""}!</h2>
            <p>Nhấn vào nút bên dưới để xác minh địa chỉ email của bạn:</p>
            <p><a class="button" href="${verifyUrl}" target="_blank">Xác minh email</a></p>
            <p>Nếu nút không hoạt động, bạn có thể copy đường link sau vào trình duyệt:</p>
            <p>${verifyUrl}</p>
          </div>
          <div class="footer">
            <p>© 2024 VSM - Vietnam Student Marathon.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private logOTPToConsole(email: string, otp: string): void {
    console.log("=".repeat(60));
    console.log("📧 EMAIL OTP FOR TESTING");
    console.log("=".repeat(60));
    console.log(`📧 To: ${email}`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log(`⏰ Expires in: 10 minutes`);
    console.log(`📅 Time: ${new Date().toLocaleString("vi-VN")}`);
    console.log("=".repeat(60));
  }
}