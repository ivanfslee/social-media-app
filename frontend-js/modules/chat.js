export default class Chat {
    constructor() {
        this.openedYet = false;
        this.chatWrapper = document.querySelector('#chat-wrapper');
        this.openIcon = document.querySelector('.header-chat-icon');

        this.injectHTML();
        this.closeIcon = document.querySelector('.chat-title-bar-close'); //this line needs to be before this.injectHTML() 
        this.events();
    }

    // Events
    events() {
        this.openIcon.addEventListener('click', () => this.showChat()); //'this' points to object, we don't want to change that, so we use an arrow func which doesn't rebind 'this'
        this.closeIcon.addEventListener('click', () => this.hideChat());
    }

    // Methods

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
        alert('opening a connection');
    }


    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }

}