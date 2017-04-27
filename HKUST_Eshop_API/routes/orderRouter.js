var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var shops = require(path.join(__dirname+'/../common/models/shop'));
var orders = require(path.join(__dirname+'/../common/models/order'));
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
    var user_role = req.app.get('user_role');
    if(user_role != 'super_admin' && user_role != 'shop_admin' && user_role != 'staff'){    // only staff or admin can access all order
        return res.json({success:false,message:'unauthorized user'});
    }
*/

    orders.find().populate({path:'items',populate:{path:'product'}}).populate('shop').populate('user').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findOrderById',function(req,res,next){         //find the order by order_id

    if(req.query!=null){
        //console.log(req.query);

        var order_id = parseInt(req.query.order_id);
        orders.find({order_id:order_id}).populate({path:'items',populate:{path:'product'}}).populate('shop').populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,order:result[0]});
        });
    }
});

router.get('/findOrderByShop',function(req,res,next){         //find the order by order_id
/*
    var user_role = req.app.get('user_role');
    if(user_role != 'super_admin' && user_role != 'shop_admin' && user_role != 'staff'){    // only staff or admin can access all order
        return res.json({success:false,message:'unauthorized user'});
    }
*/

    if(req.query!=null){
        //console.log(req.query);

        var shop_id = parseInt(req.query.shop_id);
        orders.find({shop_id:shop_id}).populate('shop').populate({path:'items',populate:{path:'product'}}).populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,order:result});
        });
    }
});

router.get('/findOrderByUser',function(req,res,next){         //find the order by order_id
    if(req.query!=null){
        //console.log(req.query);

        var user_id = parseInt(req.query.user_id);
        orders.find({user_id:user_id}).populate('shop').populate('user').populate({path:'items',populate:{path:'product'}}).exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,order:result});
        });
    }
});

router.get('/newOrder',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newOrder.html'));
});


router.post('/newOrder',function(req,res,next){

    var data = req.body;
    if( data.shop_id == 'undefined' || !data.shop_id ||
        data.status == 'undefined' || !data.status ||
        data.user_id == 'undefined' || !data.user_id){
        return res.json({success:false,message:"please fill in all data. "});
    }

    else{
        var order_id=0;
        var shop_id = parseInt(req.body.shop_id);
        var user_id = parseInt(req.body.user_id);

        orders.find().sort({order_id:-1}).limit(1).exec(function(err,doc){

            if(doc.length){
                order_id = doc[0].order_id +1;
            }

            var existing = orders.find({order_id:order_id},function(err,result){     //check if order exists
                if(result.length){
                    return res.json({success:false,message:"Order already exist"});
                }

                else{
                    var relatedShop = shops.findOne({shop_id:shop_id},function(err,shop){              //check if shop is valid
                        if(err){
                            return res.json({status:500,error:err});
                        }
                        else if(!shop){
                            return res.json({success:false,message:"Shop not exist"});
                        }

                        else{
                            var relatedUser = users.findOne({user_id:user_id},function(err,user){              //check if shop is valid
                                if(err){
                                    return res.json({status:500,error:err});
                                }
                                else if(!user){
                                   return res.json({success:false,message:"User not exist"});
                                }

                                else{
                                    var newOrder = new orders({
                                        order_id:order_id,
                                        shop_id:shop_id,
                                        user_id:user_id,
                                        status:req.body.status,
                                        publish_date:req.body.publish_date
                                    });

                                    newOrder.save(function(err){
                                        if(err){
                                            return res.json({status:500,error:err});
                                        }
                                        return res.json({success:true,order:newOrder});
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
});

router.get('/updateOrder',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateOrder.html'));
});


router.post('/updateOrder',function(req,res,next){           //update Order
/*
    var user_role = req.app.get('user_role');
    if(user_role != 'super_admin' && user_role != 'shop_admin' && user_role != 'staff'){    // only staff or admin can update order
        return res.json({success:false,message:'unauthorized user'});
    }
*/

//    else{
        var data = req.body;
        if( data.order_id == "undefined" || !data.order_id ||
            data.shop_id == "undefined" || !data.shop_id ||
            data.status == "undefined" || !data.status ||
            data.user_id == "undefined" || !data.user_id){
            return res.json({success:false,message:"please enter the Order data"});
        }

        else{
            var order_id = parseInt(req.body.order_id);
            orders.find({order_id:order_id},function(err,result){    //if shop does not exist
                if(err){
                    return res.json({status:500,error:err});
                }

                else if(!result.length){
                    return res.json({success:false,message:"Order not exist"});
                }

                else{
                    var update = result[0];

                    //handle the input data, assume unchanged data is also inputed by front-end
                    var shop_id = parseInt(req.body.shop_id);

                    shops.find({shop_id:shop_id},function(err,shop){
                        if(err){
                            return res.json({status:500,error:err});
                        }
                        else if(!shop.length){
                            return res.json({success:false,message:"Shop not exist"});
                        }
                        else{
                            update.shop_id = shop_id;

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
                                    update.status = req.body.status;
                                    update.publish_date = req.body.publish_date;

                                    update.save(function(err){    //save the updated Order
                                        if(err){
                                            return res.json({status:500,error:err});
                                        }
                                        return res.json({success:true,order:update});
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

router.get('/deleteOrder',function(req,res,next){
/*
    var user_role = req.app.get('user_role');
    if(user_role != 'super_admin' && user_role != 'shop_admin' && user_role != 'staff'){    // only staff or admin can delete order
        return res.json({success:false,message:'unauthorized user'});
    }
*/

    if(req.query!=null){
        var order_id = parseInt(req.query.order_id);
        orders.remove({order_id:order_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,message:"Order with order_id: "+req.query.order_id+" is deleted"});
            }
        });
    }
});

module.exports = router;
