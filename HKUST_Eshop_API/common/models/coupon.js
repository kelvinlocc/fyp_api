// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var couponSchema = new Schema({
    coupon_id:{
        type: Number,
        required: true,
        unique: true
    },
    issue_shop_id: {
        type: Number,
        required:true
    },
    consumed_shop_id: {
        type: Number,
    },
    user_id: {
        type: Number,
    },
    description: {
        type: String,
        required: true
    },
    discount_amount: {
        type: Number,
        required: true
    },
    status: {       //created/assigned/used/trashed
        type: String,
        required: true
    },
    issue_date: {
        type: String,
        required: true
    },
    expire_date: {
        type: String,
        required: true
    },
    used_date: {
        type: String,
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals:true
    }
});

couponSchema.virtual('issue_shop',{
    ref:'Shop',
    localField:'issue_shop_id',
    foreignField:'shop_id'
});
couponSchema.virtual('consumed_shop',{
    ref:'Shop',
    localField:'consumed_shop_id',
    foreignField:'shop_id'
});
couponSchema.virtual('user',{
    ref:'SysUser',
    localField:'user_id',
    foreignField:'user_id'
});


var coupon = mongoose.model('Coupon', couponSchema);

// make this available to our Node applications
module.exports = coupon;
