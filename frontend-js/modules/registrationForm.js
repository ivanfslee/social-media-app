import axios from 'axios';

export default class RegistrationForm {
    constructor() {
        this.form = document.querySelector('#registration-form');
        this.allFields = document.querySelectorAll('#registration-form .form-control'); //returns array of multiple elements - should return username/email/password fields 
        this.insertValidationElements();
        this.username = document.querySelector('#username-register'); //select username field 
        this.username.previousValue = '';
        this.email = document.querySelector('#email-register');
        this.email.previousValue = ''
        this.password = document.querySelector('#password-register');
        this.password.previousValue = '';
        this.username.isUnique = false; //set initial value to false - they will only be true if axios request resolves to true
        this.email.isUnique = false; //set initial value to false - they will only be true if axios request resolves to true
        this.events();
    }

    //events
    events() {
        this.form.addEventListener('submit', e => {
            e.preventDefault(); 
            this.formSubmitHandler();
        })

        this.username.addEventListener('keyup', () => {
            this.isDifferent(this.username, this.usernameHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })
        this.email.addEventListener('keyup', () => {
            this.isDifferent(this.email, this.emailHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })
        this.password.addEventListener('keyup', () => {
            this.isDifferent(this.password, this.passwordHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })

        this.username.addEventListener('blur', () => {
            this.isDifferent(this.username, this.usernameHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })
        this.email.addEventListener('blur', () => {
            this.isDifferent(this.email, this.emailHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })
        this.password.addEventListener('blur', () => {
            this.isDifferent(this.password, this.passwordHandler); //isDifferent method checks if value inside of username/email/password field changes - this eliminates non-value changing keystrokes like uparrow, capslock , etc 
        })
    }

    //methods
    formSubmitHandler() { //if submit on registration form is clicked run this method which will run all validation methods 
        //run all validation checks
        this.usernameImmediately();
        this.usernameAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();

        if (
                this.username.isUnique && 
                !this.username.errors && 
                this.email.isUnique &&
                !this.email.errors &&
                !this.password.errors
            ) { //check that all validation methods pass 
            this.form.submit(); //submit the form
        }
    }

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
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800); //after each keystroke, need to reset this timer. Only if user hasnt typed an additional character after 800 milliseconds does the method run 
    }

    passwordHandler() {
        this.password.errors = false; //clears any errors 
        this.passwordImmediately(); //this method will run after every value changing keystroke in reg form field 
        clearTimeout(this.password.timer); //resets setTimeout time
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800); //after each keystroke, need to reset this timer. Only if user hasnt typed an additional character after 800 milliseconds does the method run 
    }

    passwordImmediately() {
        if (this.password.value.length > 50) {
            this.showValidationError(this.password, 'Password cannot exceed 50 characters')
        }

        if (!this.password.errors) {
            this.hideValidationError(this.password);
        }
    }

    passwordAfterDelay() {
        if (this.password.value.length < 12) {
            this.showValidationError(this.password, 'Password must be at least 12 characters');
        }
    }


    emailHandler() {
        this.email.errors = false; //clears any errors 
        //this.emailImmediately(); no method needed to check email immediately  whereas username needs one 
        clearTimeout(this.email.timer); //resets setTimeout time
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 800); //after each keystroke, need to reset this timer. Only if user hasnt typed an additional character after 3000 milliseconds does the method run 
    }

    emailAfterDelay() {
        if (!/^\S+@\S+$/.test(this.email.value)) { //if not valid email
            this.showValidationError(this.email, 'Please provide a valid email address');
        }

        if (!this.email.errors) { //if no errors send ajax request to backend server
            axios.post('/doesEmailExist', {email: this.email.value}).then((response) => {
                if (response.data) { //response.data is true or false
                    this.email.isUnique = false;
                    this.showValidationError(this.email, 'That email is already being used');
                } else {
                    this.email.isUnique = true;
                    this.hideValidationError(this.email);
                }
            }).catch(() => {
                console.log('Please try again later');
            })
        }
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