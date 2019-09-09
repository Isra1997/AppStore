const client = require('mongoose');
const assert= require('assert');
let _db;
const url='mongodb://127.0.0.1:27017/execfiles';

function initDb(callback){
    if(_db){
        console.warn("Connection Refused!")
        return callback(null, _db);
    }
    client.connect(url,{useNewUrlParser:true},connected);

    function connected(err,db){
        if(err){
            console.log(err);
            return callback(null,err);
        }
        console.log('connected to the database!')
        _db=db
        return callback(null,_db)
    }
}

function getDb(){
    assert.ok(_db,"Database not intialized please call initdb first!");
    return _db;
}


module.exports={
    initDb,
    getDb
}