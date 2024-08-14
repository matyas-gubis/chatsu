import { io } from 'https://cdn.socket.io/4.7.5/socket.io.esm.min.js';
const socket = io('http://localhost:3000');

const loginPanel = document.getElementById('login-panel');
const chatPanel = document.getElementById('chat-panel');
const messageForm = document.getElementById('message-form');

let user = localStorage.getItem('username');
if (!user) {
    loginPanel.classList.remove('hidden');
    chatPanel.classList.add('hidden');
} else {
    loginPanel.classList.add('hidden');
    chatPanel.classList.remove('hidden');
}

loginPanel.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    // handle empty
    if (username === '') {
        //show error
        alert('Username must not be empty.');
        return;
    }

    if (password === '') {
        //show error
        alert('Password must not be empty.');
        return;
    }

    socket.emit('signup/signin', { username, password }, (err, res) => {
        console.log(res, err);
    });
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log(e.target.message.value);
});

function toggleCollapse(id) {
    const section = document.getElementById(id);
    section.classList.toggle('hidden');
}

document
    .getElementById('online-toggle')
    .addEventListener('click', () => toggleCollapse('online-people'));
document
    .getElementById('friends-toggle')
    .addEventListener('click', () => toggleCollapse('friends'));

addEventListener('beforeunload', (event) => {
    socket.off('connect_error');
});
