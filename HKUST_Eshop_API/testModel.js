var mongoose = require('mongoose'),
    assert = require('assert');

var shop = require('./common/models/shop');

// Connection URL
var url = 'mongodb://localhost:27017/EShop';
mongoose.connect(url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("Connected correctly to server");

        // get all the users
        shop.find({}, function (err, shop) {
            if (err) throw err;

            // object of all the users
            console.log(shop);
        });
});
