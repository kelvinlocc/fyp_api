var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var shops = require(path.join(__dirname+'/../common/models/shop'));

router.use(bodyParser.json());

//login is needed for all shop functions

router.get('/',function(req,res,next){      //get all shops
    var shopData = shops.find({},function(err,docs){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.send(docs);
    });
});

router.use(function(req,res,next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if(token){
        jwt.verify(token, req.app.get('superSecret'),function(err,decoded){
            if(err){
                return res.json({success: false, message:'Failed to authenticate token.'});
            } else{
                var user_role = req.app.get('user_role');
                if(user_role != 'super_admin' && user_role != 'shop_admin' && user_role != 'staff'){
                    return res.json({success: false, message:'Unauthorized user.'});
                }
                req.decoded = decoded;
                next();
            }
        });
    }   else {
        return res.status(403).send({success: false, message: 'unauthorized access'});
    }
});


router.get('/findShopsByName',function(req,res,next){       //find the shop by shop_name
    if(req.query!=null){
        //console.log(req.query);
        var query = shops.find({shop_name:req.query.shop_name},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.send(doc);
            }
            else{
                return res.end("shop not exists");
            }
        });
        /*
        */
    }
});

router.get('/findShopsById',function(req,res,next){         //find the shop by shop_id, not ID
    if(req.query!=null){
        //console.log(req.query);

        var shop_id = parseInt(req.query.shop_id);
        var query = shops.find({shop_id:shop_id},function(err,doc){       //cannot use findById as Id != shop_id
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.send(doc);
            }
            else{
                return res.end("shop not exists");
            }
        });
    }
});

router.get('/newShop',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newShop.html'));
});


router.post('/newShop',function(req,res,next){

    var data = req.body;
    if(data.shop_id == "" ||
        data.shop_name == "" ||
        data.opening_hours == "" ||
        data.contact == ""){
        return res.end("please fill in all data. ");
    }

    var shop_id = parseInt(data.shop_id);

    var existing = shops.find({shop_id:shop_id});
    if(existing.length){
        return res.end("shop exist");
    }

    var newShop = new shops({
        shop_id:shop_id,
        shop_name:req.body.shop_name,
        opening_hours:req.body.opening_hours,
        contact:req.body.contact
    });
    newShop.save(function(err){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.send(newShop);
    });
});

router.get('/updateShop',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateShop.html'));
});


router.post('/updateShop',function(req,res,next){           //update shop
    if(req.body==null){
        res.end("please enter some data");
        return;
    }

    var shop_id = parseInt(req.body.shop_id);

    shops.find({shop_id:shop_id},function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        if(!result.length){
            res.end("shop not exist!");
        }
        var update = result[0];

        update.shop_name = req.body.shop_name;
        update.opening_hours = req.body.opening_hours;
        update.contact = req.body.contact;

        update.save(function(err,result){
            if(err) throw err;
            res.send(result);
        });
    });

});

router.get('/deleteShop',function(req,res,next){
    if(req.query!=null){

        var shop_id = parseInt(req.query.shop_id);
        shops.remove({shop_id:shop_id},function(err){
            if(err){
                res.send(err);
            }
            else{
                res.end("shop with shop_id: "+req.query.shop_id+" is deleted");
            }
        });
    }
});

module.exports = router;
