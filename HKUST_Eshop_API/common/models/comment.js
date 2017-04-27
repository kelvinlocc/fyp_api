// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var commentSchema = new Schema({
    comment_id:{
        type: Number,
        required: true,
        unique: true
    },
    product_id: {
        type: Number,
        required:true
    },
    user_id: {
        type: Number,
        required:true
    },
    description: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        virtuals:true
    }
});

commentSchema.virtual('product',{
    ref: 'Product',
    localField:'product_id',
    foreignField:'product_id'
});
commentSchema.virtual('user',{
    ref:'SysUser',
    localField:'user_id',
    foreignField:'user_id'
});


var comment = mongoose.model('Comment', commentSchema);

// make this available to our Node applications
module.exports = comment;
