var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');
var multer = require('multer');
var fs = require('fs');

var shops = require(path.join(__dirname+'/../common/models/shop'));

var storage = multer.diskStorage({
    destination: function(req,file,callback){
        callback(null,'./public/images/shops/');
    },
    filename: function(req,file,callback){
        shops.find().sort({shop_id:-1}).limit(1).exec(function(err,doc){
            var shop_id = 0;
            if(doc.length){
                shop_id = doc[0].shop_id + 1;
            }
        var filename = 'shop' + shop_id +'.jpg';
        if(typeof req.body.filename != 'undefined' && req.body.filename != "" && req.body.filename != "undefined"){
            filename = req.body.filename;
        }
        callback(null,filename);
        });
    }
});

var upload = multer({storage:storage}).single('image_path');

var app = express();

var router = express.Router();


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

router.get('/openImage',function(req,res,next){
    var shop_id = parseInt(req.query.shop_id);
    shops.find({shop_id:shop_id},function(err,shop){
        var image_path = shop[0].image_path;
        var image = fs.readFileSync(image_path);
        res.writeHead(200,{'Content-Type':'image/jpeg'});
        return res.end(image,'binary');
    });
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
*/

router.get('/findShopByName',function(req,res,next){       //find the shop by shop_name
    if(req.query!=null){
        var query = shops.find({shop_name:req.query.shop_name},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.json({success:true,shop:doc});
            }
            else{
                return res.json({success:false,message:"shop not exists"});
            }
        });
        /*
        */
    }
});

router.get('/findShopById',function(req,res,next){         //find the shop by shop_id, not ID
    if(req.query!=null){

        var shop_id = parseInt(req.query.shop_id);
        var query = shops.find({shop_id:shop_id},function(err,doc){       //cannot use findById as Id != shop_id
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.json({success:true, shop:doc[0]});
            }
            else{
                return res.json({success:false,message:"shop not exists"});
            }
        });
    }
});

router.get('/newShop',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newShop.html'));
});

router.post('/uploadShopImage',function(req,res,next){
    upload(req,res,function(err){
        if(err){
            return res.json({status:500,error:err,message:"cannot find image"});
        }
        var image_path = "null";
        if(req.file){
            image_path = req.file.path;
        }
            return res.json({success:true,image_path:image_path});
    });
});

router.post('/newShop',function(req,res){
    var data = req.body;
    if(
        !data.shop_name ||
        !data.opening_hours ||
        !data.contact){
        return res.json({success:false,message:'please fill in all data'});
    }

    var shop_id = 0;
    shops.find().sort({shop_id:-1}).limit(1).exec(function(err,doc){
    if(err){
        return res.json({status:500,error:err});
    }
    if(doc.length){
        shop_id =  doc[0].shop_id + 1;
    }

    shops.find({shop_id:shop_id},function(err,doc){ //check shop id
    if(err){
        return res.json({status:500,error:err});
    }
    if(doc.length){
        return res.json({success:false,message:'shop exists'});
    }
    else{

        shops.find({shop_name:req.body.shop_name},function(err,doc){ //check shop name
            if(err){
                return res.json({status:500,error:err});
            }
            if(doc.length){
                return res.json({success:false,message:'shop exists'});
            }
            else{
                var newShop = new shops({
                shop_id:shop_id,
                shop_name:req.body.shop_name,
                opening_hours:req.body.opening_hours,
                image_path:req.body.image_path,
                contact:req.body.contact,
                address:req.body.address
                });

                newShop.save(function(err){
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else{
                        return res.json({success:true,shop:newShop});
                    }
                }); //end save
            }
        }); //end find shop_name
    }
    }); //end find shop_id
    }); //end find shop
}); //end route

router.get('/updateShop',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateShop.html'));
});


router.post('/updateShop',function(req,res,next){           //update shop
console.log(req.body);
    if( !req.body.shop_id ||
        !req.body.contact ||
        !req.body.address){
        return res.json({success:false,message:'please enter some data'});
    }   

    else{
        var shop_id = parseInt(req.body.shop_id);

        shops.find({shop_id:shop_id},function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(!result.length){
                return res.json({success:false,message:'shop not exists'});
            }
            else{

                var image_path = '';
                if(req.file){
                    image_path = req.file.path;
                }

                var update = result[0];
    
                update.opening_hours = req.body.opening_hours;
                update.image_path = req.body.image_path;
                update.contact = req.body.contact;
                update.address = req.body.address;

                 update.save(function(err,doc){
                    if(err){
                        return res.json({status:500,error:err});
                    }
                    else{
                         return res.json({success:true,shop:doc});
                    }
                });
            }
        });
    }
});

router.get('/deleteShop',function(req,res,next){
    if(req.query!=null){

        var shop_id = parseInt(req.query.shop_id);
        shops.remove({shop_id:shop_id},function(err){
            if(err){
                return res.json({status:500,errer:err});
            }
            else{
                var message = "shop with shop_id: "+req.query.shop_id+" is deleted";
                return res.json({success:true,message:message});
            }
        });
    }
});

module.exports = router;
