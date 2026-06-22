const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/menu", require("./routes/menuRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/reservation", require("./routes/reservationRoutes"));
app.use("/api/pricing", require("./routes/pricingRoutes"));
app.use("/api/enquiries", require("./routes/enquiryRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/plans", require("./routes/planRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/rm", require("./routes/rmRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));

app.get("/", (req, res) => {
    res.send("logistics scanner API Running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
