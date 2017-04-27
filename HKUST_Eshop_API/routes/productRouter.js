var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path =require('path');
var jwt = require('jsonwebtoken');
var multer = require('multer');
var fs = require('fs');

var products = require(path.join(__dirname+'/../common/models/product'));
var shops = require(path.join(__dirname+'/../common/models/shop'));

var storage = multer.diskStorage({
    destination: function(req,file,callback){
        callback(null,'./public/images/products/');
    },
    filename: function(req,file,callback){
        products.find().sort({product_id:-1}).limit(1).exec(function(err,doc){
            var product_id = 0;
            if(doc.length){
                product_id = doc[0].product_id + 1;
            }
        var filename = 'product_' + product_id + '.jpg';
        callback(null,filename);
        });
    }
});

var upload = multer({storage:storage}).single('image_path');

var app = express();

var router = express.Router();

router.use(bodyParser.json());

router.get('/openImage',function(req,res,next){
    var product_id = parseInt(req.query.product_id);
    products.find({product_id:product_id},function(err,product){
        var image_path = product[0].image_path;
        if(image_path){
            var image = fs.readFileSync(image_path);
            res.writeHead(200,{'Content-Type':'image/jpeg'});
            return res.end(image,'binary');
        }
    });
});

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
                } else{ 
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

router.get('/',function(req,res,next){      //get all products
    products.find().populate('shop').exec(function(err,result){
        if(err){
            return res.json({status:500,error:err});
        }
        return res.json(result);
    });
});

router.get('/findProductByName',function(req,res,next){       //find the product by product_name
    if(req.query!=null){
        //console.log(req.query);
        /*
        var query = products.find({product_name:req.query.product_name},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc){
                res.send(doc);
            }
            else{
                res.end("product not exist");
            }
        });
        */
        products.find({product_name:req.query.product_name}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json(result);
        });
    }
});


router.get('/findProductById',function(req,res,next){         //find the product by product_id
    if(req.query!=null){
        //console.log(req.query);

        var product_id = parseInt(req.query.product_id);
/*
        var query = products.find({product_id:product_id},function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else if(doc.length){
                return res.send(doc);
            }
            else{
                return res.end("product not exists");
            }
        });
*/
        products.find({product_id:product_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,product:result[0]});
        });
    }
});

router.get('/findProductByShop',function(req,res,next){ 
    if(req.query!=null){ 
        var shop_id = parseInt(req.query.shop_id);
        products.find({shop_id:shop_id}).populate('shop').exec(function(err,result){
            if(err){
                return res.json({status:500,error:err});
            }
            return res.json({success:true,product:result});
        });
    }
});


router.post('/uploadProductImage',function(req,res,next){
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

router.get('/newProduct',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/newProduct.html'));
});


router.post('/newProduct',function(req,res,next){
    var data = req.body;
    if( !data.shop_id ||
        !data.product_name ||
        !data.price ||
        !data.description
        ){
            return res.json({success:false,message:"please fill in all data. "});
    }

    else{
        var product_id = 0;
        var shop_id = parseInt(req.body.shop_id);
        var price = parseInt(req.body.price);

        products.find().sort({product_id:-1}).limit(1).exec(function(err,doc){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                if(doc.length){
                    product_id = doc[0].product_id + 1;
                }

                products.find({product_name:req.body.product_name},function(err,doc){

                    if(err){
                        return res.json({status:500,error:err});
                    }

                    else if(doc.length){
                        return res.json({success:false,message:'product exists'});
                    }

                    else{
    
                        var relatedShop = shops.findOne({shop_id:shop_id},function(err,shop){              //check if shop is valid
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else if(!shop){
                                return res.json({success:false, message:"Shop not exist"});
                            }
                            else{

                                var newProduct = new products({
                                    product_id:product_id,
                                    product_name:req.body.product_name,
                                    shop_id:shop_id,
                                    price:price,
                                    on_sale:0,
                                    image_path:req.body.image_path,
                                    description:req.body.description
                                });

                                newProduct.save(function(err){
                                    if(err){
                                        return res.json({status:500,error:err});
                                    }
                                    else {
                                        return res.json({success:true, product:newProduct});
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

router.get('/updateProduct',function(req,res,next){
    res.sendFile(path.join(__dirname+'/../public/updateProduct.html'));
});


router.post('/updateProduct',function(req,res,next){           //update Product
    var data = req.body;

    if( !data.shop_id ||
        !data.product_name ||
        !data.price ||
        !data.description
        ){
        return res.json({sucess:false,message:"please enter the Product data"});
    }

    else{
        var product_id = parseInt(req.body.product_id);
        products.find({product_id:product_id},function(err,result){    //if shop does not exist
            if(err){
                return res.json({status:500,error:err});
            }
            else if(!result.length){
                return res.json({success:false, message:"Product not exist"});
            }

            else{
                var update = result[0];

                var shop_id = parseInt(req.body.shop_id);
                shops.find({shop_id:shop_id},function(err,shop){
                    if(err){
                        return res.json({satatus:500,error:err});
                    }
                    else if(!shop.length){
                        return res.json({success:false,message:'shop not exists'});
                    }

                    else{
                        update.product_name = req.body.product_name;
                        update.product_image = req.body.product_image;
                        update.shop_id = shop_id;
                        var price = parseInt(req.body.price);
                        update.price = price;
                        var on_sale = parseInt(req.body.on_sale);
                        update.on_sale = on_sale;
                        update.description = req.body.description;

                        update.save(function(err){    //save the updated product
                            if(err){
                                return res.json({status:500,error:err});
                            }
                            else{
                                return res.json({success:true,product:update});
                            }
                        });
                    }
                });
            }
        });
    }
});

router.get('/deleteProduct',function(req,res,next){
    if(req.query!=null){
        var product_id = parseInt(req.query.product_id);
        products.remove({product_id:product_id},function(err){
            if(err){
                return res.json({status:500,error:err});
            }
            else{
                return res.json({success:true,message:"product with product_id: "+req.query.product_id+" is deleted"});
            }
        });
    }
});

module.exports = router;
