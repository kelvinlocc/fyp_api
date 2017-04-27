var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');

var app = express();

var router = express.Router();

var news = require(path.join(__dirname+'/../common/models/news'));
var shops = require(path.join(__dirname+'/../common/models/shop'));

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
*/

router.get('/',function(req,res,next){      //get all shops
    news.find().populate('shop').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findNewsById',function(req,res,next){         //find the News by news_id
    if(req.query!=null){
        //console.log(req.query);

        var news_id = parseInt(req.query.news_id);
        news.find({news_id:news_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true, news:result[0]});
            }
        });
    }
});

router.get('/findNewsByShop',function(req,res,next){ 
    if(req.query!=null){ 
        var shop_id = parseInt(req.query.shop_id);
        news.find({shop_id:shop_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true, news:result});
            }
        });
    }
});

router.get('/newNews',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newNews.html'));
});


router.post('/newNews',function(req,res,next){

    var data = req.body;
    if( data.shop_id == "undefined"||
        data.publish_date == "undefined"||
        data.description == "undefined"){
        return res.json({success:false,message:"please fill in all data. "});
    }
    var shop_id = parseInt(req.body.shop_id);

    var news_id = 0;
    news.find().sort({news_id:-1}).limit(1).exec(function(err,doc){

    if(err){
        return res.json({status:500,error:err});
    }

    else{
        if(doc.length){
            news_id = doc[0].news_id+1;
        }

        news.find({news_id:news_id},function(err,result){     //check if News exists
            if(err){
                return res.json({status:500,error:err});
            }
            else if(result.length){
                return res.json({success:false,message:"News already exist"});
            }

            else{
                shops.findOne({shop_id:shop_id},function(err,shop){              //check if shop is valid

                    if(err){
                        return res.json({status:500,error:err});
                    }

                    else if(!shop){
                        return res.json({success:false,message:"Shop not exist"});
                    }

                    else{
                        req.body.publish_date = req.body.publish_date.substring(0,16);
                        var newNews = new news({
                            news_id:news_id,
                            shop_id:shop_id,
                            description:req.body.description,
                            publish_date: req.body.publish_date
                        });

                        newNews.save(function(err){
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else{
                                return res.json({success:true,news: newNews});
                            }
                        });
                    }
                });
            }
        });
    }
    });
});

router.get('/updateNews',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateNews.html'));
});


router.post('/updateNews',function(req,res,next){           //update News
    var data = req.body;
    if( data.shop_id == "undefined"||
        data.publish_date == "undefined"||
        data.description == "undefined"){
        return res.json({success:false,message:"please enter the News data"});
    }

    else{
        var news_id = parseInt(req.body.news_id);
        news.find({news_id:news_id},function(err,result){    //if shop does not exist
            if(!result.length){
                return res.json({success:false,message:"News not exist"});
            }
            else{
                var update = result[0];

                req.body.publish_date = req.body.publish_date.substring(0,16);
                update.description = req.body.description;
                update.publish_date = req.body.publish_date;

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
                        update.save(function(err){    //save the updated News
                            return res.json({success:true,news:update});
                        });
                    }
                });
            }
        });
    }
});

router.get('/deleteNews',function(req,res,next){
    if(req.query!=null){
        var news_id = parseInt(req.query.news_id);
        news.remove({news_id:news_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                var message = 'news with news_id ' + news_id +' is deleted';
                return res.json({success:true, message: message});
            }
        });
    }
});

module.exports = router;
