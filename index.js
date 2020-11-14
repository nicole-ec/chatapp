const express = require('express');
const bodyParser = require("body-parser");
const fs = require('fs');
const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

const emojis = { ":)": "1F601", ":(": "1F641", ":o": "1F632", "^_^": "1F60A" }

let chatHistory = []
let users = []

app.use(express.static('.'))
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.emit('chat history', chatHistory);

    let username = getUsername();
    socket.emit("username", username);
    io.emit("user connected", users);


    socket.on('disconnect', () => {
        console.log('user disconnected: ');
        userIndex = users.indexOf[username];
        users.splice(userIndex, 1);
        io.emit("user disconnected", username);
    });

    socket.on('chat message', (data) => {
        let timestamp = getTimestamp();
        let msg = transformEmoji(data.msg);
        let color = data.color;
        let error = "";
        let isError = false;
        let colorChange = false;

        if (msg.includes("/color")) {
            let cmd = msg.split(" ");
            if (cmd.length === 2) {
                let hex = parseInt(cmd[1], 16);
                isHex = hex.toString(16) === cmd[1].toLowerCase();

                if (cmd[0] === "/color" && isHex) {
                    // change color for whole chat history; update it on client side?
                    color = cmd[1].trim();
                    updateColor(username, color);
                    let colorData = {
                        history: chatHistory,
                        color: color,
                        username: username
                    }
                    socket.emit("user color", color);
                    io.emit("chat history color", colorData)
                    colorChange = true;
                }
                else {
                    error = `${cmd[1]} is not a color. Please enter RRGGBB format (hex)`;
                    isError = true;
                }
            }
            else {
                error = `Error: incorrect use. Enter as /color [RRGGBB]`;
                isError = true;
            }
        }
        else if (msg.includes("/name")) {
            let cmd = msg.split(" ");
            if (cmd.length === 2) {
                newName = cmd[1].trim();
                if (!users.includes(newName) && newName !== "") {
                    currentNameIndex = users.indexOf(username);
                    users[currentNameIndex] = newName;
                    username = newName;
                    socket.emit("username", newName);
                    io.emit("user connected", users);
                }
                else {
                    error = `${newName} already exists!`;
                    isError = true;
                }
            }
            else {
                error = `Error: incorrect use. Enter as /name [new_name]`;
                isError = true;
            }
        }
        else {
            // search for any invalid commands
            let cmd = msg.match(/^\/([\w]*)/);
            // if there was a match, then there was a command but it is not valid
            if (cmd !== null) {
                error = `Bad input: ${cmd[0]} is not a command.`;
                isError = true;
            }
        }


        msg = `${timestamp};${username};${msg};${color}`;

        data = {
            username: username,
            msg: msg,
            color: color,
            error: error,
            colorChange: colorChange
        };

        if (!isError) {
            storeChat(msg);
            io.emit('chat message', data);
        }
        else {
            socket.emit("chat message", data);
        }
        console.log('message: ' + msg);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

function storeChat(msg) {
    if (chatHistory.length > 200) {
        chatHistory.shift();
        chatHistory.push(msg);
    }
    else {
        chatHistory.push(msg);
    }
}

function getUsername() {
    let username = `User${Date.now()}`;
    users.push(username);
    return username;
}

// rewrite the history record to include the user color
// where username == history.username
function updateColor(username, color) {
    for (let index in chatHistory) {
        let item = chatHistory[index];
        if (item.includes(username)) {
            records = item.split(";");
            records[3] = color
            chatHistory[index] = records.join(";");
        }
    }
}

function getTimestamp() {
    let currentDate = new Date();
    let hours = currentDate.getHours() < 10 ? `0${currentDate.getHours()}` : currentDate.getHours();
    let minutes = currentDate.getMinutes() < 10 ? `0${currentDate.getMinutes()}` : currentDate.getMinutes();

    let timestamp = `${hours}:${minutes}`;
    return timestamp;
}

function transformEmoji(msg) {
    for (let emoji in emojis) {
        if (msg.includes(emoji)) {
            // replace string with character code
            // reference: https://stackoverflow.com/questions/44367790/replace-string-with-emoji
            msg = msg.replace(emoji, String.fromCodePoint(Number.parseInt(emojis[emoji], 16)));
        }
    }
    return msg;
}