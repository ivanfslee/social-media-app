

export default class Chat {
    constructor() {
        this.openedYet = false;
        this.chatWrapper = document.querySelector('#chat-wrapper');
        this.openIcon = document.querySelector('.header-chat-icon');

        this.injectHTML();
        this.chatLog = document.querySelector('#chat'); //chat window
        this.chatField = document.querySelector('#chatField'); //select chat textfield and form it lives within 
        this.chatForm = document.querySelector('#chatForm'); //select chat form the chat field lives within 
        this.closeIcon = document.querySelector('.chat-title-bar-close'); //this line needs to be before this.injectHTML() 
        this.events();
    }

    // Events
    events() {
        this.openIcon.addEventListener('click', () => this.showChat()); //'this' points to object, we don't want to change that, so we use an arrow func which doesn't rebind 'this'
        this.closeIcon.addEventListener('click', () => this.hideChat());
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault(); //when chat form submitted, do not do a hard reload of the webpage, which is default behavior
            this.sendMessageToServer();
        })
    }

    // Methods
    sendMessageToServer() {
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value})  //this.socket is our socket connection. emit method in socket.io will emit an event with a bit of data to the server. 
        //first arg is title of event, second arg is an obj with any data we want to send to the server 
        this.chatField.value = ''; //after we emit the chatField value, we clear the field and focus our cursor back on it 
        this.chatField.focus(); //focus cursor back on the chatfield 
    }

    hideChat() {
        this.chatWrapper.classList.remove('chat--visible');
    }

    showChat() {
        if (!this.openedYet) {
            this.openConnection();
        }
        this.openedYet = true; //once chat is shown once. this.openConnection will run and establish connection to server for chat function. 
        //even if user hides the chat, the connection will still stay on 
        this.chatWrapper.classList.add('chat--visible');
    }

    openConnection() {
        this.socket = io(); //function available in browser scope for socketio functionality 
        //io() function will open a conenction between our browser and our server
        //basically, this.socket is our socket connection between our browser and our server 

        this.socket.on('chatMessageFromServer', (data) => { //when browser receives an event called 'chatMessageFromServer' from the server, it will run function. 
            this.displayMessageFromServer(data);
        });
    }

    displayMessageFromServer(data) {
        //select chat window
        this.chatLog.insertAdjacentHTML('beforeend', `
        <div class="chat-other">
        <a href="#"><img class="avatar-tiny" src="${data.avatar}"></a>
        <div class="chat-message"><div class="chat-message-inner">
          <a href="#"><strong>${data.username}:</strong></a>
          ${data.message}
        </div></div>
        </div>
        `);
    }

    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }

}