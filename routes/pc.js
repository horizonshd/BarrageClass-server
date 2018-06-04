var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();

var  Teacher = require('../models/Teacher');

/* GET listing. */

router.get('/login',function(req,res,next){
    var account = req.query.account;
    var password = req.query.password;
     var salt="";


    // get salt value for account
    Teacher.findOne({'account':account},'salt',function(err,doc){
        if(doc){
            salt = doc.salt;

            bcrypt.hash(password,salt,function(err,hash){
                if(err) return next(err);
                password = hash;

            Teacher.findOne({'account':account,'password':password},function(err,doc){
                if(doc){
                    res.send("success");
                }else{
                    res.send("failed");
                    if(err){
                        return next(err);
                    }
                }
            });

            });

        }else{
                res.send("failed");
            if(err){
                return next(err);
            }
        }
    });
});//end

module.exports = router;
