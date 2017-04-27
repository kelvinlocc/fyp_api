// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var posterSchema = new Schema({
    poster_id: {
        type: Number,
        required: true,
        unique: true
    },
    image_path: {
        type: String,
        required: true,
    },
    shop_id:  {
        type: Number,
        required: true
    },
    publish_date: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        virtuals:true
    }
});

posterSchema.virtual('shop',{
    ref:'Shop',
    localField:'shop_id',
    foreignField:'shop_id'
});

var poster = mongoose.model('Poster', posterSchema);

// make this available to our Node applications
module.exports = poster;
