var express=require('express');
var parser=require('body-parser');
const formidable=require('formidable');
var path = require('path');
var fs=require('fs');
app=express();
var filecounter=0;
var db=[];
var MongoClient=require('mongoose');
var execfilemodel=require('./src/execfileschema');
var initDb=require('./src/database').initDb;
var getDb=require('./src/database').getDb;
var userSchema=require('./src/userSchema');

//creating a public directory to access specfic resourses
var publicDir=require('path').join(__dirname,'/Public');
app.use(express.static(publicDir));


//set the view engine to be ejs
app.set('view engine', 'ejs');

//upload page route
app.get('/',function(req,res){
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
app.post('/auth',function(req,res){
    //authticate username and password
})

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
app.get('/description',function(req,res){
    res.render('DescriptionPage/desciptionpage.ejs',{Imagepath:"/ImagesUploaded/download(1).png",appname: "Micrsoft Office",VendorNames:"Micrsoft",FileSize:10})
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
    queryCatgory('Microsoft Offices').then((data)=>{
        res.render('Homepage/homepage.ejs',{app:data});
    })
});

//Register Page route
app.get("/regeister",function(req,res){
    res.render('Login/RegisterPage.ejs');
})

app.post('/insertuser',function(req,res){
    var form=new formidable();
    form.parse(req,function(err,fields){
        insertUser(fields.UsernameInput,fields.pwd).then(()=>{
            res.render('Login/SuccessRegister.ejs')
        })
    })
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
        Comments:"",
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

//query a specific string
function queryCatgory(Catgory){
    return execfilemodel.find({Category:Catgory});
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

//user insertion
function insertUser(username,password){
    let user=new userSchema({
        Username:username,
        Password:password
    })

    return user.save();
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






