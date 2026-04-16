const { Server } = require('socket.io');

// setup
function setupSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        // log the connected client
        console.log(`Client connected: ${socket.id}`);

        // client joins a room named by submissionId
        socket.on('join_thread', (submissionId) => {
            socket.join(submissionId);
            console.log(`Client ${socket.id} joined thread ${submissionId}`);
        });

        // client leaves the room
        socket.on('leave_thread', (submissionId) => {
            socket.leave(submissionId);
            console.log(`Client ${socket.id} left thread ${submissionId}`);
        });

        // clean up
        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
}

module.exports = setupSocket;