const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json());

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        // Create unique filenames with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido'));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Global array to store scheduled content
let schedules = [];

// Global immediate state
let currentImmediateState = {};

// Keep track of the last emitted schedule per screen to avoid redundant emits
let lastEmittedSchedules = {};

// Allowed media extensions
const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.webm', '.ogg'];

// Upload Endpoint
app.post('/api/upload', upload.single('mediaFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    // Return the public URL of the uploaded file
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl: fileUrl });
});

// Listen for connections
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Register a screen to a specific room
    socket.on('registerScreen', (screenId) => {
        console.log(`Socket ${socket.id} joined screen room: ${screenId}`);
        socket.join(screenId);

        // Always send active scheduled content if it exists
        let activeSchedule = null;
        const now = new Date();
        schedules.forEach(schedule => {
            const start = new Date(schedule.startTime);
            const end = new Date(schedule.endTime);
            if (now >= start && now <= end) {
                if (schedule.targetScreen === screenId || (!schedule.targetScreen || schedule.targetScreen === 'all')) {
                    activeSchedule = schedule;
                }
            }
        });

        if (activeSchedule) {
            socket.emit('updateContent', activeSchedule);
        } else if (currentImmediateState[screenId]) {
            socket.emit('updateContent', currentImmediateState[screenId]);
        } else if (currentImmediateState['all']) {
            socket.emit('updateContent', currentImmediateState['all']);
        }
    });

    // Listen for immediate updates from the admin panel
    socket.on('updateContent', (data) => {
        console.log('Received immediate update:', data);

        // If a specific screen is targeted, emit only to that room.
        // Otherwise, broadcast to all.
        if (data.targetScreen && data.targetScreen.trim() !== "" && data.targetScreen !== "all") {
            currentImmediateState[data.targetScreen] = data; // Persist state
            io.to(data.targetScreen).emit('updateContent', data);
        } else {
            currentImmediateState['all'] = data; // Persist global state
            // targetScreen == "all" is now handled properly with io.emit
            io.emit('updateContent', data);
        }
    });

    // Listen for scheduled content additions
    socket.on('scheduleContent', (data) => {
        console.log('Received new schedule:', data);
        // Add an ID to the schedule for easier tracking
        data.id = Date.now().toString();
        schedules.push(data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Periodic Check for Scheduled Content
setInterval(() => {
    const now = new Date();

    // Group active schedules by screenId
    const activeByScreen = {};

    schedules.forEach(schedule => {
        const start = new Date(schedule.startTime);
        const end = new Date(schedule.endTime);

        if (now >= start && now <= end) {
            const screen = schedule.targetScreen || 'all';

            // In case of multiple active schedules for a screen,
            // we take the latest added one for simplicity, or we could handle queueing.
            activeByScreen[screen] = schedule;
        }
    });

    // Emit active content ONLY if it changed for the given screenId
    for (const screenId in activeByScreen) {
        const content = activeByScreen[screenId];

        // Check if we already emitted this specific schedule ID to this screen
        if (!lastEmittedSchedules[screenId] || lastEmittedSchedules[screenId].id !== content.id) {

            // We add a flag to distinguish scheduled updates from immediate updates, if necessary.
            content.isScheduled = true;
            lastEmittedSchedules[screenId] = content;

            if (screenId === 'all') {
                io.emit('updateContent', content);
            } else {
                io.to(screenId).emit('updateContent', content);
            }
        }
    }

    // Cleanup lastEmittedSchedules if no schedule is active anymore for that screen
    for (const screenId in lastEmittedSchedules) {
        if (!activeByScreen[screenId]) {
            delete lastEmittedSchedules[screenId];
        }
    }

}, 1000); // Check every second

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
