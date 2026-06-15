# Salon_pro

This repository contains a full-stack barbershop management platform for salons, barbers, customers, and owners.

## Features

- Booking and queue management
- Barber and staff management
- Inventory and service management
- Payments and notifications
- Admin dashboard and owner insights

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local PostgreSQL container:
   ```bash
   docker compose up -d postgres
   ```
3. Run Prisma migrations:
   ```bash
   npm run db:migrate
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

Open http://localhost:3000 in your browser.
