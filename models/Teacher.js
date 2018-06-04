var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/BarrageClass');

var schema = new mongoose.Schema({
    account: String,
    password: String,
    avatar: String,
    salt:String
});

module.exports = mongoose.model('Teacher',schema);
