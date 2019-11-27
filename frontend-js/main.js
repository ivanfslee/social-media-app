import Search from './modules/search';
//not using 'require' syntax because babel is transpiling newer 'import' syntax 
//node is still using older syntax 'require'

import Chat from './modules/chat';

if (document.querySelector('#chat-wrapper')) { //only if html element with id chat-wrapper exists 
    new Chat();
}

if (document.querySelector('.header-search-icon')) { 
    //only if element header-search-icon exists on the page, create new Search() instance - 
    //this is for users who are not logged in. A new Search() instance will not be run. If you are logged in new Search() will be made 
    new Search();
}