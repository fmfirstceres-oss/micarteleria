const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const db = require('./database');

const app = express();
const server = http.createServer(app);

// Allow CORS from Vite dev server
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());
// Serve static media files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
    }
});

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.mp4', '.webm', '.ogg'];
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Format not allowed'));
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Ensure upload directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// API: Upload Media
app.post('/api/upload', upload.single('mediaFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const type = ['.mp4', '.webm', '.ogg'].includes(ext) ? 'video' : 'image';

    db.run(
        `INSERT INTO media (type, url, originalName) VALUES (?, ?, ?)`,
        [type, fileUrl, req.file.originalname],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, type, url: fileUrl, originalName: req.file.originalname });
        }
    );
});

// API: Get all Media
app.get('/api/media', (req, res) => {
    db.all(`SELECT * FROM media ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Create a Playlist
app.post('/api/playlists', (req, res) => {
    const { name, items } = req.body;
    if (!name || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    const itemsJson = JSON.stringify(items);

    db.run(
        `INSERT INTO playlists (name, items_json) VALUES (?, ?)`,
        [name, itemsJson],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, name, items });
        }
    );
});

// API: Get all Playlists
app.get('/api/playlists', (req, res) => {
    db.all(`SELECT * FROM playlists ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const playlists = rows.map(r => ({ ...r, items: JSON.parse(r.items_json) }));
        res.json(playlists);
    });
});

// API: Get all Screens
app.get('/api/screens', (req, res) => {
    db.all(`SELECT * FROM screens`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// API: Assign Playlist to Screen (to be extended with socket logic)
app.post('/api/screens/:id/assign', (req, res) => {
    const screenId = req.params.id;
    const { playlistId } = req.body;

    // Check if playlist exists
    db.get(`SELECT * FROM playlists WHERE id = ?`, [playlistId], (err, playlistRow) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!playlistRow) return res.status(404).json({ error: 'Playlist not found' });

        db.run(
            `UPDATE screens SET current_playlist_id = ? WHERE id = ?`,
            [playlistId, screenId],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });

                // Emit socket event
                const playlistData = {
                    ...playlistRow,
                    items: JSON.parse(playlistRow.items_json)
                };
                io.to(screenId).emit('playlistUpdated', playlistData);

                res.json({ success: true, screenId, playlistId });
            }
        );
    });
});

// WebSockets logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('registerScreen', (screenId) => {
        console.log(`Socket ${socket.id} joined screen room: ${screenId}`);
        socket.join(screenId);

        // Ensure the screen is tracked in the DB. If not, create it.
        db.get(`SELECT * FROM screens WHERE id = ?`, [screenId], (err, row) => {
            if (!err && !row) {
                db.run(`INSERT INTO screens (id, name) VALUES (?, ?)`, [screenId, `Screen ${screenId}`]);
            } else if (row && row.current_playlist_id) {
                // If the screen already has a playlist assigned, send it right away
                db.get(`SELECT * FROM playlists WHERE id = ?`, [row.current_playlist_id], (err, playlistRow) => {
                    if (playlistRow) {
                        const playlistData = {
                            ...playlistRow,
                            items: JSON.parse(playlistRow.items_json)
                        };
                        socket.emit('playlistUpdated', playlistData);
                    }
                });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
