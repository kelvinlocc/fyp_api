// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var userFavouriteSchema = new Schema({
    favour_id: {
        type: Number,
        required: true,
        unique: true
    },
    user_id: {
        type: Number,
        required: true
    },
    product_id: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        virtuals:true
    }
});

userFavouriteSchema.virtual('user',{
    ref:'SysUser',
    localField:'user_id',
    foreignField:'user_id'
});
userFavouriteSchema.virtual('product',{
    ref:'Product',
    localField:'product_id',
    foreignField:'product_id'
});

var orderItem = mongoose.model('UserFavourite', userFavouriteSchema);

// make this available to our Node applications
module.exports = orderItem;
