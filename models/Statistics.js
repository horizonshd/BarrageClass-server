var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BarrageClass');
var ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
    paperid:ObjectId,
    courseid:ObjectId,
    detaildata:[{optiona:Number,optionb:Number,optionc:Number,optiond:Number}]
});

module.exports = mongoose.model('Statistics',schema);
