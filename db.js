const mongodb = require('mongodb');
const connectionString = require('./config/keys').mongoURI;

mongodb.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    module.exports = client.db(); //export actual database object - we can work with the db by just requiring it in
    const app = require('./app');
    app.listen(3000);
});