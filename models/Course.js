var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BarrageClass');
var ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
     teacherid:ObjectId,
    coursename:String,
    isactive: {type:Boolean,default:false}
});

module.exports = mongoose.model('Course',schema);
