import axios from 'axios';
import DOMpurify from 'dompurify';

//browser based class
export default class Search { 
    // 1. select DOM elements and track userful data
    constructor() {
        this.injectHTML();
        this.headerSearchIcon = document.querySelector('.header-search-icon');
        this.overlay = document.querySelector('.search-overlay');
        this.closeIcon = document.querySelector('.close-live-search');
        this.inputField = document.querySelector('#live-search-field'); //has id of live-search-field 
        this.resultsArea = document.querySelector('.live-search-results');
        this.loaderIcon = document.querySelector('.circle-loader'); //included in html, we just need to show it or hide it during the appropriate time
        this.typingWaitTimer;
        this.previousValue = '';
        this.events();
    }

    // 2. Events 
    events() {
        this.inputField.addEventListener('keyup', (e) => this.keyPressHandler());
        this.closeIcon.addEventListener('click', (e) => this.closeOverlay()); //arrow func so that 'this' is not rebound
        this.headerSearchIcon.addEventListener('click', (e) => { //arrow func so that 'this' is not rebound
            e.preventDefault();
            //open search overlay
            //overlay is an 
            this.openOverlay();
        })
    }

    // 3. Methods
    keyPressHandler() {
        let value = this.inputField.value; //inputField.value is the current string in the search field
        if (value === '') { //if someone deletes there search input, we start the setTimeout to zero again with clearTimeout
            clearTimeout(this.typingWaitTimer);
            this.hideLoaderIcon();
            this.hideResultsArea();
        }

        if (value !== '' && value !== this.previousValue) { //if search field is not empty string and previousvalue is not empty string, then show loader icon
            clearTimeout(this.typingWaitTimer); //clear the setTimeout timer if wait time between key strokes is less than setTimeout time 
            this.showLoaderIcon();
            this.hideResultsArea();
            this.typingWaitTimer = setTimeout(() => this.sendRequest() , 750);
        }
        this.previousValue = value;
    }


    sendRequest() {
        axios.post('/search', {searchTerm: this.inputField.value}).then(response => { //response will be json data - we defined in postController
            console.log(response.data); //response.data is a json of posts we get from the backend/mongodb
            this.renderResultsHTML(response.data);
        }).catch(() => {
            alert('request failed');
        });
    }

    renderResultsHTML(posts) { //posts is an array of the posts
        if (posts.length) {
            //DOMpurify will remove any code that might initiate a cross site scripting attack
            this.resultsArea.innerHTML = DOMpurify.sanitize(`<div class="list-group shadow-sm">
            <div class="list-group-item active"><strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : '1 item found'})</div>

            ${posts.map(post => {
                let postDate = new Date(post.createdDate);
                return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
                <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
                <span class="text-muted small">by ${post.author.username} on ${postDate.getMonth()}/${postDate.getDate()}/${postDate.getFullYear()}</span>
              </a>`
            }).join('')}
          </div>`);
        } else {
            this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search.</p>`;

        }
        this.hideLoaderIcon();
        this.showResultsArea();
    }

    showLoaderIcon() {
        this.loaderIcon.classList.add('circle-loader--visible');
    }

    hideLoaderIcon() {
        this.loaderIcon.classList.remove('circle-loader--visible');
    }

    showResultsArea() {
        this.resultsArea.classList.add('live-search-results--visible');
    }

    hideResultsArea() {
        this.resultsArea.classList.remove('live-search-results--visible');
    }

    openOverlay() {
        this.overlay.classList.add('search-overlay--visible'); //when this method runs, it adds a class called 'search-overlay--visible' which is a div class that makes the overlay
        setTimeout(() => this.inputField.focus(), 50) //wait 50 milliseconds before focusing cursor because some browsers may not recognize the revealed div 
    }

    closeOverlay() {
        this.overlay.classList.remove('search-overlay--visible'); //when this method runs, it removes class called 'search-overlay--visible' which is a div class that makes the overlay
    }

    injectHTML() {
        document.body.insertAdjacentHTML('beforeend', 
        `<div class="search-overlay"> <!-- search for this div class (search-overlay) -->
        <div class="search-overlay-top shadow-sm">
          <div class="container container--narrow">
            <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
            <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
            <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
          </div>
        </div>
    
        <div class="search-overlay-bottom">
          <div class="container container--narrow py-3">
            <div class="circle-loader"></div>
            <div class="live-search-results"></div>
          </div>
        </div>
      </div>`)
    }
}  