import { Resend } from 'resend';
import { Order, OrderItem } from './types';

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL || 'DashEats <orders@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function orderItemsList(items: OrderItem[]): string {
  return items
    .map(i => `<li style="padding:4px 0;color:#374151;">${i.quantity}× ${i.name} — $${(i.price * i.quantity).toFixed(2)}</li>`)
    .join('');
}

function baseTemplate(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:#FF3008;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">DashEats</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin:0 0 16px;color:#111827;font-size:18px;font-weight:700;">${title}</h2>
          ${body}
        </div>
        <div style="padding:16px 32px;background:#f3f4f6;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} DashEats. Questions? Reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendOrderConfirmation(
  order: Order & { restaurant_name: string },
  items: OrderItem[],
  userEmail: string,
  userName: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi ${userName},</p>
    <p style="color:#374151;margin:0 0 16px;">Your order from <strong>${order.restaurant_name}</strong> has been placed!</p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Order #${order.id}</p>
      <ul style="margin:0;padding:0 0 0 16px;">${orderItemsList(items)}</ul>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-between;color:#111827;font-weight:700;font-size:15px;">
          <span>Total</span><span>$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    <p style="color:#374151;margin:0 0 20px;">Estimated delivery: ${order.delivery_max ?? 45} min</p>
    <a href="${APP_URL}/orders/${order.id}" style="display:inline-block;background:#FF3008;color:#ffffff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">Track Order</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `Order confirmed! Your ${order.restaurant_name} order is being prepared`,
    html: baseTemplate('Order Confirmed!', body),
  });
}


export async function sendDriverCancellation(
  order: Order & { restaurant_name: string },
  userEmail: string,
  userName: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi ${userName},</p>
    <p style="color:#374151;margin:0 0 16px;">Unfortunately your driver had to cancel your order from <strong>${order.restaurant_name}</strong>. We're finding you a new driver — no action needed on your end.</p>
    <a href="${APP_URL}/orders/${order.id}" style="display:inline-block;background:#FF3008;color:#ffffff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">Track Order</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `Driver update for your ${order.restaurant_name} order`,
    html: baseTemplate('Driver Cancelled — Finding a New One', body),
  });
}

export async function sendDeliveryReceipt(
  order: Order & { restaurant_name: string },
  items: OrderItem[],
  userEmail: string,
  userName: string
): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi ${userName},</p>
    <p style="color:#374151;margin:0 0 16px;">Your order from <strong>${order.restaurant_name}</strong> has been delivered. Enjoy your meal!</p>
    <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Order #${order.id}</p>
      <ul style="margin:0;padding:0 0 0 16px;">${orderItemsList(items)}</ul>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
        <div style="display:flex;justify-content:space-between;color:#111827;font-weight:700;font-size:15px;">
          <span>Total</span><span>$${order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
    <a href="${APP_URL}/orders/${order.id}" style="display:inline-block;background:#FF3008;color:#ffffff;font-weight:600;padding:12px 24px;border-radius:10px;text-decoration:none;">Leave a Review</a>
  `;

  await resend.emails.send({
    from: FROM,
    to: userEmail,
    subject: `Delivered! Your ${order.restaurant_name} order has arrived`,
    html: baseTemplate('Order Delivered!', body),
  });
}
