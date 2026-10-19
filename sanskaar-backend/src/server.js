require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/live.socket');

const PORT = process.env.PORT || 8000;

// Express app ko ek raw http server ke andar wrap kiya — Socket.io isi
// http server pe "attach" hota hai, Express ke upar seedha nahi ho sakta
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' }, // dev ke liye khula; production mein apna frontend URL daalna
});

initSocket(io); // saare live-related socket events yahan register honge

const startServer = async () => {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});