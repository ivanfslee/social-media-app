const Follow = require('../models/Follow');

exports.addFollow = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId); //user they want to follow, the user they are 
    follow.create().then(() => {//create new follow doc in database - x user follows y user
        req.flash('success', `Successfully followed ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errors) => { //errors will be array
        //user trying something weird/sneaky/malicious
        errors.forEach(error => {
            req.flash('errors', error)
        })
        req.session.save(() => res.redirect('/'));
    }); 
}

exports.removeFollow = function(req, res) {
    let follow = new Follow(req.params.username, req.visitorId); //user they want to follow, the user they are 
    follow.delete().then(() => {//create new follow doc in database - x user follows y user
        req.flash('success', `Successfully stopped following ${req.params.username}`)
        req.session.save(() => res.redirect(`/profile/${req.params.username}`))
    }).catch((errors) => { //errors will be array
        //user trying something weird/sneaky/malicious
        errors.forEach(error => {
            req.flash('errors', error)
        })
        req.session.save(() => res.redirect('/'));
    }); 
}