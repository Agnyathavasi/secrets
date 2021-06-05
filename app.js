
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const port = 9910;
const ejs = require('ejs')
const alert = require('alert')
const passport = require('passport');
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose');

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: 'Our little secret.',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('MongoDB url from mongoshell',{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
mongoose.connection.once('open',function(){
console.log("Connection has been made");
});

const userSchema = new mongoose.Schema ({
    fname: String,
    lname: String,
    username: String,
    dob: String,
    password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const secretsScema = new mongoose.Schema({
    secret: String,
    user: String
});

const SecretUser = new mongoose.model("SecretUser", secretsScema);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/style.css')
})

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/LogIn/login.html')
})

app.get('/logout', (req,res) => {
    req.logout();
    res.redirect('/')
})

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/Registering/register.html')
})

app.get('/login.css', (req, res) => {
    res.sendFile(__dirname + '/LogIn/login.css')
})

app.get('/register.css', (req, res) => {
    res.sendFile(__dirname + '/Registering/register.css')
})

app.get('/userProfile.css', (req, res) => {
    res.sendFile(__dirname + '/userProfile.css')
})

app.get('/registeruser.css', (req,res) => {
    res.sendFile(__dirname + '/Registering/registeruser.css')
})

app.get('/registeruser', (req,res) => {
    if(req.isAuthenticated()){

        SecretUser.find({},function(err, found){
            if(err){
                console.log(err)
            } else{
                res.render('registeruser', {
                    retrievedUser: app.get('currentUser'),
                    retrivedSecrets: found});
            }
        })
        
    } else{
        res.redirect('/login');
    }
})

app.post('/secretsubmit', function(req,res)  {
    var secretuser = req.body.secretofuser;
    var userName = app.get('currentUser').username;
    const newSecret = new SecretUser({
        secret: secretuser,
        user: userName
    })

    newSecret.save(function(err){
        if(err){
            console.log(err)
        } else{
            res.redirect('registeruser');
        }
    })
})

app.post('/signup', function(req,res) {
    var birthdate = req.body.birthday_day + " " + req.body.birthday_month + " " + req.body.birthday_year;
    User.register({fname: req.body.firstName,
                    lname: req.body.lastName,
                    username: req.body.username,
                    dob: birthdate} , req.body.password, function(err, user){
                        if(err) {
                            console.log(err)
                            res.redirect('/register')
                        } else {
                            passport.authenticate("local")(req ,res ,function(){
                                res.redirect('/registeruser')
                                app.set('currentUser', user);
                            })
                        }
                    })
})

app.post('/submit', function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function(){
                res.redirect('/registeruser');
                User.findOne({username: user.username}, function(err, foundUser){
                    if(err){
                        console.log(err);
                    }
                    else{
                        app.set('currentUser', foundUser);
                    }
                })
            })
        }
    })
})

app.get('/userAccount', (req,res) => {
    SecretUser.find({"user": app.get('currentUser').username},function(err, found){
        if(err){
            console.log(err)
        } else{
            res.render('userProfile', {
                retrievedUser: app.get('currentUser'),
                retrivedSecrets: found});
        }
    })
})

app.get('/goback', (req,res) => {
    res.redirect('registeruser')
})

app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
