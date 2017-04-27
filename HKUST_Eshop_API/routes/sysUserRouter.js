var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');

var router = express.Router();

var sysUsers = require(path.join(__dirname+'/../common/models/sysUser'));
var shops = require(path.join(__dirname+'/../common/models/shop'));

router.use(bodyParser.json());

var jwt = require('jsonwebtoken');

router.get('/logout',function(req,res,next){
    req.app.set('user_id','');
    req.app.set('token','');
    return res.json({success:true,message:"logout success."});
});

router.post('/Userlogin',function(req,res,next){
    sysUsers.find({username:req.body.username},function(err,users){
        if(err) return res.json({status:500,error:err});
        var user = users[0];
        if(!user) return res.json({success:false,message: 'Authentication failed. User not found'});
        else if(user){
            if(user.password != req.body.password){
                return res.json({success:false, message: 'Authentication failed. Incorrect password'});
            }
            if(user.user_role != "customer"){
                return res.json({success:false, message: 'Authentication failed. Incorrect user'});
            }
            else{
                var token = jwt.sign(user,req.app.get('superSecret'),{
                    expiresIn:(60*60*24)
                });
                req.app.set('user_id',user.user_id);
                req.app.set('token',token);
                return res.json({
                    success:true,
                    message: 'Authentication success.',
                    token:token,
                    user_role:req.app.get('user_role')
                });
            }
        }
    });
});

router.post('/Adminlogin',function(req,res,next){
    sysUsers.find({username:req.body.username},function(err,users){
        if(err) return res.json({status:500,error:err});
        var user = users[0];
        if(!user) return res.json({success:false,message: 'Authentication failed. User not found'});
        else if(user){
            if(user.password != req.body.password){
                return res.json({success:false, message: 'Authentication failed. Incorrect password'});
            }
            if( user.user_role != "super_admin" &&
                user.user_role != "shop_admin" &&
                user.user_role != "staff"){
                return res.json({success:false, message: 'Authentication failed. Incorrect user'});
            }
            else{
                var token = jwt.sign(user,req.app.get('superSecret'),{
                    expiresIn:(60*60*24)
                });
                req.app.set('user_id',user.user_id);
                req.app.set('token',token);
                return res.json({
                    success:true,
                    message: 'Authentication success.',
                    token:token,
                    user_role:req.app.get('user_role')
                });
            }
        }
    });
});


router.post('/register',function(req,res,next){

    if(
        req.body.username == "" ||
        req.body.password == "" ||
        req.body.email == ""){
        return res.json({success:false, message:"please fill in all data. "});
    }

    else{
        var user_id = 0;
        sysUsers.find().sort({user_id:-1}).limit(1).exec(function(err,doc){
        if(err){
            return res.json({status:500,error:err});
        }

        else{
            if(doc.length){
                user_id = doc[0].user_id +1;
            }

            var existing = sysUsers.find({user_id:user_id});
            if(existing.length){
                return res.json({success:false,message:"user exist"});
            }

            else{
                sysUsers.find({username:req.body.username},function(err,doc){
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else if(doc.length){
                        return res.json({success:false,message:"user exist"});
                    }

                    else{
                        var newUser = new sysUsers({
                            user_id:user_id,
                            username:req.body.username,
                            password:req.body.password,
                            email:req.body.email,
                            user_role: 'customer'
                        });
                        newUser.save(function(err){
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else {
                                return res.json({success:true,user:newUser});
                            }
                        });
                    }
                });
            }
        }
        });
    }
});
/*
router.use(function(req,res,next){
    var token = req.body.token || req.query.token || req.app.get('token');

    if(token){
        jwt.verify(token, req.app.get('superSecret'),function(err,decoded){
            if(err){
                return res.json({success: false, message:'Failed to authenticate token.'});
            } else{
                var user_role = req.app.get('user_role');
                if( (user_role != "super_admin") && (user_role != "shop_admin") ){       //only super_admin or shop_admin can assess user information
                    return res.json({success: false,message: 'Unauthorized User'});
                }
                else{
                    req.decoded = decoded;
                    next();
                }
            }
        });
    }   else {
        return res.status(403).send({success: false, message: 'unauthorized access'});
    }
});
*/

router.get('/',function(req,res,next){      //get all shops
    sysUsers.find().populate('shop').exec(function(err,docs){
        if(err){
            return res.json({status:500,error:err});
        }
        else{
            return res.json({success:true, users:docs});
        }
    });
});

router.get('/findUserByName',function(req,res,next){       //find the user by user_name
    if(req.query!=null){
        var query = sysUsers.find({username:req.query.username},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.json({success:true,user:doc[0]});
            }
            else{
                return res.json({success:false,message:'user not exists'});
            }
        });
        /*
        */
    }
});


router.get('/findUserById',function(req,res,next){         //find the user by user_id, not ID
    if(req.query!=null){

        var user_id = parseInt(req.query.user_id);
        var query = sysUsers.find({user_id:user_id}).populate({path:'shop'}).exec(function(err,doc){       //cannot use findById as Id != shop_id
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.json({success:true,user:doc[0]});
            }
            else{
                return res.json({success:false,message:'user not exists'});
            }
        });
    }
});

