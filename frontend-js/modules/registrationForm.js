export default class RegistrationForm {
    constructor() {
        this.allFields = document.querySelectorAll('#registration-form .form-control'); //returns array of multiple elements - should return username/email/password fields 
        this.insertValidationElements();
        this.username = document.querySelector('#username-register'); //select username field 
        this.username.previousValue = '';
        this.events();
    }

    //events
    events() {
        this.username.addEventListener('keyup', () => {
            this.isDifferent(this.username, this.usernameHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })
    }

    //methods
    isDifferent(el, handler) {
        if (el.previousValue !== el.value) { //if value changes, then run the handler function 
            handler.call(this); //use call on 'this' to make sure 'this' keyword is what we set it to (which is our obj)
        }
        el.previousValue = el.value;
    }

        usernameHandler() {
            alert('username handler ran')
        }

    insertValidationElements() {
        this.allFields.forEach(function(el) {
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>'); //these are red box elements that contain an error message
        })
    }
}