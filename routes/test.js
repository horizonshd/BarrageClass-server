var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var  Student = require('../models/Student');

/* GET home page. */
router.get('/', function(req, res, next) {
  Student.findOne({'_id':mongoose.Types.ObjectId('5ae9613e3f7f020a4d4f6487')},'account',function(err,doc){
    var id='';
    id = doc._id;
    console.log(typeof id);
    console.log(id);
    console.log(doc);
  });
});

module.exports = router;
