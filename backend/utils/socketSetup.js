const socketIo = require('socket.io');

let io;
const userSockets = new Map(); // Map userId to socketId

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // allow all origins for now, configure strictly in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('register', (userId) => {
            if (userId) {
                userSockets.set(userId.toString(), socket.id);
                console.log(`User ${userId} registered with socket ${socket.id}`);
            }
        });

        // Admin might want to join a global room for admin notifications
        socket.on('joinAdminRoom', () => {
            socket.join('adminRoom');
            console.log(`Socket ${socket.id} joined adminRoom`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
            // Remove from map
            for (let [key, value] of userSockets.entries()) {
                if (value === socket.id) {
                    userSockets.delete(key);
                    break;
                }
            }
        });
    });
};

const getIo = () => io;
const getUserSocket = (userId) => userSockets.get(userId.toString());

module.exports = { initSocket, getIo, getUserSocket };