router.get('/findUserByShop',function(req,res,next){         //find the user by user_id, not ID
    if(req.query!=null){

        var shop_id = parseInt(req.query.shop_id);
        var query = sysUsers.find({shop_id:shop_id}).populate('shop').exec(function(err,doc){       //cannot use findById as Id != shop_id
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.json({success:true,user:doc});
            }
            else{
                return res.json({success:false,message:'shop not exist'});
            }
        });
    }
});

router.get('/newUser',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newUser.html'));
});


router.post('/newUser',function(req,res,next){

    if( !req.body ||
        req.body.shop_id == "undefined" || !req.body.shop_id || req.body.shop_id == "" ||
        req.body.username == "undefined" || !req.body.username || req.body.username == "" ||
        req.body.password == "undefined" || !req.body.password || req.body.password == "" ||
        req.body.user_role == "undefined" ||
        req.body.email == "undefined" || req.body.email == "" || !req.body.email){
        return res.json({success:false, message:"please fill in all data. "});
    }

    else{
        var loggined_role = req.app.get('user_role');
        var role = req.body.user_role;

        if(role != 'super_admin' && role != 'shop_admin' && role != 'staff' && role != 'customer'){
            return res.json({success:false, message:' incorrect user role'});
        }

        else if(req.body.user_role == 'super_admin'){    // system admin cannot be created by CMS
            return res.json({success:false, message:'system admin cannot be created'});
        }

/*
        else if(req.body.user_role == 'shop_admin'){ //need to check if the accessing user is super_admin or not, otherwise cannot create new shop admin
            if(loggined_role != "super_admin"){
                return res.json({success:false,message:'unauthorized access, please check with your system admin'});
            }
        }
*/

        else{
            var shop_id = parseInt(req.body.shop_id);
            shops.find({shop_id:shop_id},function(err,doc){
                if(err){
                    return res.json({status:500,error:err});
                }
                else if(!doc.length){
                    return res.json({success:false,message:"shop not exist"});
                }

                else{
                    sysUsers.find().sort({user_id:-1}).limit(1).exec(function(err,doc){

                        var user_id = doc[0].user_id +1;

                        var existing = sysUsers.find({user_id:user_id});
                        if(existing.length){
                            return res.json({success:false,message:"user exist"});
                        }

                        else{
                            sysUsers.find({username:req.body.username},function(err,doc){
                                if(err){
                                    return res.json({status:500,error:err});
                                }
                                else if(doc.length){
                                    return res.json({success:false,message:"user exist"});
                                }

                                else{
                
                                    var newUser = new sysUsers({
                                        user_id:user_id,
                                        username:req.body.username,
                                        password:req.body.password,
                                        email:req.body.email,
                                        user_role: req.body.user_role,
                                        shop_id: shop_id
                                    });
                                    newUser.save(function(err){
                                        if(err){
                                            return res.json({status:500,error:err});
                                        }
                                        else {
                                            return res.json({success:true,user:newUser});
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }
});

router.get('/updateUser',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateUser.html'));
});


router.post('/updateUser',function(req,res,next){           //update user
    var data = req.body;
//    if( data.username == "" || data.username == undefined ||
//        data.email == "" || data.email == undefined ){
      if( data.password == "" || data.password == undefined){
        return res.json({success:false,message:"please enter the user data"});
    }

    else{
/*
        if(req.body.user_role == 'super_admin'){    // system admin cannot be created by CMS
            return res.json({success:false, message:'system admin cannot be created'});
        }

        else if(req.body.user_role == 'shop_admin'){ //need to check if the accessing user is super_admin or not, otherwise cannot create new shop admin
            var loggined_role = req.app.get('user_role');
            if(loggined_role != "super_admin"){
                return res.json({success:false,message:'unauthorized access, please check with your system admin'});
            }
        }
        else{
*/
            var user_id = parseInt(req.body.user_id);

            sysUsers.find({user_id:user_id},function(err,result){    //if shop does not exist
                if(err){
                    return res.json({status:500,error:err});
                }

                else if(!result.length){
                    return res.json({success:false, message:"user not exist"});
                }

                else{
                    var user = result[0];
                    if(user.user_role == 'customer' && req.body.user_role != 'customer'){  //inputed user is a customer and want to be changed to other role
//                        return res.json({success:false,message:'access failed, customer cannot be changed to other role'});
                    }

                    else{
                        sysUsers.find({username:req.body.username},function(err,result){
                            if(err){
                                return res.json({status:500,error:err});
                            }

                            else if(result.length){
                                return res.json({success:false, message:"user already exist"});
                            }

                            else{
                                //handle the input data, assume unchanged data is also inputed by front-end
                                user.password = req.body.password;
/*                                user.username = req.body.username;
                                user.email = req.body.email;
*/                                user.user_role = req.body.user_role;

                                user.save(function(err,updatedUser){    //save the updated shop
                                    if(err){
                                    return res.json({status:500,error:err});
                                    }
                                    else{
                                        return res.json({success:true,user:updatedUser});
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    //}
});

router.get('/deleteUser',function(req,res,next){
/*
    if(req.app.get('user_role') != 'super_admin'){
        return res.json({success:false,message:'Unauthorized user'});
    }
*/
    if(req.query!=null){
        var user_id = parseInt(req.query.user_id);
        sysUsers.remove({user_id:user_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true, message: "user with user_id: "+req.query.user_id+" is deleted"});
            }
        });
    }
});
/*  //user cannot be deleted
*/

module.exports = router;
