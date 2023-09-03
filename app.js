const createError = require('http-errors');
const http = require('http');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose')
mongoose.set('strictQuery', false);
const expressSession = require('express-session');
const passport = require('passport');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');  
const postsRouter = require('./routes/posts');  
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');


var app = express();

//begain

app.use(expressSession({
  resave:false,
  saveUninitialized:false,
  secret: "blablabla"
}))

app.use(fileUpload({
  useTempFiles: true
}))



app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());



// view engine setup



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/posts', postsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;


