const Reservation = require("../models/Reservation");

exports.createReservation = async (req, res) => {
  const reservation = await Reservation.create(req.body);
  res.status(201).json(reservation);
};

exports.getReservations = async (req, res) => {
  const reservations = await Reservation.find();
  res.json(reservations);
};
