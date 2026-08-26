# HellFire Prints - Production-Ready Full-Stack E-Commerce Platform

HellFire Prints is a premium, high-performance, dark-themed e-commerce platform for selling premium posters in India (Anime, Cars, Formula 1, Gaming, Minimal, etc.), built with a modern, cloud-first full-stack architecture.

---

## 1. Project Overview
HellFire Prints provides a cinematic, immersive customer poster-buying experience. It includes a custom poster builder studio, cart drawers, address management, automated invoice generation, live payment processing via Razorpay, real shipping integration via Shiprocket, transactional email updates via Resend, and an admin cockpit tracking business analytics, products, and order status.

## 2. Tech Stack
- **Framework & Application:** Next.js (App Router), React, TypeScript
- **Styling & Animation:** Tailwind CSS, Framer Motion
- **ORM & Database:** Prisma, PostgreSQL (Neon Serverless in cloud, Docker Postgres locally)
- **Session & Auth:** Auth.js (NextAuth.js) with password hashing (bcryptjs) & RBAC
- **Cloud Assets Storage:** Cloudinary
- **Payment Processing:** Razorpay
- **Shipping Logistics:** Shiprocket
- **Transactional Mailer:** Resend
- **Infrastructure:** Docker, Vercel

## 3. Folder Structure
```
hellfire-prints/
├── app/                  # Next.js App Router (pages & server actions)
│   ├── admin/            # Administrative cockpit
│   ├── api/              # API Route Handlers (webhooks, oauth, endpoints)
│   ├── cart/             # Shopping cart pages
│   ├── checkout/         # Multi-step checkout flows
│   ├── custom-studio/    # Custom poster upload, crop, & custom cart addition
│   ├── dashboard/        # Customer panel (order lists, addresses, wishlist)
│   ├── product/          # Poster product detail pages
│   └── shop/             # Filterable product grid
├── components/           # Reusable UI component library (glassmorphism buttons, cards, drawers)
├── docs/                 # Architectural deep-dives
│   └── architecture.md   # System flow diagrams
├── hooks/                # Custom React hooks (cart context, auth helper)
├── lib/                  # Shared server utilities & SDK wrappers (Prisma, Razorpay, Cloudinary)
├── prisma/               # Prisma migrations & schema file
│   ├── schema.prisma     # Relational database models
│   └── seed.ts           # Development database seeder
├── public/               # Static assets & brand graphics
├── scripts/              # Infrastructure and build helpers
├── types/                # Shared TypeScript models
└── utils/                # General formatting & mathematics helpers
```

## 4. Prerequisites
Ensure you have the following installed locally:
- **Node.js** (v18.x or v20.x+)
- **npm** (v9.x or v10.x+)
- **Docker & Docker Compose** (for running local PostgreSQL instances)

---

## 5. Local Setup & Configuration
Follow these steps to set up the project locally:

### Step 1: Clone the Repository & Install Dependencies
```bash
git clone <repository-url> hellfire-prints
cd hellfire-prints
npm install
```

### Step 2: Set Up the Local Database
1. Launch the dockerized PostgreSQL container:
   ```bash
   docker-compose up -d
   ```
2. Create a local `.env` file by copying the template:
   ```bash
   cp .env.example .env
   ```
3. Update the `DATABASE_URL` and `DIRECT_URL` in `.env` to point to your local PostgreSQL container:
   ```env
   DATABASE_URL="postgresql://postgres:local_dev_password_123@localhost:5432/hellfire_db?schema=public"
   DIRECT_URL="postgresql://postgres:local_dev_password_123@localhost:5432/hellfire_db?schema=public"
   ```

