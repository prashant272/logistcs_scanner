# Logistics Scanner

Logistics Scanner is a modern, premium logistics platform that connects customers with top-tier freight forwarders and shipping vendors. The application provides instant pricing comparisons, route search, plan pricing, booking management, and shipment tracking capabilities.

## Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: TailwindCSS & Vanilla CSS
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js with Express
- **Database**: MongoDB (Atlas) with Mongoose
- **Payment Gateway**: Razorpay
- **Storage**: Cloudflare R2

## Project Structure

```text
├── backend/          # Express API server, models, and controllers
├── frontend/         # React SPA source code
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v18 or v20)
- MongoDB account (or local MongoDB community server)

### Running Locally

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Configure your .env file
   npm start
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   # Configure your .env file
   npm run dev
   ```
