const socket = io('ws://localhost:3000');

const messageInput = document.getElementById('message');
const game = document.getElementById('game');
const form = document.getElementById('form');
const messages = document.getElementById('messages');

const SHRINK_TIME = 2000;
const GRACE_TIME = 250;
const GAME_WIDTH = window.innerWidth - 400;
const GAME_HEIGHT = game.offsetHeight;
const MARGIN = 160;

form.name.value = localStorage.getItem('name') || '';
game.style.width = GAME_WIDTH + 'px';
form.style.top = game.offsetHeight + 10 + 'px';
form.style.width = window.innerWidth - 10 + 'px';
form.style.left = window.innerWidth / 2 - form.offsetWidth / 2 + 'px';
messages.style.left = GAME_WIDTH + 10 + 'px';
messages.style.width = window.innerWidth - GAME_WIDTH - 15 + 'px';

let activityTimeout;
let chatsuTimer;
let appearedLetters = [];
let successfulLetters = [];
let originalMessage = '';
let letterObjects = [];
let gameStarted = false;

form.addEventListener('submit', startTimer);
form.name.addEventListener('keyup', () => localStorage.setItem('name', form.name.value));

if (!localStorage.getItem('tutorial-seen')) {
    const wrapper = document.createElement('div');
    wrapper.id = 'tutorial-wrapper';
    const tutorial = document.createElement('div');
    tutorial.id = 'tutorial';
    const h1 = document.createElement('h1');
    h1.textContent = 'How to play';
    const p1 = document.createElement('p');
    p1.textContent = 'Welcome, it looks like, this is your first time playing this game (on this devide).';
    const p2 = document.createElement('p');
    p2.textContent = 'If you ever played OSU! before, the concept might be familiar for you.';
    const p3 = document.createElement('p');
    p3.textContent =
        'This is a chat application that only sends the letters, that you can correctly hit in an OSU!-like game.';
    const p4 = document.createElement('p');
    p4.textContent = 'Enter your name on the bottom left corner, then write your message in the "message" field.';
    const p5 = document.createElement('p');
    p5.textContent = 'Press "enter" or click the "Send" button. The game will now start.';
    const p6 = document.createElement('p');
    p6.textContent = 'When the shrinking circle reaches the border of the letter, hit that letter on your keyboard.';
    const p7 = document.createElement('p');
    p7.textContent = 'Enjoy, and have fun.';
    tutorial.appendChild(h1);
    tutorial.appendChild(p1);
    tutorial.appendChild(p2);
    tutorial.appendChild(p3);
    tutorial.appendChild(p4);
    tutorial.appendChild(p5);
    tutorial.appendChild(p6);
    tutorial.appendChild(p7);
    const button = document.createElement('button');
    button.textContent = 'Play';
    button.addEventListener('click', () => {
        localStorage.setItem('tutorial-seen', 'true');
        document.getElementById('tutorial-wrapper').remove();
    });
    tutorial.appendChild(button);
    wrapper.appendChild(tutorial);

    document.body.appendChild(wrapper);
}

//listen for messages
socket.on('message', (data) => {
    console.log('message', data);
    console.log(data);
    const li = document.createElement('li');
    li.textContent = data;
    messages.appendChild(li);
});

socket.on('typing', (data) => {
    const typing = document.getElementById('typing');
    typing.textContent = data + ' is typing...';
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(() => {
        typing.textContent = '';
    }, 1000);
});

