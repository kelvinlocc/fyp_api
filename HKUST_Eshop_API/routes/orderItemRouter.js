var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var products = require(path.join(__dirname+'/../common/models/product'));
var orders = require(path.join(__dirname+'/../common/models/order'));
var orderItems = require(path.join(__dirname+'/../common/models/orderItem'));

router.use(bodyParser.json());

//login is needed for all orderItem functions
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

router.get('/',function(req,res,next){      //get all orderItems
/*
    if( req.app.get('user_role') != 'super_admin' &&    //only staff or admins can access all orderItems
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
    ){
        return res.json({success:false, message:'Unauthorized user'});
    }
*/

    orderItems.find().populate({path:'order',populate:{path:'shop'}}).populate({path:'order',populate:{path:'user'}}).populate('product').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findOrderItemById',function(req,res,next){         //find the OrderItem by item_id
/*
    if( req.app.get('user_role') != 'super_admin' &&
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
        ){
            return res.json({success:false, message:'Unauthorized user'});
        }
*/

    if(req.query!=null){
        //console.log(req.query);

        var item_id = parseInt(req.query.item_id);
        orderItems.find({item_id:item_id}).populate('order').populate('product').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,orderItem:result[0]});
        });
    }
});

router.get('/findOrderItemByOrder',function(req,res,next){         //find the OrderItem by item_id
    if(req.query!=null){
        //console.log(req.query);

        var order_id = parseInt(req.query.order_id);
        orderItems.find({order_id:order_id}).populate('order').populate('product').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,orderItem:result});
        });
    }
});

router.get('/findOrderItemByProduct',function(req,res,next){         //find the OrderItem by item_id
/*
    if( req.app.get('user_role') != 'super_admin' &&
        req.app.get('user_role') != 'shop_admin' &&
        req.app.get('user_role') != 'staff'
        ){
            return res.json({success:false, message:'Unauthorized user'});
        }
*/

    if(req.query!=null){
        //console.log(req.query);

        var product_id = parseInt(req.query.product_id);
        orderItems.find({product_id:product_id}).populate('order').populate('product').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,orderItem:result});
        });
    }
});

router.get('/newOrderItem',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newOrderItem.html'));
});


router.post('/newOrderItem',function(req,res,next){

    var data = req.body;
    if( data.order_id == "undefined" || !data.order_id ||
        data.quantity == "undefined" || !data.quantity ||
        data.product_id == "undefined" || !data.product_id){
        return res.json({success:false,message:"please fill in all data. "});
    }

    else{
        var item_id=0;
        var order_id = parseInt(req.body.order_id);
        var product_id = parseInt(req.body.product_id);
        var quantity = parseInt(req.body.quantity);

        orderItems.find().sort({item_id:-1}).limit(1).exec(function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }

            else{
                if(doc.length){
                    item_id= doc[0].item_id+1;
                }

                var existing = orderItems.find({item_id:item_id},function(err,result){     //check if OrderItem exists
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else if(result.length){
                        return res.json({success:false,message:"OrderItem already exist"});
                    }
                    else{

                        var relatedOrder = orders.findOne({order_id:order_id},function(err,order){              //check if order is valid
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else if(!order){
                                return res.json({success:false,message:"Order not exist"});
                            }

                            else{
                                var relatedProduct = products.findOne({product_id:product_id},function(err,product){              //check if product is valid
                                    if(err){
                                        return res.json({status:500,error:err});
                                    }
                                    else if(!product){
                                       return res.json({success:false,message:"Product not exist"});
                                    }
                                    else{
                                        var newOrderItem = new orderItems({
                                            item_id:item_id,
                                            order_id:order_id,
                                            product_id:product_id,
                                            quantity:quantity
                                        });

                                        newOrderItem.save(function(err){
                                            if(err){
                                                return res.json({status:500,error:err});
                                            }
                                            return res.json({success:true,orderItem:newOrderItem});
                                        });
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

router.get('/updateOrderItem',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateOrderItem.html'));
});


router.post('/updateOrderItem',function(req,res,next){           //update OrderItem
    var data = req.body;
    if( data.item_id == "undefined" || !data.item_id ||
        data.order_id == "undefined" || !data.order_id ||
        data.quantity == "undefined" || !data.quantity ||
        data.product_id == "undefined" || !data.product_id){
        return res.json({success:false,message:"please fill in all data. "});
    }

    else{
        var item_id = parseInt(req.body.item_id);
        orderItems.find({item_id:item_id},function(err,result){    //if shop does not exist
            if(err){
                return res.json({status:500,error:err});
            }

            else if(!result.length){
                return res.end("OrderItem not exist");
            }

            else{
                var update = result[0];

                var order_id = parseInt(req.body.order_id);
                orders.find({order_id:order_id},function(err,order){
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else if(!order.length){
                        return res.json({success:false,message:"Order not exist"});
                    }
                    else{
                        update.order_id = order_id;

                        var product_id = parseInt(req.body.product_id);
                        products.find({product_id:product_id},function(err,product){
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else if(!product.length){
                                return res.json({success:false,message:"product not exist"});
                            }
                            else{
                                update.product_id = product_id;

                                update.quantity = parseInt(req.body.quantity);

                                update.save(function(err){    //save the updated OrderItem
                                    if(err){
                                        return res.json({status:500,error:err});
                                    }
                                    return res.json({success:true,orderItem:update});
                                });
                            }
                        });
                    }
                });
            }
        });
    }
});

router.get('/deleteOrderItem',function(req,res,next){
    if(req.query!=null){
        var item_id = parseInt(req.query.item_id);
        orderItems.remove({item_id:item_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,message:"OrderItem with item_id: "+req.query.item_id+" is deleted"});
            }
        });
    }
});

module.exports = router;
