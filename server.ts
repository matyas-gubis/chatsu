import express, { Request, Response } from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import cors from 'cors'
import { UserRepository } from './UserRepository';
import { User } from './User';
import cookieParser from 'cookie-parser'
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors())
app.use(express.static('public'));
app.use(cookieParser())
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});
const userRepository = new UserRepository([new User('admin', 'admin')])

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log(socket.id + " connected")
    socket.on('signup/signin', ({ username, password }, response) => {
        console.log(username, password)
        if (!username) {
            return response({ error: 'Missing username' })
        }

        if (!password) {
            return response({ error: 'Missing password' })
        }

        const foundUser = userRepository.findUserByUsername(username)

        if (!foundUser) {
            const sessionID = uuidv4()
            userRepository.addUser(new User(username, password))
            userRepository.findUserByUsername(username).sessionID = sessionID;

            return response({ sessionID })
        }

        if (foundUser.password !== password) {
            return response({ error: 'Incorrect password' })
        }

        const sessionID = uuidv4()
        userRepository.findUserByUsername(username).sessionID = sessionID
        response({ sessionID })
    })
});

io.on('disconnect', (socket) => {
    console.log(socket.id + " disconnected")
})

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
