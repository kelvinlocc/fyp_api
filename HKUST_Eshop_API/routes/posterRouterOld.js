var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function(req,file,callback){
        callback(null,'./public/images/posters/');
    },
    filename: function(req,file,callback){
        var filename = 'shop' + req.body.shop_id + '_poster_' + req.body.poster_id;
        callback(null,filename);
    }
});

var upload = multer({storage:storage}).single('filepath');

var app = express();

var router = express.Router();

var posters = require(path.join(__dirname+'/../common/models/poster'));
var shops = require(path.join(__dirname+'/../common/models/shop'));

router.use(bodyParser.json());

router.get('/newPoster',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newPoster.html'));
});

router.post('/newPoster',function(req,res,next){
/*
    posters.find().sort({shop_id:01}).limit(1).exec(function(err,doc){
        var shop_id = doc[0].shop_id;
        return res.json({new_id:shop_id+1,shops:doc});
    });
*/
    upload(req,res,function(err){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json({body:req.body,file:req.file});
    });
});


//login is needed for all shop functions
router.use(function(req,res,next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];

    if(token){
        jwt.verify(token, req.app.get('superSecret'),function(err,decoded){
            if(err){
                return res.json({success: false, message:'Failed to authenticate token.'});
            } else{
                if( req.app.get('user_role') != 'super_admin' &&
                    req.app.get('user_role') != 'shop_admin' &&
                    req.app.get('user_role') != 'staff'
                  ){
                    return res.json({success:false, message:'Unauthorized user'});
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

router.get('/',function(req,res,next){      //get all shops
/*
    var productData = posters.find({},function(err,docs){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.send(docs);
    });
*/
    posters.find().populate('shop').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

/*
router.get('/findPosterByName',function(req,res,next){       //find the Poster by Poster_name
    if(req.query!=null){
        //console.log(req.query);
        var query = posters.find({Poster_name:req.query.Poster_name},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc){
                res.send(doc);
            }
            else{
                res.end("Poster not exist");
            }
        });
        posters.find({product_name:req.query.product_name}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json(result);
        });
    }
});
*/

router.get('/findPosterById',function(req,res,next){         //find the Poster by poster_id
    if(req.query!=null){
        //console.log(req.query);

        var poster_id = parseInt(req.query.poster_id);
/*
        var query = posters.find({poster_id:poster_id},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.send(doc);
            }
            else{
                return res.end("Poster not exists");
            }
        });
*/
        posters.find({poster_id:poster_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json(result);
        });
    }
});

router.get('/findPosterByShop',function(req,res,next){ 
    if(req.query!=null){ 
        var shop_id = parseInt(req.query.shop_id);
        posters.find({shop_id:shop_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json(result);
        });
    }
});

router.get('/newPosterIgnored',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newPoster.html'));
});


router.post('/newPosterIgnored',function(req,res,next){

    var data = req.body;
    if( data.shop_id == "" ||
        data.publish_date == "" ||
        data.filename == ""){
        return res.end("please fill in all data. ");
    }

    var poster_id = 0;
    posters.find().sort({shop_id:01}).limit(1).exec(function(err,doc){
        poster_id = parseInt(doc[0].poster_id);
        poster_id += 1;
    });

    var shop_id = parseInt(req.body.shop_id);

/*
    var existing = posters.find({poster_id:poster_id},function(err,result){     //check if Poster exists
        if(err){
            return res.json({status:500,error:err});
        }
        if(result.length){
            return res.end("Poster already exist");
        }
    });
*/

    var relatedShop = shops.findOne({shop_id:shop_id},function(err,shop){              //check if shop is valid
        if(err){
            return res.json({status:500,error:err});
        }
        if(!shop){
            res.end("Shop not exist");
        }
    });

    var filepath = "";
    upload(req,res,function(err){
        if(err){
            return res.json({status:500,error:err});
        }
        filepath = req.file.path;
    });

    var newPoster = new posters({
        poster_id:poster_id,
        shop_id:shop_id,
        filepath:filepath,
        publish_date: req.body.publish_date
    });

    newPoster.save(function(err){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.send(newPoster);
    });
});

router.get('/updatePoster',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updatePoster.html'));
});


router.post('/updatePoster',function(req,res,next){           //update Poster
    if(req.body==null){                                    //need to input any information
        res.end("please enter the Poster data");
    }

    var poster_id = parseInt(req.body.poster_id);
    posters.find({poster_id:poster_id},function(err,result){    //if shop does not exist
        if(!result.length){
            res.end("Poster not exist");
            return;
        }

        var update = result[0];

        //handle the input data, assume unchanged data is also inputed by front-end
        if(req.body.filepath!=""){
            update.filepath = req.body.filepath;
        }
        if(req.body.shop_id!=""){
        var shop_id = parseInt(req.body.shop_id);
        shops.find({shop_id:shop_id},function(err,shop){
            if(err) throw err;
            if(!shop.length) res.end("Shop not exist");
        });
            update.shop_id = shop_id;
        }        
        if(req.body.publish_date != ""){
            update.publish_date = req.body.publish_date;
        }
        update.save(function(err){    //save the updated Poster
                res.send(update);
        });

    });
});

router.get('/deletePoster',function(req,res,next){
    if(req.query!=null){
        var poster_id = parseInt(req.query.poster_id);
        posters.remove({poster_id:poster_id},function(err){
            if(err){
                throw err;
            }
            else{
                res.end("Poster with poster_id: "+req.query.poster_id+" is deleted");
            }
        });
    }
});

module.exports = router;
