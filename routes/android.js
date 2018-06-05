var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');

var  Student = require('../models/Student');
var  Teacher = require('../models/Teacher');
var Course = require('../models/Course');
var Question = require('../models/Question');
var Paper  = require('../models/Paper');


//============================================================
//
//                                  STUDENT
//
//============================================================

// ===== student register =====
router.post('/student/register', function(req, res, next) {
    var account = req.body.account;
    var password = req.body.password;
    var saltValue="";

    Student.findOne({'account':account},function(err,doc){
        if(doc){//account already existed
            res.setHeader('Content-Type','application/json');
            res.json({status:'failed'});
        }else{
            if(err){
                 res.setHeader('Content-Type','application/json');
                res.json({status:'failed'});
                return next(err);
            }else{
                        bcrypt.genSalt(12,function(err,salt){
                            if(err) return next(err);
                            saltValue = salt;
                            bcrypt.hash(password,saltValue,function(err,hash){
                                if(err) return next(err);
                                password = hash;

                        Student.create({
                            account:account,
                            password:password,
                            salt:saltValue
                        },function(err){
                            if(err){
                                res.setHeader('Content-Type','application/json');
                                res.json({status:'failed'});
                                return next(err);
                            }else{
                                res.setHeader('Content-Type','application/json');
                                res.json({status:'success'});
                            }
                        });

                            });
                        });

            }

        }
    });


});








// ===== student login =====
router.post('/student/login', function(req, res, next) {
     var account = req.body.account;
    var password = req.body.password;
    var salt="";

    // get salt value for account
    Student.findOne({'account':account},'salt',function(err,doc){
        if(doc){
            salt = doc.salt;

            bcrypt.hash(password,salt,function(err,hash){
                if(err) return next(err);
                password = hash;

            Student.findOne({'account':account,'password':password},function(err,doc){
                if(doc){
                     res.setHeader('Content-Type','application/json');
                    res.json({status:'success',id:doc._id});
                }else{
                    res.setHeader('Content-Type','application/json');
                    res.json({status:'failed'});
                    if(err){
                        return next(err);
                    }
                }
            });
            });

        }else{
            res.setHeader('Content-Type','application/json');
            res.json({status:'failed'});
            if(err){
                return next(err);
            }
        }
    });
});



// ===== get activecourselist by student =====
router.post('/student/get-activecourselist',function(req,res,next){
    Course.find({isactive:true},function(err,courselist){
        if(err) return next(err);
        res.setHeader('Content-Type','application/json');
        res.json(courselist);
    });//course.find()
});//end






//============================================================
//
//                                  TEACHER
//
//============================================================

// ===== teacher register =====
router.post('/teacher/register', function(req, res, next) {
    var account = req.body.account;
    var password = req.body.password;
    var saltValue="";

    Teacher.findOne({'account':account},function(err,doc){
        if(doc){//account already existed
            res.setHeader('Content-Type','application/json');
            res.json({status:'failed'});
        }else{
            if(err){
                 res.setHeader('Content-Type','application/json');
                res.json({status:'failed'});
                return next(err);
            }else{
                        bcrypt.genSalt(12,function(err,salt){
                            if(err) return next(err);
                            saltValue = salt;
                            bcrypt.hash(password,saltValue,function(err,hash){
                                if(err) return next(err);
                                password = hash;

                        Teacher.create({
                            account:account,
                            password:password,
                            salt:saltValue
                        },function(err){
                            if(err){
                                res.setHeader('Content-Type','application/json');
                                res.json({status:'failed'});
                                return next(err);
                            }else{
                                res.setHeader('Content-Type','application/json');
                                res.json({status:'success'});
                            }
                        });

                            });
                        });

            }

        }
    });


});

// ===== teacher login =====
router.post('/teacher/login', function(req, res, next) {
     var account = req.body.account;
    var password = req.body.password;
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
                     res.setHeader('Content-Type','application/json');
                    res.json({status:'success',id:doc._id});
                }else{
                    res.setHeader('Content-Type','application/json');
                    res.json({status:'failed'});
                    if(err){
                        return next(err);
                    }
                }
            });

            });

        }else{
            res.setHeader('Content-Type','application/json');
            res.json({status:'failed'});
            if(err){
                return next(err);
            }
        }
    });


});


// ===== create a course by teacher =====
router.post('/teacher/create-course',function(req,res,next){
    var teacherid = req.body.teacherid;
    teacherid = mongoose.Types.ObjectId(teacherid);
    var coursename = req.body.coursename;

    Course.create({
        teacherid:teacherid,
        coursename:coursename
    },function(err){
        if(err) {
                    res.setHeader('Content-Type','application/json');
                    res.json({status:'failed'});
                    return next(err);
        }
        res.setHeader('Content-Type','application/json');
        res.json({status:'success'});
    });
});

// ===== get courselist by teacher =====
router.post('/teacher/get-courselist',function(req,res,next){
    var teacherid = req.body.teacherid;
    teacherid = mongoose.Types.ObjectId(teacherid);

     Course.find({'teacherid':teacherid},function(err,courselist){
        if(err) return next(err);

        res.setHeader('Content-Type','application/json');
        res.json(courselist);
     });

});


