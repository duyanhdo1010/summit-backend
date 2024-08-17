// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/bookingModel');

exports.createBooking = async (req, res) => {
  try {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    const newBooking = await Booking.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        booking: newBooking,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userBookings = await Booking.find({ user: { $eq: req.user.id } });
    res.status(201).json({
      status: 'success',
      data: {
        total: userBookings.length,
        booking: userBookings,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).json({
      status: 'success',
      results: bookings.length,
      data: {
        bookings,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = Booking.findById(bookingId);
    if (!booking) {
      throw new Error('No booking found with that ID');
    }
    res.status(200).json({
      status: 'success',
      data: {
        booking,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { paid } = req.body;
    const bookingId = req.params.bookingId;
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { paid },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedBooking) {
      throw new Error('No booking found with that ID');
    }
    res.status(200).json({
      status: 'success',
      data: {
        booking: updatedBooking,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);
    if (!deletedBooking) {
      throw new Error('No booking found with that ID');
    }
    res.status(204).json({
      status: 'delete successfully',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'failed',
      message: err.message,
    });
  }
};