### Step 3: Run Database Migrations & Seeds
1. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```
2. Apply the schema migrations to your local database:
   ```bash
   npm run db:migrate
   ```
3. Populate your database with categories, posters, user roles, and sample coupons:
   ```bash
   npm run db:seed
   ```

### Step 4: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 6. Database Schema Design (Prisma)
The database utilizes Prisma ORM connected to a PostgreSQL database. Key models include:
- **User & Account:** NextAuth session-compatible tables. Roles are restricted via a `UserRole` enum (`ADMIN` or `CUSTOMER`).
- **Product, Category & Variant:** Catalog entities. Sizes and Frame items represent relational pricing additions.
- **Cart & Wishlist:** Authenticated users' state is stored in Postgres; guest users use cookies/session values.
- **Order, OrderItem & Payment:** Tracks checkout. Prices are cached inside `OrderItem` snapshots rather than read from mutable products.
- **Shipping & Tracking:** Links shipments to Shiprocket references and updates.

---

## 7. Configuration of External Services

### Auth.js / NextAuth
Generate a secret for cookie signing and session handling:
```bash
# Run in terminal to generate a key
openssl rand -base64 32
```
Update `.env` with the generated secret:
```env
AUTH_SECRET="your_generated_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Neon PostgreSQL (Cloud)
1. Sign up on [Neon.tech](https://neon.tech) and create a database.
2. Under Connection Details, copy the **Pooled connection string** (ends in `.neon.tech/...`) and use it as `DATABASE_URL` in production.
3. Copy the **Unpooled connection string** and use it as `DIRECT_URL` for running migrations in production.

### Razorpay Payments
1. Sign up on [Razorpay Dashboard](https://dashboard.razorpay.com) and switch to **Test Mode**.
2. Go to Settings -> API Keys and generate your keys.
3. Add keys to `.env`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
   RAZORPAY_KEY_SECRET="your_secret..."
   ```

### Cloudinary Asset Uploads
1. Register on [Cloudinary](https://cloudinary.com).
2. Go to the dashboard and retrieve the Cloud Name, API Key, and API Secret.
3. Configure them in `.env`:
   ```env
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your_cloud_name"
   CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

### Shiprocket Logistics
1. Sign up on [Shiprocket](https://www.shiprocket.in).
2. Go to API -> Credentials and set up an API user.
3. Place credentials in `.env`:
   ```env
   SHIPROCKET_EMAIL="your_shiprocket_email"
   SHIPROCKET_PASSWORD="your_shiprocket_password"
   ```

### Resend Transactional Email
1. Sign up on [Resend.com](https://resend.com).
2. Create an API Key and verify your domain.
3. Configure them in `.env`:
   ```env
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="Hellfire Prints <orders@yourdomain.com>"
   ```

---

## 8. Production Deployment to Vercel
Deploying to Vercel requires connecting the Git repository and mapping all environment variables:

1. Create a project on Vercel and import your Git repository.
2. In the project settings, add the environment variables specified in `.env.example`.
3. Set the Vercel Build Command to:
   ```bash
   npx prisma generate && next build
   ```
4. Set the Vercel Install Command to `npm install` or let it auto-detect.
5. In production, run migrations using the Vercel deployment pipeline or manually run:
   ```bash
   DATABASE_URL="your_neon_pooled_url" DIRECT_URL="your_neon_unpooled_url" npx prisma migrate deploy
   ```

---

## 9. Security & Validation
- **Secure Pricing:** Cart totals, item prices, and coupon codes are recalculated and validated entirely server-side. Frontend prices are never trusted.
- **RBAC API:** Admin endpoints (e.g. products, categories, orders) verify active session details and role values (`ADMIN`) before processing requests.
- **Data sanitization:** Zod schemas validate JSON payloads on API Route Handlers.
- **Password Safety:** Hashed passwords using `bcryptjs` with a cost factor of 10.

---

## 10. Troubleshooting & Handoff
- **Local DB Connectivity:** If docker-compose fails to launch Postgres, make sure port 5432 is not occupied by another SQL process.
- **Type Checking:** Verify code compilation using `npx tsc --noEmit`.
- **Client Handoff:** Provide the client with credentials for Neon, Cloudinary, Razorpay, Shiprocket, and Resend, and transfer ownership of the Vercel project dashboard.