// ===== add question by teacher =====
router.post('/teacher/add-question-byhand', function(req, res, next) {
    var teacherid = req.body.teacherid;
    var description = req.body.description;
    var optiona = req.body.optiona;
    var optionb = req.body.optionb;
    var optionc = req.body.optionc;
    var optiond = req.body.optiond;
    var answer = req.body.answer;
    teacherid = mongoose.Types.ObjectId(teacherid);

    Question.create({
        teacherid:teacherid,
        description: description,
        optiona: optiona,
        optionb: optionb,
        optionc: optionc,
        optiond: optiond,
        answer:answer
    },function(err){
            if(err) {
                    res.setHeader('Content-Type','application/json');
                    res.json({status:'failed'});
                    return next(err);
                }
             res.setHeader('Content-Type','application/json');
            res.json({status:'success'});
    });


});


router.post('/teacher/add-question-fromfile', function(req, res, next) {

});


// ===== get questionlist by teacher =====
router.post('/teacher/get-questionlist',function(req,res,next){
    var teacherid = req.body.teacherid;
    teacherid = mongoose.Types.ObjectId(teacherid);

    Question.find({'teacherid':teacherid},function(err,questionlist){
        if(err) return next(err);

        //console.log('[QUESTIONLIST='+questionlist+']');

        //console.log(typeof questionlist);
        // var gettype=Object.prototype.toString;
        // console.log(gettype.call(questionlist[0]));

        res.setHeader('Content-Type','application/json');
        res.json(questionlist);
    });
});


// ===== create paper by teacher =====
router.post('/teacher/create-paper',function(req,res,next){
    var papername = req.body.papername;
    var teacherid = req.body.teacherid;
    teacherid = mongoose.Types.ObjectId(teacherid);

    var questionidlist = req.body.questionidlist;
    questionidlist = questionidlist.slice(1,-1);
    questionidlist = questionidlist.split(', ')


    var answerlist = new Array(questionidlist.length);




//=======================
    //console.log(questionidlist);
    for(var i=0,j=0;i<questionidlist.length;i++){
        (function(i){

                      Question.findOne({'_id':questionidlist[i]},'answer',function(err,q){
                        if(err) return next(err);
                        answerlist[i] = q.answer;

                        for(var j=0;j<questionidlist.length;j++){
                                if(!answerlist[j]) break;
                                if(j == questionidlist.length-1 ){//every answerlist[i] filled

                                        Paper.create({
                                            papername:papername,
                                            teacherid:teacherid,
                                            questionidlist:questionidlist,
                                            answerlist:answerlist
                                        },function(err){
                                            if(err) {
                                                //console.log('some err occured');
                                                res.setHeader('Content-Type','application/json');
                                                res.json({status:'failed'});
                                                return next(err);
                                            }
                                            res.setHeader('Content-Type','application/json');
                                             res.json({status:'success'});
                                            });//paper.create
                                }
                        }//for


                    }); //question.findone()

        })(i);

    }//for
//=========================


});//end



// ===== get paperlist by teacher =====
router.post('/teacher/get-paperlist',function(req,res,next){
    var teacherid = req.body.teacherid;
    teacherid = mongoose.Types.ObjectId(teacherid);

    //console.log(teacherid);

    Paper.find({'teacherid':teacherid},function(err,paperlist){
        if(err) return next(err);

        res.setHeader('Content-Type','application/json');
        res.json(paperlist);
    });


});

// ===== get paperdetail by teacher =====
router.post('/teacher/get-questionlist-in-paper',function(req,res,next){
    var teacherid = req.body.teacherid;
    teacherid = mongoose.Types.ObjectId(teacherid);
    var papername = req.body.papername;

    Paper.findOne({'teacherid':teacherid,'papername':papername},function(err,paper){
        if(err) return next(err);
        //console.log(paper.questionidlist)

        var qlist = new Array(paper.questionidlist.length);
        //console.log('[length='+paper.questionidlist.length+']');
        for(var i =0,j=0;i<paper.questionidlist.length;i++){
            (function(i){

                                    Question.findOne({'_id':paper.questionidlist[i]},function(err,question){
                                    if(err) return next(err);

                                    qlist[i] = new Object();
                                    qlist[i].description = question.description;
                                    qlist[i].optiona = question.optiona;
                                    qlist[i].optionb = question.optionb;
                                    qlist[i].optionc = question.optionc;
                                    qlist[i].optiond = question.optiond;
                                    qlist[i].answer = question.answer;

                                    for(var j=0;j<paper.questionidlist.length;j++){
                                        if(!qlist[j]) break;
                                        if(j == paper.questionidlist.length-1){//every qlist[i]  filled
                                                 res.setHeader('Content-Type','application/json');
                                                 res.json(qlist);
                                        }
                                    }//for
                                });//question.findone()

            })(i);

    }//for

});//paper.findOne


});//end



// ===== request for btnIn  from teacher =====
router.post('/teacher/course-in',function(req,res,next){
    var courseid = req.body.courseid;
    courseid = mongoose.Types.ObjectId(courseid);



    Course.update({'_id':courseid},{$set:{'isactive':true}},function(){
        res.setHeader('Content-Type','application/json');
        res.json({status:'success'});
    });//course.update

});//end



// ===== request for btnOut  from teacher =====
router.post('/teacher/course-out',function(req,res,next){
    var courseid = req.body.courseid;
    courseid = mongoose.Types.ObjectId(courseid);



    Course.update({'_id':courseid},{$set:{'isactive':false}},function(err){
        res.setHeader('Content-Type','application/json');
        res.json({status:'success'});
    });//course.update
});//end



module.exports = router;
