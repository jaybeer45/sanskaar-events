const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { notFound, errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const vendorRoutes = require('./routes/vendor.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const adminRoutes = require('./routes/admin.routes');
const bookingRoutes = require('./routes/booking.routes');
const uploadRoutes = require('./routes/upload.routes');
const path = require('path');
const organizerRoutes = require('./routes/organizer.routes');
const venueRoutes = require('./routes/venue.routes')
const requestRoutes = require('./routes/request.routes') 
const quotesRoutes =  require('./routes/quote.routes');
const vendorPaymentRoutes = require('./routes/vendorPayment.routes');

const app = express();

// ── Global middleware ──────────────────────────────
app.use(cors());                          
app.use(express.json());                  
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));                 
}

// ── Health check ────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Sanskaar API is running' });
});

// ── Routes mount ─────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/marketplace', marketplaceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/organizers', organizerRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/venues', venueRoutes );
app.use('/api/v1/requests',  requestRoutes );
app.use('/api/v1/quotes', quotesRoutes );
app.use('/api/v1/vendor-bookings', vendorPaymentRoutes );

// Public static serving — ONLY the events folder, never kyc/ (that stays private)
app.use('/uploads/events', express.static(path.join(__dirname, '..', 'uploads', 'events')));

app.use(notFound);
app.use(errorHandler);

module.exports = app;