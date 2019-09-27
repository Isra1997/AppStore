//Basic app sessions
var express=require('express');
var parser=require('body-parser');
const formidable=require('formidable');
var path = require('path');
var fs=require('fs');
app=express();
var filecounter=0;
var db=[];

//Database packages
var MongoClient=require('mongoose');
var execfilemodel=require('./src/execfileschema');
var initDb=require('./src/database').initDb;
var getDb=require('./src/database').getDb;
var userSchema=require('./src/userSchema');

//validation packages
var bcrypt=require('bcrypt');
var saltRounds=10;


//Authentication package
var session=require('express-session');
var passport=require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Mongostore = require('connect-mongodb-session')(session);

passport.use(new LocalStrategy({usernameField:'Username',passwordField:'Password'},
function(username,password,done){
    console.log('in');
    console.log(username);
    console.log(password);
    return done(null,'hsakhsk');
}));

//set the view engine to be ejs
app.set('view engine', 'ejs');


//creating a public directory to access specfic resourses
var publicDir=require('path').join(__dirname,'/Public');
app.use(express.static(publicDir));

app.use(parser.urlencoded({  extended : false }));
app.use(parser.json());


//creating sessions in our backend
var store=new Mongostore({
    uri: 'mongodb://localhost:27017/execfiles',
    collection: 'mySessions'
},(err)=>{
    console.log(err);
})

store.on('err',()=>{
    console.log(err);
})

// using express sessions
app.use(session({
    secret: 'The coding queen',
    resave: false,
    store:store,
    saveUninitialized: true
}));

// using passport for user authentication
app.use(passport.initialize());
app.use(passport.session());



//upload page route
app.get('/',authenticationMiddleware(),function(req,res){
    console.log(req.user);
    console.log(req.isAuthenticated())
    res.render('UploadPage/uploadpage');
});

//upload page route
app.post('/add',function(req,res){
   var form=new formidable();
  filecounter++;
   form.parse(req,function(err,fields,files){
       insertFile(fields.NameInput,fields.VendorName,files.execfilepath.size,0,filecounter+files.logofilepath.name,filecounter+'.exec',fields.catgory);
   });

   form.on('fileBegin',function(name,file){
    if(name ==='execfilepath'){
        fs.rename(file.name,filecounter+'.exec',function(err){
            if (err) throw err;
            console.log('File Remamed!')
        })
        file.path=  __dirname + '/Applications/' + filecounter+'.exec';
    }
    if(name ==='logofilepath' && !(name ==='execfilepath')){
        file.path=  __dirname + '/Public/ImagesUploaded/' + filecounter+file.name;
    }
   });

   res.render('UploadPage/successpage');
});     

//home page route
app.get('/home',function(req,res){
    queryAllFiles('execfiles').then((data)=>{
        res.render('Homepage/homepage.ejs',{app:data});
    });
});


//login page route
app.get('/login',function(req,res){
    res.render('Login/loginpage.ejs')
});

//authinticate user
// app.post('/login', passport.authenticate('local',{ 
//     successRedirect:'/',
//     failureRedirect: '/home'}));

//download route
app.get('/download/:filepath/:id/:numD',function(req,res){
    fs.readdir(__dirname+'/Applications',function(err,fileApp){
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }  
        //access filepath
        var filePath=__dirname+'/Applications/'+req.params.filepath;
        //increment number of downloads
        var newD=parseInt(req.params.numD)+1;
        updateNumberOfDownloads(req.params.id,newD);
        // db[req.params.id].numD++;
        res.download(filePath);
    });
});

//description route
app.get('/card/:id',function(req,res){
    queryId(req.params.id).then((data)=>{
        res.render('DescriptionPage/desciptionpage.ejs',{CardDetails:data});
    })
});

//Games Catgory
app.get('/games',function(req,res){
    queryCatgory('Games').then((data)=>{
        res.render('Homepage/homepage.ejs',{app:data});
    })
});

//Mac Os catgory
app.get('/MacOs',function(req,res){
    queryCatgory('Mac Os Apps').then((data)=>{
        res.render('Homepage/homepage.ejs',{app:data});
    })
});

//Microsoft Office catgory
app.get('/MicrosoftOffice',function(req,res){
    queryCatgory('Microsoft Office').then((data)=>{
        // console.log(data);
        res.render('Homepage/homepage.ejs',{app:data});
    })
});



//Register Page route
app.get("/regeister",function(req,res){
    res.render('Login/RegisterPage.ejs');
})

//registering a user in the database
app.post('/insertuser',function(req,res){
    var form=new formidable();
    form.parse(req, async function(err,fields){
        bcrypt.hash(fields.pwd, saltRounds, async function(err, hash) {
            await insertUser(fields.UsernameInput,hash,fields.EmailInput);
            userSchema.findOne({Username:fields.UsernameInput}).then((data)=>{
                var username=data.Username;
                console.log(username);
                req.login(username,function(err){
                    res.redirect('/');
                })
            }).catch((err)=>{
                throw err;
            })
         
          });
    })
})

passport.serializeUser(function(username, done) {
    done(null, username);
  });
passport.deserializeUser(function(username, done) {
        done(null, username);

});

// inserting a comment in the list
app.post('/insertcomment/:id',function(req,res){
    console.log('insert');
    form.parse(req,function(err,fields){
        insertComment(req.params.id, fields.cmt);
    })  
    queryAllFiles('execfiles').then((data)=>{
        res.render('Homepage/homepage.ejs',{app:data});
    });
})

                      // database functions

//file insertion
function insertFile(name,VendorName,size,numD,Imagepath,Filepath,Category){
    let file= new execfilemodel({
        Name:name,
        VendorName:VendorName,
        size:size,
        numD:numD,
        Imagepath:Imagepath,
        Filepath:Filepath,
        Comments:[],
        Category:Category
    });
    file.save().then(doc =>{
        console.log('record inserted');
    }).catch( doc =>{
        console.log(err)
    })      
}

//query all files
function queryAllFiles(){  
   return execfilemodel.find({});
}

//query a specific Category
function queryCatgory(Catgory){
    return execfilemodel.find({Category:Catgory});
}

//query specific id
function queryId(id){
    return execfilemodel.find({_id:id});
}


function queryLogin(username){
    console.log('login query')
    return userSchema.find({Username: username});
}

//update the number of the downloads
async function updateNumberOfDownloads(id,newnum){
if(MongoClient.Types.ObjectId.isValid(id)){
    let doc= await execfilemodel.findOneAndUpdate({_id:id},{numD:newnum},{new:true,
        useFindAndModify:false});
    doc= await execfilemodel.findOne({_id:id});
    console.log(doc.numD);
}
else{
    console.log('please enter a vaild Id');
}
}

//insert comments
function insertComment(id,Comment){
    execfilemodel.findByIdAndUpdate(id,
        {$push: {Comments: Comment}},
        {safe: true, upsert: true},
        function(err, doc) {
            if(err){
            console.log(err);
            }else{
            console.log('Comment inserted Successfilly!')
            }
        }
    );
}

//user insertion
function insertUser(username,password,email){
    let user=new userSchema({
        Username:username,
        Email:email,
        Password:password
    })

    return user.save();
}

function authenticationMiddleware () {  
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()) return next();
	    res.redirect('/login')
	}
}

//intializing the database connection and listing of the app's port (3000)
initDb(function(err){
    app.listen(3000,function(err){
        if(err){
            throw err;
        }
        console.log('application and database are up and running!');
    })
})









