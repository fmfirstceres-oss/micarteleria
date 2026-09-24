const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
app.use(express.json());

// Configure Multer for file uploads
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueSuffix + ext);
    }
});

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.ogg'];
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no permitido'));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// API: Upload file
app.post('/api/upload', upload.single('mediaFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl: fileUrl });
});

// Websockets
let currentGlobalState = {};
let currentScreenStates = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('registerScreen', (screenId) => {
        console.log(`Socket ${socket.id} joined screen room: ${screenId}`);
        socket.join(screenId);

        // Push latest state to new connection
        if (currentScreenStates[screenId]) {
            socket.emit('updateContent', currentScreenStates[screenId]);
        } else if (currentGlobalState['all']) {
            socket.emit('updateContent', currentGlobalState['all']);
        }
    });

    socket.on('updateContent', (data) => {
        console.log('Update Content:', data);

        if (data.targetScreen && data.targetScreen.trim() !== "" && data.targetScreen !== "all") {
            currentScreenStates[data.targetScreen] = data;
            io.to(data.targetScreen).emit('updateContent', data);
        } else {
            currentGlobalState['all'] = data;
            io.emit('updateContent', data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
