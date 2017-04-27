// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var productSchema = new Schema({
    product_id:{
        type: Number,
        required: true,
        unique: true
    },
    shop_id:{
        type: Number,
        required: true
    },
    product_name: {
        type: String,
        required: true,
        unique: true
    },
    image_path: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    on_sale:{
        type: Number,
        required: true
    },
    description:{
        type: String,
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals:true
        }
    }
);

productSchema.virtual('shop',{
    ref: 'Shop',
    localField: 'shop_id',
    foreignField: 'shop_id'
});

var product = mongoose.model('Product', productSchema);

// make this available to our Node applications
module.exports = product;
