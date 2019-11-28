import axios from 'axios';

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
        this.username.errors = false; //clears any errors 
        this.usernameImmediately(); //this method will run after every value changing keystroke in reg form field 
        clearTimeout(this.username.timer); //resets setTimeout time
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 3000); //after each keystroke, need to reset this timer. Only if user hasnt typed an additional character after 3000 milliseconds does the method run 
    }

    usernameImmediately() {
        //perform a check on if value is empty string or not alphanumeric 
        if (this.username.value !== '' && !/^([a-zA-Z0-9]+)$/.test(this.username.value) ) { //we could use validator npm package, but this is client-side - this would add more things user would have to download, so lets do the check ourselves 
            this.showValidationError(this.username, 'Username can only contain letters and numbers');
        }

        if (this.username.value.length > 30) {
            this.showValidationError(this.username, 'Username cannot exceed 30 characters');
        }


        if (!this.username.errors) { //if no errors
            this.hideValidationError(this.username); //if no errors, hide the errors
        }
    }

    hideValidationError(el) {
        el.nextElementSibling.classList.remove('liveValidateMessage--visible'); 
    }


    showValidationError(el, message) {
        el.nextElementSibling.innerHTML = message; //nextElementSibling is the red box divs 
        el.nextElementSibling.classList.add('liveValidateMessage--visible'); 
        el.errors = true;
    }

    usernameAfterDelay() {
       if (this.username.value.length < 3) {
           this.showValidationError(this.username, 'Username must be at least 3 characters');
       }

       //only send async request to backend if there are no errors
       if (!this.username.errors) {
           axios.post('/doesUsernameExist', {username: this.username.value}).then((response) => { //response will be a true or false 
            if (response.data) { //true - username exosts
                this.showValidationError(this.username, 'That username is already taken');
                this.username.isUnique = false;
            } else { //username is available
                this.username.isUnique = true;
            }
        }).catch(() => { //if there is some technical difficulty
            console.log('Please try again later')
        })
       }
    }

    insertValidationElements() {
        this.allFields.forEach(function(el) {
            el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>'); //these are red box elements that contain an error message
        })
    }
}