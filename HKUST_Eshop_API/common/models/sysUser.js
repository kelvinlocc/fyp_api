// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var sysUserSchema = new Schema({
    user_id: {
        type: Number,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    shop_id: {
        type: Number
    },
    user_role: {
        type: String,   //super_admin/shop_admin/staff/customer
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        virtuals:true
    }
});

sysUserSchema.virtual('orders',{
    ref:'Order',
    localField:'user_id',
    foreignField:'user_id'
});

sysUserSchema.virtual('shop',{
    ref:'Shop',
    localField:'shop_id',
    foreignField:'shop_id'
});

var sysUser = mongoose.model('SysUser', sysUserSchema);

// make this available to our Node applications
module.exports = sysUser;
