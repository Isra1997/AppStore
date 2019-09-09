let mongoose=require('mongoose')

let execFileSchema=new mongoose.Schema({
    Name: String,
    VendorName:String,
    size:Number,
    numD:Number,
    Imagepath:String,
    Filepath: String,
    Comments: String,
    Category:String
})

module.exports= mongoose.model('execfiles',execFileSchema)