function startTimer(e) {
    e.preventDefault();
    messageInput.disabled = true;
    setTimeout(() => {
        const popup = document.createElement('div');
        popup.id = 'popup';
        document.body.appendChild(popup);
        popup.style.top = window.innerHeight / 2 - popup.offsetHeight / 2 + 'px';
        popup.style.left = window.innerWidth / 2 - popup.offsetWidth / 2 + 'px';
        popup.textContent = '3';
        const beepshort = new Audio('beep_short.wav');
        beepshort.volume = 0.5;
        beepshort.play();
        setTimeout(() => {
            popup.textContent = '2';
            beepshort.play();
            popup.style.backgroundColor = 'coral';
            setTimeout(() => {
                popup.style.backgroundColor = 'gold';
                popup.textContent = '1';
                beepshort.play();
                setTimeout(() => {
                    popup.style.backgroundColor = 'chartreuse';
                    popup.textContent = 'GO!';
                    const beeplong = new Audio('beep_long.wav');
                    beeplong.volume = 0.5;
                    beeplong.play();
                    setTimeout(() => {
                        startGame(e);
                        popup.remove();
                    }, 1000);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
}

function createTimer(letters) {
    if (letters.length > 0) {
        const rand = Math.floor(Math.random() * (500 - 100 + 1) + 100);
        console.log(`Wait for ${rand} ms.`);
        const letter = letters.shift();
        appearedLetters.push({ letter: letter, appeared: Date.now() });
        console.log(letter);

        const p = document.createElement('p');
        p.textContent = letter;
        p.classList.add('letter');
        const topOffset = Math.random() * (window.innerHeight - 20);
        const leftOffset = Math.random() * (window.innerWidth - 20);
        p.style.top = topOffset + 'px';
        p.style.left = leftOffset + 'px';
        game.appendChild(p);
        const pCenterTop = p.offsetTop + p.offsetHeight / 2;
        const pCenterLeft = p.offsetLeft + p.offsetWidth / 2;

        const wrapper = document.createElement('div');
        wrapper.classList.add('circlewrapper');
        game.appendChild(wrapper);
        wrapper.style.top = pCenterTop - wrapper.offsetHeight / 2 + 'px';
        wrapper.style.left = pCenterLeft - wrapper.offsetWidth / 2 + 'px';

        const circle = document.createElement('div');
        circle.textContent = '';
        circle.classList.add('circle');
        wrapper.appendChild(circle);
        setTimeout(() => {
            wrapper.remove();
            p.remove();
        }, SHRINK_TIME);
        setTimeout(() => createTimer(letters), rand);
    } else {
        return;
    }
}

function sendMessage(message) {
    if (messageInput.value) {
        socket.emit('message', { message: messageInput.value, name: form.name.value });
        messageInput.value = '';
    }
    messageInput.focus();
}

messageInput.addEventListener('keypress', (e) => {
    socket.emit('typing', form.name.value);
});

function shuffle(array) {
    for (let i = 0; i < 100; i++) {
        array = array.sort((a, b) => {
            const num = Math.random();
            if (num < 0.5) {
                return -1;
            } else if (num > 0.5) {
                return 1;
            } else {
                return 0;
            }
        });
    }
    return array;
}

window.addEventListener('keydown', (e) => {
    if (!gameStarted || e.altKey || e.shiftKey || e.ctrlKey) return;
    let closestLetterObj = letterObjects[0];
    const now = Date.now();
    letterObjects.forEach((letterObj) => {
        if (
            Math.abs(now - (letterObj.appearTimestamp + SHRINK_TIME)) <
            Math.abs(now - (closestLetterObj.appearTimestamp + SHRINK_TIME))
        ) {
            closestLetterObj = letterObj;
        }
    });
    const letterElement = document.getElementById('letter_' + closestLetterObj.index);
    if (
        closestLetterObj.letter.toLowerCase() !== e.key ||
        Math.abs(now - (closestLetterObj.appearTimestamp + SHRINK_TIME)) > GRACE_TIME ||
        Math.abs(now - (closestLetterObj.appearTimestamp + SHRINK_TIME)) < -GRACE_TIME
    ) {
        if (letterElement) {
            letterElement.style.backgroundColor = 'red';
            letterElement.style.borderColor = 'red';
        }
        closestLetterObj.hit = false;
        const wrongSound = new Audio('wrong.wav');
        wrongSound.volume = 0.5;
        wrongSound.play();
    } else {
        if (letterElement) {
            letterElement.style.backgroundColor = 'green';
            letterElement.style.borderColor = 'green';
        }
        closestLetterObj.hit = true;
        const correctSound = new Audio('correct.wav');
        correctSound.play();
    }
    console.log(closestLetterObj);
    setTimeout(() => document.getElementById('letter_' + closestLetterObj.index)?.remove(), 200);
});

function startGame(e) {
    e.preventDefault();
    gameStarted = true;
    originalMessage = messageInput.value;
    const letters = originalMessage.split('');

    let timeBetweenCombos = Math.floor(Math.random() * 500 + 500); // 500 es 1000 kozotti szamok
    let offsetFromStart = 0;
    let innerIndex = 0;
    // set up letter objects array with positions and timers
    while (offsetFromStart + innerIndex < letters.length) {
        let comboPieces = Math.floor(Math.random() * 4 + 5); // 5 es 9 kozotti szamok
        let comboTime = Math.floor(Math.random() * 200 + 300); // 300 es 500 kozotti szamok
        let comboDistance = regenerateComboDistance();

        for (; innerIndex < comboPieces && offsetFromStart + innerIndex < letters.length; innerIndex++) {
            let currentIndex = offsetFromStart + innerIndex;
            let letterObj = {
                letter: letters[currentIndex],
                index: currentIndex,
            };
            if (currentIndex === 0) {
                // first letter in the game
                letterObj.x = Math.floor(Math.random() * (GAME_WIDTH - MARGIN));
                letterObj.y = Math.floor(Math.random() * (GAME_HEIGHT - MARGIN));
                letterObj.appear = timeBetweenCombos;
            } else if (innerIndex === 0) {
                // first letter in any combo except the first
                letterObj.x = Math.floor(Math.random() * (GAME_WIDTH - MARGIN));
                letterObj.y = Math.floor(Math.random() * (GAME_HEIGHT - MARGIN));
                letterObj.appear = letterObjects[currentIndex - 1].appear + timeBetweenCombos;
            } else if (currentIndex < letters.length) {
                // any letter in a combo except first
                let trialCounter = 0;
                do {
                    if (trialCounter > 0) regenerateComboDistance();
                    generatePosition(currentIndex, comboDistance, letterObj);
                    trialCounter++;
                } while (letterObjects.find((prev) => prev.x === letterObj.x && prev.y === letterObj.y) !== undefined);
                trialCounter = 0;
                letterObj.appear = letterObjects[currentIndex - 1].appear + comboTime;
            }
            letterObjects.push(letterObj);
        }
        innerIndex = 0;
        offsetFromStart += comboPieces;
        comboPieces = Math.floor(Math.random() * 4 + 3);
        comboDistance = regenerateComboDistance();
        comboTime = Math.floor(Math.random() * 200 + 300);
    }

    letterObjects.forEach((letterObj) => {
        setTimeout(() => {
            const p = document.createElement('p');
            p.textContent = letterObj.letter;
            p.classList.add('letter');
            p.style.top = letterObj.y + 'px';
            p.style.left = letterObj.x + 'px';
            p.id = 'letter_' + letterObj.index;
            letterObj.element = p;
            letterObj.appearTimestamp = Date.now();
            game.appendChild(p);
            const pCenterTop = p.offsetTop + p.offsetHeight / 2;
            const pCenterLeft = p.offsetLeft + p.offsetWidth / 2;

            const wrapper = document.createElement('div');
            wrapper.classList.add('circlewrapper');
            game.appendChild(wrapper);
            wrapper.style.top = pCenterTop - wrapper.offsetHeight / 2 + 'px';
            wrapper.style.left = pCenterLeft - wrapper.offsetWidth / 2 + 'px';

            const circle = document.createElement('div');
            circle.textContent = '';
            circle.classList.add('circle');
            wrapper.appendChild(circle);
            setTimeout(() => {
                wrapper.remove();
                p.remove();
            }, SHRINK_TIME);
            setTimeout(() => {
                if (letterObj.hit === undefined || letterObj.hit === null) {
                    const wrongSound = new Audio('wrong.wav');
                    wrongSound.volume = 0.5;
                    wrongSound.play();
                }
            }, SHRINK_TIME + GRACE_TIME);
            if (letterObj.index === letterObjects.length - 1) {
                setTimeout(() => {
                    let messageLetters = [];
                    letterObjects.forEach((letterObj) => {
                        if (letterObj.hit) messageLetters.push(letterObj.letter);
                    });
                    socket.emit('message', { name: form.name.value, message: messageLetters.join('') });
                    messageInput.disabled = false;
                    messageInput.value = '';
                    messageInput.focus();
                    letterObjects = [];
                    gameStarted = false;
                }, 3000);
            }
        }, letterObj.appear);
    });

    function generatePosition(currentIndex, comboDistance, letterObj) {
        if (letterObjects[currentIndex - 1].x - comboDistance <= 0) {
            letterObj.x = letterObjects[currentIndex - 1].x + comboDistance;
        } else if (letterObjects[currentIndex - 1].x + comboDistance >= GAME_WIDTH - MARGIN) {
            letterObj.x = letterObjects[currentIndex - 1].x - comboDistance;
        } else {
            const randomNum = Math.random();
            if (randomNum < 0.33) {
                letterObj.x = letterObjects[currentIndex - 1].x + comboDistance;
            } else if (randomNum < 0.66) {
                letterObj.x = letterObjects[currentIndex - 1].x - comboDistance;
            } else {
                letterObj.x = letterObjects[currentIndex - 1].x;
            }
        }
        if (letterObjects[currentIndex - 1].y - comboDistance <= 0) {
            letterObj.y = letterObjects[currentIndex - 1].y + comboDistance;
        } else if (letterObjects[currentIndex - 1].y + comboDistance >= GAME_HEIGHT - MARGIN) {
            letterObj.y = letterObjects[currentIndex - 1].y - comboDistance;
        } else {
            const randomNum = Math.random();
            if (randomNum < 0.33) {
                letterObj.y = letterObjects[currentIndex - 1].y + comboDistance;
            } else if (randomNum < 0.66) {
                letterObj.y = letterObjects[currentIndex - 1].y - comboDistance;
            } else {
                letterObj.y = letterObjects[currentIndex - 1].y;
            }
        }
    }
}
function regenerateComboDistance() {
    return Math.floor(Math.random() * 60 + 42); // betweem 42 and 102
}
