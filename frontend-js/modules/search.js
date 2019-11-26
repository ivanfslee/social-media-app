//browser based class
export default class Search { 
    // 1. select DOM elements and track userful data
    constructor() {
        this.injectHTML();
        this.headerSearchIcon = document.querySelector('.header-search-icon');
        this.overlay = document.querySelector('.search-overlay');
        this.closeIcon = document.querySelector('.close-live-search');
        this.events();
    }

    // 2. Events 
    events() {
        this.closeIcon.addEventListener('click', (e) => this.closeOverlay()); //arrow func so that 'this' is not rebound
        this.headerSearchIcon.addEventListener('click', (e) => { //arrow func so that 'this' is not rebound
            e.preventDefault();
            //open search overlay
            //overlay is an 
            this.openOverlay();
        })
    }

    // 3. Methods
    openOverlay() {
        this.overlay.classList.add('search-overlay--visible'); //when this method runs, it adds a class called 'search-overlay--visible' which is a div class that makes the overlay
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
            <div class="live-search-results live-search-results--visible">
              <div class="list-group shadow-sm">
                <div class="list-group-item active"><strong>Search Results</strong> (4 items found)</div>
    
                <a href="#" class="list-group-item list-group-item-action">
                  <img class="avatar-tiny" src="https://gravatar.com/avatar/b9216295c1e3931655bae6574ac0e4c2?s=128"> <strong>Example Post #1</strong>
                  <span class="text-muted small">by barksalot on 0/14/2019</span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                  <img class="avatar-tiny" src="https://gravatar.com/avatar/b9408a09298632b5151200f3449434ef?s=128"> <strong>Example Post #2</strong>
                  <span class="text-muted small">by brad on 0/12/2019</span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                  <img class="avatar-tiny" src="https://gravatar.com/avatar/b9216295c1e3931655bae6574ac0e4c2?s=128"> <strong>Example Post #3</strong>
                  <span class="text-muted small">by barksalot on 0/14/2019</span>
                </a>
                <a href="#" class="list-group-item list-group-item-action">
                  <img class="avatar-tiny" src="https://gravatar.com/avatar/b9408a09298632b5151200f3449434ef?s=128"> <strong>Example Post #4</strong>
                  <span class="text-muted small">by brad on 0/12/2019</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>`)
    }
}  