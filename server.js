const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Listen for connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Listen for events from the admin panel
    socket.on('updateContent', (data) => {
        console.log('Received update:', data);
        // Broadcast the update to all connected clients
        io.emit('updateContent', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
