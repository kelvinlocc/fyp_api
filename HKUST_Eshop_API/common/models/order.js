// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var orderSchema = new Schema({
    order_id: {
        type: Number,
        required: true,
        unique: true
    },
    shop_id: {
        type: Number,
        required: true
    },
    user_id: {
        type: Number,
        required: true
    },
    status: {
        type: String,   //pending/confirmed/arrived/finished/trashed
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        virtuals:true
    }
});

orderSchema.virtual('shop',{
    ref: 'Shop',
    localField: 'shop_id',
    foreignField: 'shop_id'
});

orderSchema.virtual('user',{
    ref: 'SysUser',
    localField: 'user_id',
    foreignField: 'user_id'
});

orderSchema.virtual('items',{
    ref:'OrderItem',
    localField: 'order_id',
    foreignField: 'order_id'
});

var order = mongoose.model('Order', orderSchema);

// make this available to our Node applications
module.exports = order;
