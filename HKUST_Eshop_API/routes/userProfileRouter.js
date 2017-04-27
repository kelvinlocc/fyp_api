var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var products = require(path.join(__dirname+'/../common/models/product'));
var users = require(path.join(__dirname+'/../common/models/sysUser'));
var orders = require(path.join(__dirname+'/../common/models/order'));
var orderItems = require(path.join(__dirname+'/../common/models/orderItem'));
var userFavourites = require(path.join(__dirname+'/../common/models/userFavourite'));

router.use(bodyParser.json());

//login is needed for all userFavourite functions
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

router.get('/getUserFavourites',function(req,res,next){      //get all userFavourites
    userFavourites.find().populate('user').populate('product').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findUserFavouriteById',function(req,res,next){         //find the UserFavourite by favour_id
    if(req.query!=null){
        //console.log(req.query);

        var favour_id = parseInt(req.query.favour_id);
        userFavourites.find({favour_id:favour_id}).populate('user').populate('product').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,userFavourite:result[0]});
        });
    }
});

router.get('/findUserFavouritesByUser',function(req,res,next){         //find the UserFavourite by favour_id
    if(req.query!=null){
        //console.log(req.query);

        var user_id = parseInt(req.query.user_id);
        userFavourites.find({user_id:user_id}).populate('user').populate('product').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,userFavourite:result});
        });
    }
});

router.get('/findUserFavouritesByProduct',function(req,res,next){         //find the UserFavourite by favour_id
    if(req.query!=null){
        //console.log(req.query);

        var product_id = parseInt(req.query.product_id);
        userFavourites.find({product_id:product_id}).populate('user').populate('product').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,userFavourite:result});
        });
    }
});

router.get('/getUserHistory',function(req,res,next){
    if(req.query!=null){
        var user_id = parseInt(req.query.user_id);
        orders.find({user_id:user_id,status:"finished"}).populate({path:'items',populate:{path:'product'}}).populate('user').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,userHistory:result});
        });
    }
});

/*
router.get('/newUserFavourite',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newUserFavourite.html'));
});
*/


router.post('/newUserFavourite',function(req,res,next){

    var data = req.body;
    if( data.user_id == "undefined" || !data.user_id ||
        data.product_id == "undefined" || !data.product_id){
        return res.json({success:false,message:"please fill in all data. "});
    }

    else{
        var favour_id=0;
        var user_id = parseInt(req.body.user_id);
        var product_id = parseInt(req.body.product_id);

        userFavourites.find().sort({favour_id:-1}).limit(1).exec(function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }

            else{
                if(doc.length){
                    favour_id= doc[0].favour_id+1;
                }

                var existing = userFavourites.find({favour_id:favour_id,user_id:user_id,product_id:product_id},function(err,result){     //check if UserFavourite exists
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else if(result.length){
                        return res.json({success:false,message:"UserFavourite already exist"});
                    }
                    else{

                        var relatedOrder = users.findOne({user_id:user_id},function(err,order){              //check if order is valid
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else if(!order){
                                return res.json({success:false,message:"User not exist"});
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
                                        var newUserFavourite = new userFavourites({
                                            favour_id:favour_id,
                                            user_id:user_id,
                                            product_id:product_id
                                        });

                                        newUserFavourite.save(function(err){
                                            if(err){
                                                return res.json({status:500,error:err});
                                            }
                                            return res.json({success:true,userFavourite:newUserFavourite});
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

router.get('/deleteUserFavourite',function(req,res,next){
    if(req.query!=null){
        var user_id = parseInt(req.query.user_id);
        var product_id = parseInt(req.query.product_id);
        userFavourites.remove({user_id:user_id,product_id:product_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,message:"UserFavourite is deleted"});
            }
        });
    }
});

module.exports = router;
