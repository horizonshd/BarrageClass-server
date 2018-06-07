var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BarrageClass');
var ObjectId = mongoose.Schema.Types.ObjectId;

var schema = new mongoose.Schema({
    studentid:ObjectId,
    paperid:ObjectId,
    courseid:ObjectId,
    answerlist:[String],
    correctlist:[String]
});

module.exports = mongoose.model('PaperSubmitted',schema);
