// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var orderItemSchema = new Schema({
    item_id: {
        type: Number,
        required: true,
        unique: true
    },
    order_id: {
        type: Number,
        required: true
    },
    product_id: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        virtuals:true
    }
});

orderItemSchema.virtual('order',{
    ref:'Order',
    localField:'order_id',
    foreignField:'order_id'
});
orderItemSchema.virtual('product',{
    ref:'Product',
    localField:'product_id',
    foreignField:'product_id'
});

var orderItem = mongoose.model('OrderItem', orderItemSchema);

// make this available to our Node applications
module.exports = orderItem;
