const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  date: String,
  time: String,
  guests: Number
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);
