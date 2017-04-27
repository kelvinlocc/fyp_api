var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

 var url = 'mongodb://localhost:27017/EShop';
//var url = 'mongodb://admin:admin@ds121171.mlab.com:21171/eshop';

mongoose.connect(url);
var db = mongoose.connection;


var index = require('./routes/index');
var shops = require('./routes/shopRouter');
var users = require('./routes/sysUserRouter');
var products = require('./routes/productRouter');
var posters = require('./routes/posterRouter');
var orders = require('./routes/orderRouter');
var orderItems = require('./routes/orderItemRouter');
var comments = require('./routes/commentRouter');
var coupons = require('./routes/couponRouter');
var news = require('./routes/newsRouter');
var userProfile = require('./routes/userProfileRouter');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html',require('ejs').renderFile);
app.set('view engine', 'html');
app.use(function(req, res, next) {  //allow access from other domain
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.set('superSecret','EShopSecret');
app.set('user_id','');
app.set('token','');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/', index);
app.use('/users', users);
app.use('/shops', shops);
app.use('/products',products);
app.use('/posters',posters);
app.use('/orders',orders);
app.use('/orderItems',orderItems);
app.use('/comments',comments);
app.use('/coupons',coupons);
app.use('/news',news);
app.use('/userProfiles',userProfile);

app.get('/login',function(req,res,next){
    res.sendFile('login.html');
});

app.get('/api_list',function(req,res,next){
    res.sendFile('apis.html');
});

app.get('/getUserId',function(req,res,next){
    var userId = req.app.get('user_id');
    return res.json({success:true,user_id:userId});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json(err);
});

module.exports = app;
