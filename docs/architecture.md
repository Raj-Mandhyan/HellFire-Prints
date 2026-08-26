# System Architecture & Technical Design

This document details the system design, core checkout pipelines, database workflows, and external integrations for **HellFire Prints**.

---

## 1. System Overview

HellFire Prints is built using a modern decoupled architecture. Next.js serves both as the frontend user interface and the server-side backend API. Data persistence is managed via Prisma ORM connecting to a PostgreSQL server.

```mermaid
graph TD
    User([Customer Browser])
    NextFront[Next.js Client Components]
    NextServer[Next.js Server Actions / API Routes]
    Prisma[Prisma ORM]
    Postgres[(PostgreSQL / Neon)]
    
    %% Third-party integrations
    Auth[Auth.js / NextAuth]
    Cloudinary[Cloudinary CDN]
    Razorpay[Razorpay Gateway]
    Shiprocket[Shiprocket Logistics]
    Resend[Resend Mailer]
    
    User <--> NextFront
    NextFront <--> NextServer
    NextServer <--> Prisma
    Prisma <--> Postgres
    
    NextServer <--> Auth
    NextServer <--> Cloudinary
    NextServer <--> Razorpay
    NextServer <--> Shiprocket
    NextServer <--> Resend
```

---

## 2. Authentication & Authorization (RBAC)

Authentication is handled via NextAuth (Auth.js) using secure JWT tokens. Role-Based Access Control (RBAC) is enforced at the database level and server boundaries.

```
Guest User (No Account) ➔ Browse Catalog, Add to Cart (Session cookie)
        ↓
Registered Customer ➔ Access Profile, Add Saved Addresses, Checkout, View Past Orders
        ↓
Admin User ➔ Access `/admin` paths, CRUD Products, Edit Inventory, Modify Shipment States
```

### Security Rules:
1. **Server-Side Verification**: Route handlers and Server Actions check the role stored in the verified session token. Client-side route blocking is used purely for user experience.
2. **API Isolation**: All administrative API endpoints `/api/admin/*` are protected behind a middleware check:
   ```typescript
   const session = await getServerSession(authOptions);
   if (!session || session.user.role !== 'ADMIN') {
     return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 });
   }
   ```

---

## 3. Core Checkout & Payment Pipeline

Recalculating prices and validating stock values server-side prevents fraud and overselling. Below is the transactional flow for a customer order:

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Front as Client App (React)
    participant Back as Server (Next.js)
    participant DB as PostgreSQL (Neon)
    participant Gateway as Razorpay API
    
    Customer->>Front: Click Checkout
    Front->>Back: Submit Cart & Shipping Address
    Note over Back: Recalculate cart prices from Database.<br/>Verify item stock counts.
    Back->>DB: Check Inventory & Validate Coupon
    
    alt Out of Stock or Invalid Data
        Back-->>Front: Return Validation Error
        Front-->>Customer: Alert User
    else Valid Cart
        Back->>DB: Create Order (Status: PENDING, Payment: CREATED)
        Back->>Gateway: Create Razorpay Order (Amount)
        Gateway-->>Back: Return Razorpay Order ID
        Back->>DB: Save Razorpay Order ID to Order Record
        Back-->>Front: Return Order Details & Razorpay Order ID
        Front->>Customer: Render Razorpay Checkout Overlay
        Customer->>Gateway: Input Card/UPI & Authorize Payment
        Gateway-->>Front: Return payment_id, signature, order_id
        Front->>Back: Submit Verification Payload
        
        Note over Back: Verify signature server-side:<br/>crypto.Hmac('sha256', secret)
        
        alt Signature Verified
            Back->>DB: Update Order (Status: CONFIRMED, Payment: CAPTURED)
            Back->>DB: Decrement Inventory Quantities (Atomically)
            Back->>Back: Dispatch Fulfillment Hook (Shiprocket)
            Back->>Back: Trigger Confirmation Email (Resend)
            Back-->>Front: Redirect to Success Page (/order/success?id=...)
            Front-->>Customer: Render Success Page (Receipt & Invoicing)
        else Verification Failed
            Back->>DB: Update Payment Status (FAILED)
            Back-->>Front: Return Payment Error
            Front-->>Customer: Alert User (Retry Payment)
        end
    end
```

---

## 4. Custom Poster Upload & Processing

Customers can upload custom graphics to the **Custom Poster Studio**. Image files are directly uploaded to Cloudinary:

```
Customer Uploads Image ➔ Client Crops/Rotates ➔ Server Uploads to Cloudinary
                                                         ↓
Store Cloudinary URL and Public ID in database ➔ Create custom cart item
```
Custom poster database entries are linked directly to `CartItem` or `OrderItem` tables. When an order is placed, the custom poster is marked as purchased, preventing its deletion from Cloudinary during cleanup scripts.

---

## 5. Fulfillment & Logistics (Shiprocket)

Once an order has been paid, the system triggers the shipping flow:
1. **Order Sync**: The backend transmits customer address, weight, dimensions (calculated from selected poster sizes), and invoice details to Shiprocket's API.
2. **Fulfillment Details**: Shiprocket responds with a `shipment_id` and a courier assignment.
3. **AWB Code Generation**: The system requests the Airway Bill (AWB) code and stores it in the `Shipping` model.
4. **Tracking Updates**: A cron job/webhook tracks courier status changes (e.g. `Picked Up`, `In Transit`, `Delivered`) and stores them in `ShipmentTracking` records.

---

## 6. Email Notification Workflow (Resend)

The email notification pipeline runs asynchronously using **Resend**:

- **Order Confirmed**: Triggered immediately upon payment capture.
- **Shipment Shipped**: Triggered when a tracking number (AWB) is assigned by Shiprocket.
- **Out for Delivery / Delivered**: Triggered by shipment tracking status changes.
- **Payment Failed / Refunded**: Triggers custom alerts for customer support.
