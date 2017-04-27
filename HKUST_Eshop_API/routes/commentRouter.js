var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var comments = require(path.join(__dirname+'/../common/models/comment'));
var products = require(path.join(__dirname+'/../common/models/product'));
var users = require(path.join(__dirname+'/../common/models/sysUser'));

router.use(bodyParser.json());

router.get('/',function(req,res,next){      //get all comments
    comments.find().populate('product').populate('user').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

//login is needed for all shop functions

router.get('/findCommentById',function(req,res,next){         //find the Comment by comment_id
    if(req.query!=null){
        //console.log(req.query);

        var comment_id = parseInt(req.query.comment_id);
        comments.find({comment_id:comment_id}).populate('product').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,comment:result[0]});
            }
        });
    }
});

router.get('/findCommentByProduct',function(req,res,next){         //find the Comment by comment_id
    if(req.query!=null){
        //console.log(req.query);

        var product_id = parseInt(req.query.product_id);
        comments.find({product_id:product_id}).populate('product').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,comment:result});
            }
        });
    }
});

router.get('/findCommentByUser',function(req,res,next){         //find the Comment by comment_id
    if(req.query!=null){
        //console.log(req.query);

        var user_id = parseInt(req.query.user_id);
        comments.find({user_id:user_id}).populate('product').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,comment:result});
            }
        });
    }
});

router.get('/newComment',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newComment.html'));
});


router.post('/newComment',function(req,res,next){

    var data = req.body;
    if( data.product_id == "" || !data.product_id ||
        data.description == "" || !data.description ||
        data.rating == "" || !data.rating ||
        data.user_id == "" || !data.user_id){
        return res.json({success:false, message:"please fill in all data."});
    }

    else{
        var comment_id=0;
        var product_id = parseInt(req.body.product_id);
        var user_id = parseInt(req.body.user_id);
        var rating = parseInt(req.body.rating);

        comments.find().sort({comment_id:-1}).limit(1).exec(function(err,comment){
            if(err){return res.json({status:500,error:err});}

            else{
                if(comment.length){
                    comment_id = comment[0].comment_id+1;
                }

                var relatedShop = products.findOne({product_id:product_id},function(err,product){              //check if product is valid
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else if(!product){
                        return res.json({success:false,message:"Shop not exist"});
                    }

                    else{
                        var relatedUser = users.findOne({user_id:user_id},function(err,user){              //check if product is valid
                            if(err){
                                return res.json({status:500,error:err});
                            }

                            else if(!user){
                               return res.json({success:false,message:"User not exist"});
                            }

                            else{
                                var newComment = new comments({
                                    comment_id:comment_id,
                                    product_id:product_id,
                                    user_id:user_id,
                                    description:req.body.description,
                                    rating: rating
                                });

                                newComment.save(function(err){
                                    if(err){
                                        return res.json({status:500,error:err});
                                    }
                                    else{
                                        return res.json({success:true,comment:newComment});
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.get('/updateComment',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateComment.html'));
});


router.post('/updateComment',function(req,res,next){           //update Comment
    var data = req.body;
    if( data.comment_id == "" || !data.comment_id ||
        data.product_id == "" || !data.product_id ||
        data.description == "" || !data.description ||
        data.rating == "" || !data.rating ||
        data.user_id == "" || !data.user_id){
        return res.json({success:false, message:"please fill in all data."});
    }

    else{
        var comment_id = parseInt(req.body.comment_id);
        comments.find({comment_id:comment_id},function(err,result){    //if product does not exist
            if(err){
                return res.json({status:500,error:err});
            }

            else if(!result.length){
                return res.end("Comment not exist");
            }

            var update = result[0];

            update.description = req.body.description;
            update.rating = parseInt(req.body.rating);

            var product_id = parseInt(req.body.product_id);
            products.find({product_id:product_id},function(err,product){
                if(err){
                    return res.json({status:500,error:err});
                }
                else if(!product.length){
                    return res.json({success:false, message:"product not exist"});
                }
                else{
                    update.product_id = product_id;

                    var user_id = parseInt(req.body.user_id);
                    users.find({user_id:user_id},function(err,user){
                        if(err){
                            return res.json({status:500,error:err});
                        }
                        else if(!user.length){
                            return res.json({success:false, message:"User not exist"});
                        }
                        else{
                            update.user_id = user_id;

                            update.save(function(err){    //save the updated Comment
                                if(err){
                                    return res.json({status:500,error:err});
                                }
                                else{
                                    return res.json({success:true,comment:update});
                                }
                            });
                        }
                    });
                }
            });
        });
    }
});

router.get('/deleteComment',function(req,res,next){
    if(req.query!=null){
        var comment_id = parseInt(req.query.comment_id);
        comments.remove({comment_id:comment_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                var msg = "Comment with comment_id: "+req.query.comment_id+" is deleted";
                return res.json({success:true, message:msg});
            }
        });
    }
});

module.exports = router;
