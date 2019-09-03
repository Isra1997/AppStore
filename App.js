var express=require('express');
var parser=require('body-parser');
const formidable=require('formidable');
var path = require('path');
var fs=require('fs');
app=express();
var filecounter=0;
var names=[];
var VendorNames=[];

//creating a public directory to access specfic resourses
var publicDir=require('path').join(__dirname,'/Public');
app.use(express.static(publicDir));


//set the view engine to be ejs
app.set('view engine', 'ejs');

// home page route
app.get('/',function(req,res){
    res.render('UploadPage/uploadpage',{messageexec:'',messagelogo:'',logopath:'',VendorName:''});
});

//upload page route
app.post('/add',function(req,res){
   var form=new formidable();
   
  filecounter++;
   form.parse(req,function(err,fields,files){
       names.push(fields.NameInput);
       VendorNames.push(fields.VendorName);
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
    fs.readdir(publicDir+'/ImagesUploaded',function(err,files){
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        res.render('Homepage/homepage.ejs',{fileImageArray:files,NameArray:names,VendorName:VendorNames});
    });
    
});

//description route
app.get('/description',function(req,res){
    res.end("Hello Description :)");
});

//download route
app.post('/download/:todownloadurl',function(req,res){
    fs.readdir(__dirname+'/Applications',function(err,fileApp){
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }  
        var filePath=__dirname+'/Applications/'+fileApp[req.params.todownloadurl];
        res.download(filePath);
    });
});



app.listen(3000);




