const express = require("express");
const router = express.Router();
const { createReservation, getReservations } = require("../controllers/reservationController");
const protect = require("../middleware/authMiddleware");

router.post("/", createReservation);
router.get("/", protect, getReservations);

module.exports = router;
