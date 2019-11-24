const dotenv = require('dotenv');
dotenv.config();
const mongodb = require('mongodb');

//another way to import in databaseURI
//const connectionString = require('./config/keys').mongoURI;

mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client) {
    module.exports = client; //client.db() exports the actual database object - we can work with the db by just requiring it in
    const app = require('./app');
    app.listen(process.env.PORT);
});