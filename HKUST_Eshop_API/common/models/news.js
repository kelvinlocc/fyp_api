// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var newsSchema = new Schema({
    news_id: {
        type: Number,
        required: true,
        unique: true
    },
    description: {
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

newsSchema.virtual('shop',{
    ref:'Shop',
    localField:'shop_id',
    foreignField:'shop_id'
});

var news = mongoose.model('News', newsSchema);

// make this available to our Node applications
module.exports = news;
