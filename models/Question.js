var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BarrageClass');
var ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
    teacherid:ObjectId,
    description: String,
    optiona: String,
    optionb: String,
    optionc: String,
    optiond: String,
    answer:{type:String,enum:['A','B','C','D']}
});

module.exports = mongoose.model('Question',schema);
