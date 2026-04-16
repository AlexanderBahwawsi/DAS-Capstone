const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

// setup
function setupSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    // JWT handshake authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication required'));
        try {
        socket.user = jwt.verify(token, JWT_SECRET);
        next();
        } catch {
        next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        // log the connected client
        const userId = socket.user && socket.user.id;
        console.log(`Socket connected: ${socket.id} (user ${userId})`);

        // client joins a room named by submissionId
        socket.on('join_thread', (submissionId) => {
            if (!submissionId) return;
            socket.join(String(submissionId));
            console.log(`Client ${socket.id} joined thread ${submissionId}`);
        });

        // client leaves the room
        socket.on('leave_thread', (submissionId) => {
            if (!submissionId) return;
            socket.leave(String(submissionId));
            console.log(`Client ${socket.id} left thread ${submissionId}`);
        });

        // log handler errors
        socket.on('error', (err) => {
            console.error(`Socket ${socket.id} error:`, err);
        });

        // clean up
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

module.exports = { setupSocket };
