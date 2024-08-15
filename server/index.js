import express from 'express';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.port || 3000;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const expressServer = app.listen(PORT, () => console.log(`listening on http://localhost:${PORT} 🚀`));

const io = new Server(expressServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500'],
    },
});

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);
    socket.broadcast.emit('message', `${socket.id} connected`);
    socket.on('message', (data) => {
        console.log(data);
        io.emit('message', `${data.name}: ${data.message}`);
    });
    socket.on('typing', (name) => {
        socket.broadcast.emit('typing', name);
    });
    socket.on('disconnect', () => {
        socket.broadcast.emit('message', `${socket.id} disconnected`);
    });
});
