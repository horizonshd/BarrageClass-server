var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BarrageClass');
var ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
    papername: String,
    teacherid:ObjectId,
    questionidlist:[ObjectId],
    answerlist:[String]
});

module.exports = mongoose.model('Paper',schema);
