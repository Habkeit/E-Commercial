// app/utils/sendEmail.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOrderConfirmation(
  toEmail: string,
  customerName: string,
  orderId: string,
  totalAmount: string,
  address: string,
) {
  try {
    await transporter.sendMail({
      from: `"Food Delivery App" <${process.env.SMTP_EMAIL}>`,
      to: toEmail,
      subject: "🎉 Xác nhận đơn hàng thành công!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #fff;">
          <h2 style="color: #e11d48; text-align: center; margin-bottom: 24px;">Cảm ơn bạn đã đặt hàng, ${customerName}!</h2>
          <p style="color: #374151; font-size: 16px;">Đơn hàng của bạn đã được hệ thống ghi nhận và đang chờ nhà hàng xử lý.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #f3f4f6;">
            <p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Mã đơn hàng:</strong> <span style="font-family: monospace; color: #111827;">${orderId}</span></p>
            <p style="margin: 0 0 10px 0; color: #4b5563;"><strong>Địa chỉ giao hàng:</strong> <span style="color: #111827;">${address}</span></p>
            <p style="margin: 0; color: #4b5563; font-size: 18px;"><strong>Tổng thanh toán:</strong> <span style="color: #e11d48; font-weight: 800;">${Number(totalAmount).toLocaleString("en-US")} VND</span></p>
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
            Bạn có thể theo dõi tiến độ đơn hàng trong mục Lịch sử đơn hàng trên hệ thống.
          </p>
        </div>
      `,
    });
    console.log(`Email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error("Lỗi gửi email xác nhận:", error);
  }
}
