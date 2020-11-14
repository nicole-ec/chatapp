let currentUsername = "";
let userColor = "";

function init() {
    let socket = io();

    socket.on('chat history', function (history) {
        console.log(history);
        for (let item of history) {
            records = item.split(";");
            let msg = `${records[0]} <span class="${records[1]}">${records[1]}</span>: ${records[2]}`;

            $("#messages").append(`<li>${msg}</li>`);

            let elements = $("#messages li").find(`span.${records[1]}`);
            let newItem = elements[elements.length - 1];
            $(newItem).css({ "color": `#${records[3]}` });

        }
    });

    socket.on('user color', function (color) {
        userColor = color;
    });

    socket.on("chat history color", function (data) {
        currentHistory = $("#messages li").find("span");

        for (let item of currentHistory) {
            if ($(item).text().includes(data.username)) {
                $(item).css({ "color": `#${data.color}` });
            }
        }
    });

    // sets the username for the current user
    socket.on("username", function (username) {
        $("#messages").append(`<li value=${username}>Your username: <span class="username">${username}</span></li>`);
        currentUsername = username;
    });

    //removes the disconnected user from the online users list
    socket.on("user disconnected", function (username) {
        users = $(".users-content li");
        for (let user in users) {
            let text = users[user].innerHTML
            if (text === username) {
                users[user].parentNode.removeChild(users[user]);
            }
        }
    });

    // when a user connects, re-render the online users list
    // by emptying the current list then reprint the users list
    socket.on('user connected', function (users) {
        $(".users-content").empty();
        for (let user in users) {
            if (users[user] === currentUsername) {
                $(".users-content").append(`<li><b>${users[user]} (you)</b></li>`);
            }
            else {
                $(".users-content").append(`<li>${users[user]}</li>`);
            }
        }
    });

    $('form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        let msg = $('#m').val().trim();

        if (msg !== "" && msg !== "undefined") {
            sendMessage(socket, msg);
            $("#m").attr("placeholder", "");
        }
        else {
            $('#m').val('');
            $("#m").attr("placeholder", "Enter a message to continue");
        }
    });

    socket.on('chat message', function (data) {

        if (data.error !== "") {
            $('#messages').append(`<li value=${data.username}><b>${data.error}</b></li>`);
            return;
        }

        records = data.msg.split(";");
        let msg = `${records[0]} <span class="${records[1]}">${records[1]}</span>: ${records[2]}`;

        if (data.username === currentUsername) {
            $('#messages').append(`<li value=${data.username}><b>${msg}</b></li>`);
        }
        else {
            $('#messages').append(`<li value=${data.username}>${msg}</li>`);
        }

        // this section sets the color for the latest message sent by the user
        let msgList = $("#messages li").find("span");
        let lastMsg = msgList[msgList.length - 1];
        $(lastMsg).css({ "color": `#${data.color}` });

        // the code below will determine whether there should be a scroll bar for the chat
        let listId = "messages";
        let textAreaId = "chat";

        let area = document.getElementById(textAreaId);
        let list = document.getElementById(listId);

        // compare whether the height of the list is greater than the height of the chat area
        // references: https://stackoverflow.com/questions/270612/scroll-to-bottom-of-div
        // references: https://stackoverflow.com/questions/9333379/check-if-an-elements-content-is-overflowing/9541579 
        if (list.scrollHeight > area.clientHeight){
            $(`#${listId}`).addClass("h-100");
            area.scrollTop = list.scrollHeight;
        }
        else {
            $(`#${listId}`).removeClass("h-100");
        }
    });
}

function sendMessage(socket, msg) {
    data = {
        color: userColor,
        msg: msg
    }
    socket.emit('chat message', data);
    $('#m').val('');
    return false;
}

$(document).ready(init());