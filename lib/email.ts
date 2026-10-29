import { Resend } from 'resend';
import prisma from '@/lib/prisma';

// Default recipient requested by website owner
export const DEFAULT_ADMIN_EMAIL = 'raj.mandhyan@gmail.com';

export interface EmailSendResult {
  success: boolean;
  skipped?: boolean;
  emailId?: string;
  error?: string;
}

interface AddressData {
  name?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Format Indian Rupee currency string
 */
function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date in Indian Standard Time (IST)
 */
function formatISTDateTime(date: Date): { formatted: string; iso: string } {
  try {
    const formatted = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium',
    }).format(date);
    return { formatted: `${formatted} (IST)`, iso: date.toISOString() };
  } catch {
    return { formatted: date.toLocaleString('en-IN'), iso: date.toISOString() };
  }
}

/**
 * Generate responsive, clean HTML email template
 */
function generateOrderEmailHtml(order: any, address: AddressData, dateTime: { formatted: string; iso: string }): string {
  const customerName = address.name || order.user?.name || 'Valued Customer';
  const customerEmail = order.user?.email || 'Not provided';
  const customerPhone = address.phone || 'Not provided';

  const fullAddress = [
    address.street,
    address.city,
    address.state ? `${address.state} - ${address.postalCode || ''}` : address.postalCode,
    address.country || 'India',
  ].filter(Boolean).join(', ');

  const razorpayPaymentId = order.payment?.razorpayPaymentId || 'N/A';
  const razorpayOrderId = order.razorpayOrderId || order.payment?.razorpayOrderId || 'N/A';

  // Item rows
  const itemRows = order.items.map((item: any, index: number) => {
    const lineTotal = item.price * item.quantity;
    const isCustom = Boolean(item.customPosterId || item.customPoster);
    const customImageUrl = item.customPoster?.imageUrl;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 14px 16px; vertical-align: top;">
          <div style="font-weight: 600; color: #0f172a; font-size: 15px; margin-bottom: 4px;">
            ${item.title}
            ${isCustom ? '<span style="background-color: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; margin-left: 6px; text-transform: uppercase;">Custom Artwork</span>' : ''}
          </div>
          <div style="font-size: 13px; color: #64748b; line-height: 1.5;">
            <span><strong>Size:</strong> ${item.sizeName}${item.sizeDimensions ? ` (${item.sizeDimensions})` : ''}</span>
            ${item.frameName ? `<span style="margin-left: 10px;">• <strong>Frame:</strong> ${item.frameName}</span>` : ''}
            ${item.paperType ? `<span style="margin-left: 10px;">• <strong>Paper:</strong> ${item.paperType}</span>` : ''}
          </div>
          ${isCustom && customImageUrl ? `
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
              <a href="${customImageUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block;">
                <img src="${customImageUrl}" alt="Custom Poster Artwork" style="width: 72px; height: 90px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
              </a>
              <div>
                <a href="${customImageUrl}" target="_blank" rel="noopener noreferrer" style="color: #ea580c; font-size: 13px; font-weight: 600; text-decoration: underline;">
                  View Full Artwork &rarr;
                </a>
                <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
                  Orientation: ${item.customPoster?.orientation || 'PORTRAIT'}
                </div>
              </div>
            </div>
          ` : ''}
        </td>
        <td style="padding: 14px 16px; vertical-align: top; text-align: center; font-size: 14px; font-weight: 600; color: #334155;">
          ${item.quantity}
        </td>
        <td style="padding: 14px 16px; vertical-align: top; text-align: right; font-size: 14px; color: #334155;">
          ${formatINR(item.price)}
        </td>
        <td style="padding: 14px 16px; vertical-align: top; text-align: right; font-size: 14px; font-weight: 700; color: #0f172a;">
          ${formatINR(lineTotal)}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Paid Order – HellFire Prints</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 660px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 28px; text-align: center; border-bottom: 3px solid #ea580c;">
              <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                HELLFIRE PRINTS
              </h1>
              <p style="margin: 0; color: #fdba74; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                E-Commerce Store Order Alert
              </p>
            </td>
          </tr>

          <!-- Success Alert Banner -->
          <tr>
            <td style="padding: 24px 28px 12px 28px;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="color: #065f46; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; margin-right: 6px;"></span>
                    Payment Verified &amp; Confirmed
                  </div>
                  <div style="color: #047857; font-size: 13px; margin-top: 4px;">
                    Order <strong>#${order.orderNumber || order.id}</strong> has been successfully captured.
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="background-color: #059669; color: #ffffff; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase;">
                    PAID
                  </span>
                </div>
              </div>
            </td>
          </tr>

          <!-- Order Summary Quick Card -->
          <tr>
            <td style="padding: 12px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Order ID</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 600; margin-top: 3px; font-family: monospace;">${order.id}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Order Number</div>
                    <div style="font-size: 14px; color: #0f172a; font-weight: 700; margin-top: 3px;">#${order.orderNumber}</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Date &amp; Time</div>
                    <div style="font-size: 13px; color: #334155; margin-top: 3px;">${dateTime.formatted}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Payment Gateway</div>
                    <div style="font-size: 13px; color: #334155; margin-top: 3px; font-weight: 600;">Razorpay (Verified)</div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="vertical-align: top; padding: 6px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Razorpay Payment ID</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 3px; font-family: monospace;">${razorpayPaymentId}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding: 6px 10px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 700;">Razorpay Order ID</div>
                    <div style="font-size: 13px; color: #0f172a; font-weight: 600; margin-top: 3px; font-family: monospace;">${razorpayOrderId}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Shipping Information -->
          <tr>
            <td style="padding: 12px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Customer Details -->
                  <td width="48%" style="vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                      Customer Details
                    </div>
                    <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
                      ${customerName}
                    </div>
                    <div style="font-size: 13px; color: #475569; margin-bottom: 4px;">
                      <strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #ea580c; text-decoration: none;">${customerEmail}</a>
                    </div>
                    <div style="font-size: 13px; color: #475569;">
                      <strong>Phone:</strong> <a href="tel:${customerPhone}" style="color: #ea580c; text-decoration: none;">${customerPhone}</a>
                    </div>
                  </td>

                  <td width="4%">&nbsp;</td>

                  <!-- Shipping Address -->
                  <td width="48%" style="vertical-align: top; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                    <div style="font-size: 12px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                      Delivery Address
                    </div>
                    <div style="font-size: 13px; color: #334155; line-height: 1.6;">
                      ${fullAddress || 'No shipping address provided.'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer Instructions / Notes -->
          ${order.additionalNote ? `
          <tr>
            <td style="padding: 6px 28px 12px 28px;">
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 800; color: #92400e; margin-bottom: 4px;">
                  Customer Special Instructions / Notes:
                </div>
                <div style="font-size: 13px; color: #78350f; font-style: italic; line-height: 1.5;">
                  &ldquo;${order.additionalNote}&rdquo;
                </div>
              </div>
            </td>
          </tr>
          ` : ''}

          <!-- Items Ordered Table -->
          <tr>
            <td style="padding: 16px 28px 8px 28px;">
              <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                Ordered Products (${order.items.length})
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #0f172a; color: #ffffff;">
                    <th align="left" style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
                    <th align="center" style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Qty</th>
                    <th align="right" style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Unit Price</th>
                    <th align="right" style="padding: 12px 16px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown -->
          <tr>
            <td style="padding: 16px 28px 24px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40%">&nbsp;</td>
                  <td width="60%">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Item Subtotal:</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #0f172a; padding: 4px 0;">
                          ${formatINR(order.subtotal)}
                        </td>
                      </tr>
                      ${order.discount > 0 ? `
                      <tr>
                        <td style="font-size: 13px; color: #16a34a; padding: 4px 0;">
                          Discount ${order.couponCode ? `(${order.couponCode})` : ''}:
                        </td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #16a34a; padding: 4px 0;">
                          -${formatINR(order.discount)}
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Shipping Fee:</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #0f172a; padding: 4px 0;">
                          ${order.shippingFee === 0 ? '<span style="color: #16a34a; font-weight: 700;">FREE</span>' : formatINR(order.shippingFee)}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #64748b; padding: 4px 0;">Tax (GST):</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #0f172a; padding: 4px 0;">
                          ${order.tax > 0 ? formatINR(order.tax) : 'Included'}
                        </td>
                      </tr>
                      <tr style="border-top: 2px solid #e2e8f0;">
                        <td style="font-size: 16px; font-weight: 800; color: #0f172a; padding-top: 10px;">
                          Total Paid:
                        </td>
                        <td align="right" style="font-size: 18px; font-weight: 800; color: #ea580c; padding-top: 10px;">
                          ${formatINR(order.total)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 28px; text-align: center; border-top: 1px solid #1e293b;">
              <div style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
                This is an automated order notification sent to the store owner at <strong style="color: #cbd5e1;">raj.mandhyan@gmail.com</strong>.
              </div>
              <div style="color: #64748b; font-size: 11px; margin-top: 8px;">
                HellFire Prints &bull; High-Definition Aesthetic Wall Posters &bull; ${new Date().getFullYear()}
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generate clean Plain-Text email fallback
 */
function generateOrderEmailText(order: any, address: AddressData, dateTime: { formatted: string; iso: string }): string {
  const customerName = address.name || order.user?.name || 'Valued Customer';
  const customerEmail = order.user?.email || 'Not provided';
  const customerPhone = address.phone || 'Not provided';

  const fullAddress = [
    address.street,
    address.city,
    address.state ? `${address.state} - ${address.postalCode || ''}` : address.postalCode,
    address.country || 'India',
  ].filter(Boolean).join(', ');

  const razorpayPaymentId = order.payment?.razorpayPaymentId || 'N/A';
  const razorpayOrderId = order.razorpayOrderId || order.payment?.razorpayOrderId || 'N/A';

  const itemsText = order.items.map((item: any, idx: number) => {
    const isCustom = Boolean(item.customPosterId || item.customPoster);
    let str = `${idx + 1}. ${item.title}${isCustom ? ' [CUSTOM ARTWORK]' : ''}\n`;
    str += `   - Size: ${item.sizeName}${item.sizeDimensions ? ` (${item.sizeDimensions})` : ''}\n`;
    if (item.frameName) str += `   - Frame: ${item.frameName}\n`;
    if (item.paperType) str += `   - Paper: ${item.paperType}\n`;
    str += `   - Quantity: ${item.quantity}\n`;
    str += `   - Unit Price: ${formatINR(item.price)}\n`;
    str += `   - Item Total: ${formatINR(item.price * item.quantity)}\n`;
    if (isCustom && item.customPoster?.imageUrl) {
      str += `   - Artwork URL: ${item.customPoster.imageUrl}\n`;
      str += `   - Artwork Orientation: ${item.customPoster.orientation || 'PORTRAIT'}\n`;
    }
    return str;
  }).join('\n');

  return `
======================================================================
NEW PAID ORDER RECEIVED – HELLFIRE PRINTS
======================================================================

ORDER DETAILS:
----------------------------------------------------------------------
Order Number        : #${order.orderNumber}
Order ID            : ${order.id}
Date & Time         : ${dateTime.formatted}
Payment Status      : PAID / SUCCESSFULLY VERIFIED
Payment Provider    : Razorpay
Razorpay Payment ID : ${razorpayPaymentId}
Razorpay Order ID   : ${razorpayOrderId}

CUSTOMER INFORMATION:
----------------------------------------------------------------------
Customer Name       : ${customerName}
Customer Email      : ${customerEmail}
Customer Phone      : ${customerPhone}

DELIVERY ADDRESS:
----------------------------------------------------------------------
${fullAddress || 'No shipping address provided.'}

${order.additionalNote ? `
CUSTOMER SPECIAL INSTRUCTIONS:
----------------------------------------------------------------------
"${order.additionalNote}"
` : ''}

ORDERED PRODUCTS:
----------------------------------------------------------------------
${itemsText}

FINANCIAL BREAKDOWN:
----------------------------------------------------------------------
Subtotal            : ${formatINR(order.subtotal)}
${order.discount > 0 ? `Discount (${order.couponCode || 'PROMO'}) : -${formatINR(order.discount)}\n` : ''}Shipping Charges    : ${order.shippingFee === 0 ? 'FREE' : formatINR(order.shippingFee)}
Tax (GST)           : ${order.tax > 0 ? formatINR(order.tax) : 'Included'}
----------------------------------------------------------------------
TOTAL PAID          : ${formatINR(order.total)}
======================================================================

Automated notification dispatched to raj.mandhyan@gmail.com
Hellfire Prints – All rights reserved.
`;
}

/**
 * Core function to send order notification email to the store owner.
 * Strictly verifies payment status and uses atomic locking for idempotency.
 */
export async function sendOrderAdminNotification(orderId: string): Promise<EmailSendResult> {
  if (!orderId) {
    return { success: false, error: 'Order ID is required' };
  }

  try {
    // 1. Fetch order details with all relationships
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            customPoster: true,
          },
        },
        payment: true,
        user: true,
        shippingAddress: true,
      },
    });

    if (!order) {
      console.warn(`[Admin Email] Order not found for ID: ${orderId}`);
      return { success: false, error: 'Order not found' };
    }

    // 2. Strict Check: Trigger email ONLY after successful payment verification
    if (order.paymentStatus !== 'CAPTURED') {
      console.log(`[Admin Email] Skipping notification for order ${order.orderNumber || orderId}: paymentStatus is "${order.paymentStatus}" (not CAPTURED).`);
      return {
        success: false,
        skipped: true,
        error: `Order payment status is ${order.paymentStatus}. Notifications are only sent for CAPTURED payments.`,
      };
    }

    // 3. Check if notification has already been successfully sent
    if (order.adminEmailStatus === 'SENT') {
      console.log(`[Admin Email] Order ${order.orderNumber || orderId} notification already sent at ${order.adminEmailSentAt}. Skipping duplicate.`);
      return { success: true, skipped: true, emailId: order.adminEmailId || undefined };
    }

    // 4. Atomic conditional lock to prevent concurrent or duplicate execution
    // Stale lock recovery: if a previous attempt stayed in 'SENDING' for > 5 minutes, allow retrying.
    const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);

    const lockResult = await prisma.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: 'CAPTURED',
        OR: [
          { adminEmailStatus: null },
          { adminEmailStatus: 'PENDING' },
          { adminEmailStatus: 'FAILED' },
          { adminEmailStatus: 'SENDING', updatedAt: { lt: staleThreshold } },
        ],
      },
      data: {
        adminEmailStatus: 'SENDING',
      },
    });

    if (lockResult.count === 0) {
      console.log(`[Admin Email] Order ${order.orderNumber || orderId} is already being dispatched by another worker or already completed.`);
      return { success: true, skipped: true };
    }

    // 5. Verify Resend Configuration
    const apiKey = process.env.RESEND_API_KEY;
    const isApiKeyConfigured = Boolean(
      apiKey &&
      apiKey.trim().length > 0 &&
      apiKey !== 're_yourResendApiKeyHere' &&
      !apiKey.startsWith('re_your')
    );

    // Recipient is fixed to raj.mandhyan@gmail.com, configurable via ADMIN_NOTIFICATION_EMAIL
    const recipientEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL).trim();

    // From sender address
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'Hellfire Prints <orders@hellfireprints.com>';
    // If using the default dummy domain in development/test mode, fall back to Resend's onboard sandbox domain
    if (fromEmail.includes('@yourdomain.com')) {
      fromEmail = 'Hellfire Prints <onboarding@resend.dev>';
    }

    if (!isApiKeyConfigured) {
      const warningMsg = 'RESEND_API_KEY is not configured or using default placeholder. Order notification was skipped safely.';
      console.warn(`[Admin Email] ${warningMsg}`);

      // Record in database that email could not be sent due to unconfigured API key
      await prisma.order.update({
        where: { id: orderId },
        data: {
          adminEmailStatus: 'FAILED',
          adminEmailError: 'RESEND_API_KEY is not configured on the server.',
        },
      });

      return { success: false, skipped: true, error: warningMsg };
    }

    // 6. Resolve shipping address (prefer snapshot, fallback to relation)
    let addressData: AddressData = {};
    if (order.shippingAddressSnapshot && typeof order.shippingAddressSnapshot === 'object') {
      addressData = order.shippingAddressSnapshot as AddressData;
    } else if (order.shippingAddress) {
      addressData = {
        name: order.shippingAddress.name,
        phone: order.shippingAddress.phone,
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      };
    }

    const dateTime = formatISTDateTime(order.createdAt);
    const subject = `New Paid Order Received – HellFire Prints | Order #${order.orderNumber || order.id}`;
    const html = generateOrderEmailHtml(order, addressData, dateTime);
    const text = generateOrderEmailText(order, addressData, dateTime);

    // 7. Dispatch email via Resend
    const resend = new Resend(apiKey);
    const sendResponse = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject,
      html,
      text,
    });

    if (sendResponse.error || !sendResponse.data?.id) {
      const errorMessage = sendResponse.error
        ? `${sendResponse.error.name}: ${sendResponse.error.message}`
        : 'Resend API returned no message ID';

      console.error(`[Admin Email] Dispatch failed for order ${order.orderNumber}:`, errorMessage);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          adminEmailStatus: 'FAILED',
          adminEmailError: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }

    // 8. Success: Update database record
    const emailId = sendResponse.data.id;
    console.log(`[Admin Email] Notification sent successfully! Order #${order.orderNumber} -> ${recipientEmail} (ID: ${emailId})`);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        adminEmailStatus: 'SENT',
        adminEmailSentAt: new Date(),
        adminEmailId: emailId,
        adminEmailError: null,
      },
    });

    return { success: true, emailId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Admin Email] Unexpected error while sending notification for order ${orderId}:`, errorMsg);

    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          adminEmailStatus: 'FAILED',
          adminEmailError: errorMsg,
        },
      });
    } catch (dbErr) {
      console.error(`[Admin Email] Could not record FAILED status in DB:`, dbErr);
    }

    return { success: false, error: errorMsg };
  }
}
