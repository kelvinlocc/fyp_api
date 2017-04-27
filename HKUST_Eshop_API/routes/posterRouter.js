var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var multer = require('multer');

var posters = require(path.join(__dirname+'/../common/models/poster'));

var storage = multer.diskStorage({
    destination: function(req,file,callback){
        callback(null,'./public/images/posters/');
    },
    filename: function(req,file,callback){
        posters.find().sort({poster_id:-1}).limit(1).exec(function(err,doc){
            var poster_id = 0;
            if(doc.length){
                poster_id = doc[0].poster_id + 1;
            }
            var filename = 'poster_' + poster_id +'.jpg';
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

var shops = require(path.join(__dirname+'/../common/models/shop'));

router.use(bodyParser.json());

router.get('/openImage',function(req,res,next){
    var poster_id = parseInt(req.query.poster_id);
    posters.find({poster_id:poster_id},function(err,poster){
        var image_path = poster[0].image_path;
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
                if( req.app.get('user_role') != 'super_admin' &&
                    req.app.get('user_role') != 'shop_admin' &&
                    req.app.get('user_role') != 'staff'
                  ){
                    return res.json({success:false, message:'Unauthorized user', body:req.body});
                }
                else{
                    req.decoded = decoded;
                    next();
                }
            }
        });
    }   else {
        return res.status(403).send({success: false, message: 'unauthorized access', body:req.body});
    }
});
*/

router.get('/',function(req,res,next){      //get all shops
    posters.find().populate('shop').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findPosterById',function(req,res,next){         //find the Poster by poster_id
    if(req.query!=null){
        //console.log(req.query);

        var poster_id = parseInt(req.query.poster_id);
        posters.find({poster_id:poster_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,poster:result[0]});
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
            return res.json({success:true,poster:result});
        });
    }
});

router.post('/uploadPoster',function(req,res,next){
    upload(req,res,function(err){
        if(err){
            return res.json({status:500,error:err,message:"cannot find image"});
        }
        var image_path;
        if(req.file){
            image_path = req.file.path;
        }
            return res.json({success:true,image_path:image_path});
    });
});

router.post('/newPoster',function(req,res,next){
    var data = req.body;
    if( !data.shop_id || data.shop_id == "undefined" || data.shop_id == "" ||
        !data.publish_date || data.publish_date == "undefined" || data.publish_date == ""){
        return res.json({status:500,message:"please fill in all data."});
    }

   else{

        var poster_id = 0;
        posters.find().sort({poster_id:-1}).limit(1).exec(function(err,doc){
            if(doc.length){
                poster_id = doc[0].poster_id + 1;
            }

            posters.find({poster_id:poster_id},function(err,result){     //check if Poster exists
                if(err){
                    return res.json({status:500,error:err});
                }
                if(result.length){
                    return res.json({success:false,messsage:"Poster already exist"});
                }

                else{
                    var shop_id = parseInt(req.body.shop_id);

                    shops.findOne({shop_id:shop_id},function(err,shop){              //check if shop is valid
                        if(err){
                            return res.json({status:500,error:err});
                        }
                        if(!shop){
                            res.json({success:false,message:"Shop not exist"});
                        }
                        else{
                            req.body.publish_date = req.body.publish_date.substring(0,16);

                            var newPoster = new posters({
                                poster_id:poster_id,
                                shop_id:shop_id,
                                image_path:req.body.image_path,
                                publish_date: req.body.publish_date
                            });

                            newPoster.save(function(err){
                                if(err){
                                    return res.json({status:500,error:err});
                                }
                                return res.json({success:true,poster:newPoster});
                            });
                        }
                    });
                }
            });
        });
    }
});

router.get('/updatePoster',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updatePoster.html'));
});


router.post('/updatePoster',function(req,res,next){           //update Poster

    if( !req.body.poster_id ||
        !req.body.publish_date){                                    //need to input any information
            return res.json({success:false,message:"please enter the Poster data"});
    }

    else{
        var poster_id = parseInt(req.body.poster_id);
        posters.find({poster_id:poster_id},function(err,result){    //if shop does not exist
            if(err){
                return res.json({status:500, error:err});
            }
            else if(!result.length){
                return res.json({success:false, message:"Poster not exist"});
            }

            else{
                var update = result[0];

                req.body.publish_date = req.body.publish_date.substring(0,16);
                update.publish_date = req.body.publish_date;
                update.image_path = req.body.image_path;

                var shop_id = parseInt(req.body.shop_id);
                shops.find({shop_id:shop_id},function(err,shop){
                    if(err){
                        return res.json({status:500,error:err});
                    }

                    else if(!shop.length){
                        return res.json({success:false,message:"Shop not exist"});
                    }

                    else{
                        update.save(function(err){    //save the updated Poster
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else{
                                return res.json({success:true, poster:update});
                            }
                        });
                    }
                });
            }
        });
    }
});

router.get('/deletePoster',function(req,res,next){
    if(req.query!=null){
        var poster_id = parseInt(req.query.poster_id);
        posters.remove({poster_id:poster_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                var msg = "Poster with poster_id: "+req.query.poster_id+" is deleted";
                return res.json({success:true, message:msg});
            }
        });
    }
});

module.exports = router;
