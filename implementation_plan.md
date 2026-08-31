# Implementation Plan - Forcing Delivery Charges to ₹0

We will temporarily set the delivery/shipping charge of the store to ₹0. This affects the pricing calculations (both client-side and server-side) and updating customer-facing text labels to consistently display `Delivery Charges: ₹0`.

## User Review Required
No high-risk changes. This is a temporary pricing override that preserves the existing code structure so it can easily be reverted.

## Open Questions
None.

## Proposed Changes

### Pricing Calculation Core

#### [MODIFY] [discounts.ts](file:///D:/CODING/1.%20Projects%20%28Portfolio%29/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20%28Hellfire%20Mega%20Project%29/Try_4/11.%20Project-4%20%28Hellfire%29%20Backup-5/Try_3/lib/discounts.ts)
- Comment out the dynamic shipping fee calculation `subtotal >= 1999 ? 0 : 150;` and temporarily hardcode `const shippingFee = 0;` as a numeric value.
- This ensures all backend calculations, cart total engines, and server-side order structures use exactly ₹0 for shipping.

---

### User Interface / Front-End Displays

#### [MODIFY] [page.tsx](file:///D:/CODING/1.%20Projects%20%28Portfolio%29/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20%28Hellfire%20Mega%20Project%29/Try_4/11.%20Project-4%20%28Hellfire%29%20Backup-5/Try_3/app/cart/page.tsx)
- Change the display label from "Delivery" to "Delivery Charges".
- Format the value display to show `₹0` instead of `Free Delivery` when the charge is 0 to perfectly match the requested UI layout.

#### [MODIFY] [CheckoutPageClient.tsx](file:///D:/CODING/1.%20Projects%20%28Portfolio%29/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20%28Hellfire%20Mega%20Project%29/Try_4/11.%20Project-4%20%28Hellfire%29%20Backup-5/Try_3/components/CheckoutPageClient.tsx)
- Change the display label from "Delivery" to "Delivery Charges".
- Format the value display to show `₹0` instead of `Free Delivery` when the charge is 0.

#### [MODIFY] [page.tsx](file:///D:/CODING/1.%20Projects%20%28Portfolio%29/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20%28Hellfire%20Mega%20Project%29/Try_4/11.%20Project-4%20%28Hellfire%29%20Backup-5/Try_3/app/account/orders/%5BorderId%5D/page.tsx)
- Change the display label from "Shipping (India)" to "Delivery Charges".

#### [MODIFY] [page.tsx](file:///D:/CODING/1.%20Projects%20%28Portfolio%29/2.%20Hackathons/11.%20Demo%20Hackathon%20Project-4%20%28Hellfire%20Mega%20Project%29/Try_4/11.%20Project-4%20%28Hellfire%29%20Backup-5/Try_3/app/admin/orders/%5Bid%5D/page.tsx)
- Change the display label from "Shipping & handling" to "Delivery Charges".

## Verification Plan

### Automated Tests
- Run `npm run build` locally to verify that all code compiles without syntax or type errors.

### Manual Verification
- Verify the cart drawer, cart page, and checkout screen to confirm the delivery charges display as `Delivery Charges: ₹0` and the grand total is exactly the subtotal (minus any discounts).
