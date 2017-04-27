var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var coupons = require(path.join(__dirname+'/../common/models/coupon'));
var shops = require(path.join(__dirname+'/../common/models/shop'));
var users = require(path.join(__dirname+'/../common/models/sysUser'));

router.use(bodyParser.json());

//login is needed for all shop functions
/*
router.use(function(req,res,next){
    var token = req.body.token || req.query.token || req.app.get('token');

    if(token){
        jwt.verify(token, req.app.get('superSecret'),function(err,decoded){
            if(err){
                return res.json({success: false, message:'Failed to authenticate token.'});
            } else{
                req.decoded = decoded;
                next();
            }
        });
    }   else {
        return res.status(403).send({success: false, message: 'unauthorized access'});
    }
});
*/

router.get('/',function(req,res,next){      //get all shops
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }
*/

    coupons.find().populate('issue_shop').populate('consumed_shop').populate('user').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findCouponById',function(req,res,next){         //find the Coupon by coupon_id

    if(req.query!=null){
        //console.log(req.query);

        var coupon_id = parseInt(req.query.coupon_id);
        coupons.find({coupon_id:coupon_id}).populate('issue_shop').populate('consumed_shop').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,coupon:result[0]});
        });
    }
});

router.get('/findCouponByIssueShop',function(req,res,next){         //find the Coupon by coupon_id
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }
*/

    if(req.query!=null){
        //console.log(req.query);

        var shop_id = parseInt(req.query.shop_id);
        coupons.find({issue_shop_id:shop_id}).populate('issue_shop').populate('consumed_shop').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,coupon:result});
        });
    }
});

router.get('/findCouponByConsumedShop',function(req,res,next){         //find the Coupon by coupon_id
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff' 
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }
*/

    if(req.query!=null){
        //console.log(req.query);

        var shop_id = parseInt(req.query.shop_id);
        coupons.find({consumed_shop_id:shop_id}).populate('issue_shop').populate('consumed_shop').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,coupon:result});
        });
    }
});

router.get('/findCouponByUser',function(req,res,next){         //find the Coupon by coupon_id
    if(req.query!=null){
        //console.log(req.query);

        var user_id = parseInt(req.query.user_id);
        coupons.find({user_id:user_id}).populate('issue_shop').populate('consumed_shop').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
               return res.json({success:true,coupon:result});
        });
    }
});

router.get('/newCoupon',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newCoupon.html'));
});


router.post('/newCoupon',function(req,res,next){
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }

    else{
*/
        var data = req.body;
        if(
            data.issue_shop_id == "undefined" || !data.issue_shop_id ||
            data.description == "undefined" ||  !data.description ||
            data.status == "undefined" || !data.status ||
            data.issue_date == "undefined" || !data.issue_date ||
            data.expire_date == "undefined" || !data.expire_date ||
            data.discount_amount == "undefined" || !data.discount_amount){
            return res.json({success:false,message:"please fill in all data. "});
        }

        else{
            var issue_shop_id = parseInt(req.body.issue_shop_id);
            var discount_amount = parseInt(req.body.discount_amount);

            coupons.find().sort({coupon_id:-1}).limit(1).exec(function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }

            else{
                var coupon_id = 0;
                if(doc.length){
                    coupon_id = doc[0].coupon_id+1;
                }

                var existing = coupons.find({coupon_id:coupon_id},function(err,result){     //check if Coupon exists
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else if(result.length){
                        return res.json({success:false,message:"Coupon already exist"});
                    }

                    else{

                        var relatedShop = shops.findOne({shop_id:issue_shop_id},function(err,shop){              //check if shop is valid
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else if(!shop){
                                return res.json({success:false,message:"Shop not exist"});
                            }

                            else{
                                var newCoupon = new coupons({
                                    coupon_id:coupon_id,
                                    issue_shop_id:issue_shop_id,
                                    description:req.body.description,
                                    status:req.body.status,
                                    discount_amount:discount_amount,
                                    issue_date:req.body.issue_date,
                                    expire_date:req.body.expire_date
                                });

                                newCoupon.save(function(err){
                                    if(err){
                                        return res.json({status:500,error:err});
                                    }
                                    else{
                                        return res.json({success:true,coupon:newCoupon});
                                    }
                                });
                            }
                        });
                    }
                });
            }
            });
        }
//    }
});

router.get('/updateCoupon',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateCoupon.html'));
});


router.post('/updateCoupon',function(req,res,next){           //update Coupon
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }

    else{
*/
        var data = req.body;
        if(
            data.coupon_id == "undefined" || !data.coupon_id ||
            data.issue_shop_id == "undefined" || !data.issue_shop_id ||
            data.description == "undefined" || !data.description ||
            data.status == "undefined" || !data.status ||
            data.issue_date == "undefined" ||   !data.issue_date ||
            data.expire_date == "undefined" ||  !data.expire_date ||
            data.discount_amount == "undefined" || !data.discount_amount){
            return res.json({success:false,message:"please fill in all data. "});
        }

        else{
            var coupon_id = parseInt(req.body.coupon_id);
            coupons.find({coupon_id:coupon_id},function(err,result){    //if shop does not exist
                if(err){
                    return res.json({status:500,error:err});
                }

                else if(!result.length){
                    return res.json({success:false,message:"Coupon not exist"});
                }

                else{
                    var update = result[0];

                    update.description = req.body.description;
                    update.status = req.body.status;
                    update.discount_amount = parseInt(req.body.discount_amount);
                    update.issue_date = req.body.issue_date;
                    update.expire_date = req.body.expire_date;
                    if(req.body.used_date != "undefined"){
                        update.used_date = req.body.used_date;
                    }

                    if(req.body.issue_shop_id!="undefined"){
                        var issue_shop_id = parseInt(req.body.issue_shop_id);

                        shops.find({shop_id:issue_shop_id},function(err,shop){
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else if(!shop.length){
                                return res.json({success:false,message:"consumed shop not exist"});
                            }
                            else{
                                update.issue_shop_id = issue_shop_id;

                                if(req.body.user_id!="undefined"){
                                    var user_id = parseInt(req.body.user_id);
                                    users.find({user_id:user_id},function(err,user){
                                        if(err){
                                            return res.json({status:500,error:err});
                                        }
                                        else if(!user.length){
                                            return res.json({success:false,message:"User not exist"});
                                        }
                                        else{
                                            update.user_id = user_id;

                                            update.save(function(err){    //save the updated Coupon
                                                if(err){
                                                    return res.json({status:500,error:err});
                                                }

                                                return res.json({success:true,coupon:update});
                                            });
                                        }
                                    });
                                }
                                else{
                                    update.save(function(err){    //save the updated Coupon
                                        if(err){
                                            return res.json({status:500,error:err});
                                        }
                                        return res.json({success:true,coupon:update});
                                    });
                                }
                            }
                        });
                    }
                }
            });
        }
//    }
});

router.get('/deleteCoupon',function(req,res,next){
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }

    else{
*/
        if(req.query!=null){
            var coupon_id = parseInt(req.query.coupon_id);
            coupons.remove({coupon_id:coupon_id},function(err){
                if(err){
                    return res.json({status:500,error:err});
                }
                else{
                    return res.json({success:true,message:"Coupon with coupon_id: "+req.query.coupon_id+" is deleted"});
                }
            });
        }
//    }
});

module.exports = router;
