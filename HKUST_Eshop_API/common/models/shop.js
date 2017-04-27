// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var shopSchema = new Schema({
    shop_id: {
        type: Number,
        required: true,
        unique: true
    },
    shop_name: {
        type: String,
        required: true,
        unique: true
    },
    opening_hours: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    image_path:{
        type: String
    },
    address:{
        type:String,
        required: true
    }
}, {
    timestamps: true
});

shopSchema.virtual('user',{
    ref:'SysUser',
    localField:'shop_id',
    foreignField:'shop_id'
});
var shop = mongoose.model('Shop', shopSchema);

// make this available to our Node applications
module.exports = shop;
