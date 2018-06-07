
var socketio = require('socket.io');
var io;
var redisAdapter = require('socket.io-redis');

//save  id of each socket
// {"name-xxx":"id-xxx","name-yyy":"id-yyy"}
//pcSID,teacherSID,studentSID
var pcSID = {};
var teacherSID = {};
var studentSID = {};


var mongoose = require('mongoose');
var Paper  = require('../models/Paper');
var Question = require('../models/Question');



//save name of each socket
//{"id-xxx":"name-xxx","id-yyy","name-yyy"}
//pcName,teacherName,studentName
var pcName = {};
var teacherName = {};
var studentName = {};

//save classroom's name of each socket
//{"id-xxx":"name-yyy","id-yyy":"name-yyy"}
var classRoom = {};

exports.listen = function(server){
    io = socketio(server,{  pingInterval: 86400000,pingTimeout: 5000,});
    io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
    //io.set('log level', 1);
    io.on('connection',function(socket){
        console.log("[event-----a connection from a new socket]");
        userLogin(socket,classRoom,pcSID,teacherSID,studentSID,pcName,teacherName,studentName);
        getInClassroom(socket,classRoom,pcSID,pcName,teacherName,studentName);
        getOutClassroom(socket,classRoom,pcSID,pcName,teacherName,studentName);
        offline(socket,classRoom,pcSID,teacherSID,studentSID,pcName,teacherName,studentName);
        handleMessageBroadcast(socket,classRoom,teacherName,studentName);
        handleOnlineList(socket,classRoom,pcName,teacherName,studentName);
        handleDistributePapaer(socket,classRoom);
        handleSubmitPaper(socket);
        socket.on('heartbeat',function(){
            console.log('[HEART-BEAT]'+socket.id);
        });
    });//io.sockets.on()

}//end


//////////
// 1 ---服务器端处理逻辑
//////////


//1.1        login by teacher / student / pc
function userLogin(socket,classRoom,pcSID,teacherSID,studentSID,pcName,teacherName,studentName){
    socket.on('pc_login',function(name){
            if(pcSID[name]){//another socket with the same name already online
                if(classRoom[pcSID[name]]){//in a room
                    socket.to(classRoom[pcSID[name]]).emit('mention','[PC-'+pcName[pcSID[name]]+']离开教室');
                    io.of('/').adapter.remoteLeave(pcSID[name],classRoom[pcSID[name]]);
                }
                //force offline
                io.to(pcSID[name]).emit('forceoffline');
                delete classRoom[pcSID[name]];
                delete pcName[pcSID[name]];
                delete pcSID[name];
            }
            console.log("[event-----pc_login]");
            console.log("[pc]:"+name);
            pcName[socket.id] = name;
            pcSID[name]  = socket.id;

            setTimeout(function(){socket.emit('pc-message','成功连接至弹幕服务器');},1000);

            //add pc to the room if teacher has getin
            if(teacherSID[name]){//teacher with this name has triggered event 'teacher_login' when pc triggers event 'pc_login'
                if(classRoom[teacherSID[name]]){// teacher with this name has trigger edevent 'teacher_login' when pc triggers event 'pc_login'
                    socket.join(classRoom[teacherSID[name]]) ;
                    classRoom[socket.id] = classRoom[teacherSID[name]];
                    console.log("[pc]:"+name+" getin [classroom]:"+ classRoom[teacherSID[name]]);
                    socket.to(classRoom[teacherSID[name]]).emit('mention','[pc-'+name+']进入教室');
                }
            }

    });
    socket.on('teacher_login',function(name){
        if(teacherSID[name]){//another socket with the same name already online
            if(classRoom[teacherSID[name]]){//in a room
                        //1.emit 'dismiss' event to students in the classroom
                        socket.to(classRoom[teacherSID[name]]).emit('dismiss');
                        //2.remove studens pc from classroom and teacher self
                        io.in(classRoom[teacherSID[name]]).clients((err,sids)=>{
                            for(var sid in sids){
                                console.log('[dismiss-]'+sids[sid]);
                                io.of('/').adapter.remoteLeave(sids[sid],classRoom[teacherSID[name]]);
                                classRoom[sids[sid]] = false;
                            }
                        });
            }
            //force offline
            io.to(teacherSID[name]).emit('forceoffline');
            delete classRoom[teacherSID[name]];
            delete teacherName[teacherSID[name]];
            delete teacherSID[name];
        }
        console.log("[event-----teacher_login]");
        console.log("[teacher]:"+name);
        teacherName[socket.id] = name;
        teacherSID[name] = socket.id;

    });
        socket.on('student_login',function(name){
            if(studentSID[name]){//another socket with the same name already online
                if(classRoom[studentSID[name]]){// in a room
                    socket.to(classRoom[studentSID[name]]).emit('mention','['+studentName[studentSID[name]]+']离开教室');
                    io.of('/').adapter.remoteLeave(studentSID[name],classRoom[studentSID[name]]);
                }
                //force offline
                io.to(studentSID[name]).emit('forceoffline');
                delete classRoom[studentSID[name]];
                delete studentName[studentSID[name]];
                delete studentSID[name];
            }
            console.log("[event-----student_login]");
            console.log("[student]:"+name);
            studentName[socket.id] = name;
            studentSID[name] = socket.id;
    });
}//end

//1.2        get in classroom by  teacher / student / pc
function getInClassroom(socket,classRoom,pcSID,pcName,teacherName,studentName){

    socket.on('pc_getin',function(roomName){//pc will never emit this event
        console.log("[event-----pc_getin_classroom]:"+roomName);
        classRoom[socket.id] = roomName;
        socket.join(roomName);
        console.log("[pc]:"+pcName[socket.id]+" getin [classroom]:"+ roomName);
    });
    socket.on('teacher_getin',function(roomName){
        console.log("[event-----teacher_getin_classroom]:"+roomName);
        classRoom[socket.id] = roomName;
        socket.join(roomName);
        console.log("[teacher]:"+teacherName[socket.id]+" getin [classroom]:"+ roomName);
        socket.to(roomName).emit('mention','['+teacherName[socket.id]+']进入教室');
       // console.log("getin+"+socket.io);

        // let pc join the same room whic teacher is going to join if pc has triggered event 'pc_login'
        if(pcSID[teacherName[socket.id]]){
            io.of('/').adapter.remoteJoin(pcSID[teacherName[socket.id]],roomName);
            classRoom[pcSID[teacherName[socket.id]]] = roomName;
            console.log("[pc]:"+teacherName[socket.id]+" getin [classroom]:"+ roomName);
            socket.to(roomName).emit('mention','[pc-'+teacherName[socket.id]+']进入教室');
        }

    });
    socket.on('student_getin',function(roomName){
        console.log("[event-----student_getin_classroom]:"+roomName);
        classRoom[socket.id] = roomName;
        socket.join(roomName);
        console.log("[student]:"+studentName[socket.id]+" getin [classroom]:"+ roomName);
        socket.to(roomName).emit('mention','['+studentName[socket.id]+']进入教室');
    });
}//end

//1.3        get out classroom by pc / teacher / student
function getOutClassroom(socket,classRoom,pcSID,pcName,teacherName,studentName){
    socket.on('pc_getout',function(){//pc will never emit this event
        console.log("[event-----pc_getout_classroom]:"+classRoom[socket.id]);
        socket.to(classRoom[socket.id]).emit('mention','[PC-'+pcName[socket.id]+']离开教室');
        socket.leave(classRoom[socket.id]);
        classRoom[socket.id] = false;//socket not in a room
    });
    socket.on('teacher_getout',function(){
        console.log("[event-----teacher_getout_classroom]:"+classRoom[socket.id]);
        //1.emit 'dismiss' event to students in the classroom
        socket.to(classRoom[socket.id]).emit('dismiss');
        //2.remove pc from classroom(has been included by setp 3)
        // if(pcSID[teacherName[socket.id]]){//pc has triggered event  'pc_login'
        //     if(classRoom[pcSID[teacherName[socket.id]]]){//pc in classroom
        //             io.of('/').adapter.remoteLeave(pcSID[teacherName[socket.id]],classRoom[socket.id]);
        //             classRoom[pcSID[teacherName[socket.id]]] = false;//not in room
        //     }
        // }
        //3.remove studens pc from classroom and teacher self
        io.in(classRoom[socket.id]).clients((err,sids)=>{
            for(var sid in sids){
                console.log('[dismiss-]'+sids[sid]);
               io.of('/').adapter.remoteLeave(sids[sid],classRoom[socket.id]);
               classRoom[sids[sid]] = false;//socket not in a room
            }
        });
    });
    socket.on('student_getout',function(){
        console.log("[event-----student_getout_classroom]:"+classRoom[socket.id]);
        socket.to(classRoom[socket.id]).emit('mention','['+studentName[socket.id]+']离开教室');
        socket.leave(classRoom[socket.id]);
        classRoom[socket.id] = false;//socket not in a room
    });
}//end

//1.4 disconnect socket by pc / teacher / student
function offline(socket,classRoom,pcSID,teacherSID,studentSID,pcName,teacherName,studentName){
    socket.on('disconnect',function(){
        if(pcName[socket.id]){//pc disconnect
            if(classRoom[socket.id]){//in classroom
                console.log("[event-----pc_offline]:"+pcName[socket.id]);
                socket.to(classRoom[socket.id]).emit('mention','[pc-'+pcName[socket.id]+']已离线');
                socket.leave(classRoom[socket.id]);
                delete pcSID[pcName[socket.id]];
                delete pcName[socket.id];
                delete classRoom[socket.id];
            }else{// not inclassroom
                console.log("[event-----pc_offline]:"+pcName[socket.id]);
                delete pcSID[pcName[socket.id]];
                delete pcName[socket.id];
                delete classRoom[socket.id];
            }
        }else if(teacherName[socket.id]){//teacher disconnect
            if(classRoom[socket.id]){
                console.log("[event-----teacher_offline]:"+teacherName[socket.id]);
                //1.emit 'dismiss' event to students in the classroom
                socket.to(classRoom[socket.id]).emit('dismiss');
                //2.remove studens pc from classroom and teacher self
                io.in(classRoom[socket.id]).clients((err,sids)=>{
                    for(var sid in sids){
                        console.log('[dismiss-]'+sids[sid]);
                        io.of('/').adapter.remoteLeave(sids[sid],classRoom[socket.id]);
                        classRoom[sids[sid]] = false;
                    }
                });
                //3. delete data about teacher
                delete teacherSID[teacherName[socket.id]];
                delete teacherName[socket.id];
                delete classRoom[socket.id];
            }else{
                console.log("[event-----teacher_offline]:"+teacherName[socket.id]);
                delete teacherSID[teacherName[socket.id]];
                delete teacherName[socket.id];
                delete classRoom[socket.id];
            }
        }else if(studentName[socket.id]){// student disconnect
            if(classRoom[socket.id]){// in classroom
                console.log("[event-----student_offline]:"+studentName[socket.id]);
                socket.to(classRoom[socket.id]).emit('mention','['+studentName[socket.id]+']已离线');
                socket.leave(classRoom[socket.id]);
                delete studentSID[studentName[socket.id]];
                delete studentName[socket.id];
                delete classRoom[socket.id];
            }else{
                console.log("[event-----student_offline]:"+studentName[socket.id]);
                delete studentSID[studentName[socket.id]];
                delete studentName[socket.id];
                delete classRoom[socket.id];
            }
        }
    });
}


//1.5        handle message broadcast
function handleMessageBroadcast(socket,classRoom,teacherName,studentName){
    socket.on('send-message',function(data){
        console.log("[event-----send-message]");
        console.log("message to room:"+classRoom[socket.id]);
        if(teacherName[socket.id]){//message from reacher
                socket.to(classRoom[socket.id]).emit('send-message',{"from":teacherName[socket.id],"text":data});
                socket.to(classRoom[socket.id]).emit('pc-message',data);//not handled very elegent
        }else if(studentName[socket.id]){//message from student
                socket.to(classRoom[socket.id]).emit('send-message',{"from":studentName[socket.id],"text":data});
                socket.to(classRoom[socket.id]).emit('pc-message',data);//not handled very elegent
        }

    });
}//end

//1.6       handle  request for online list
function handleOnlineList(socket,classRoom,pcName,teacherName,studentName){
    socket.on('list',(fn)=>{
        console.log("[event-----online-list]");
        console.log('[from]'+socket.id);
        io.in(classRoom[socket.id]).clients((err,sids)=>{
            var list = [];
            for(var sid in sids){
                console.log('[socket-i]'+sids[sid]);

                if(studentName[sids[sid]]){
                    var user = new Object();
                    user.name = studentName[sids[sid]];
                    list.push(user);
                }else if(teacherName[sids[sid]]){
                    var user = new Object();
                    user.name = teacherName[sids[sid]];
                    list.push(user);
                }else if(pcName[sids[sid]]){
                    var user = new Object();
                    user.name = "PC-"+pcName[sids[sid]];
                    list.push(user);
                }

            }//for
            // var json = JSON.stringify(students);
            fn(list);
        });

    });
}//end


// 1.7        handle request for distribute_paper from teacher
function handleDistributePapaer(socket,classRoom){
    socket.on('pre_distribute_paper',(teacherid,fn)=>{
        var teacherid =  mongoose.Types.ObjectId(teacherid);
        Paper.find({'teacherid':teacherid},function(err,paperlist){
            if(err){
                console.log('[ERR-----pre-distrubuute-paper]');
            }else{
                fn(paperlist);
            }
        });
    });//socket.on('pre_distribute_paper')

    socket.on('distribute_paper',function(paperid,time){
        var paperid = mongoose.Types.ObjectId(paperid);

        Paper.findOne({'_id':paperid},function(err,paper){
        if(err) {
            console.log('[ERR-----distrubuute-paper]');
        }else{
                var qlist = new Array(paper.questionidlist.length+1);
                for(var i =0,j=0;i<paper.questionidlist.length;i++){
                    (function(i){

                                            Question.findOne({'_id':paper.questionidlist[i]},function(err,question){
                                            if(err) return next(err);

                                            qlist[i] = new Object();
                                            qlist[i].questionid = question._id;
                                            qlist[i].description = question.description;
                                            qlist[i].optiona = question.optiona;
                                            qlist[i].optionb = question.optionb;
                                            qlist[i].optionc = question.optionc;
                                            qlist[i].optiond = question.optiond;
                                            qlist[i].answer = question.answer;

                                            for(var j=0;j<paper.questionidlist.length;j++){
                                                if(!qlist[j]) break;
                                                if(j == paper.questionidlist.length-1){//every qlist[i]  filled
                                                        qlist[paper.questionidlist.length] = new Object();
                                                        qlist[paper.questionidlist.length].paperid = paper._id;
                                                        qlist[paper.questionidlist.length].papername = paper.papername;
                                                         socket.to(classRoom[socket.id]).emit('distribute_paper',qlist);
                                                }
                                            }//for
                                        });//question.findone()

                    })(i);

            }//for
        }
});//paper.findOne

    });//socket.on('distribute_paper')
}//end

// 1.8        handle request for submit_paper from student
function handleSubmitPaper(socket){
    socket.on('submit_paper',function(_answerSubmitList,_studentID,_paperID,_courseID){
        var answerSubmitList = _answerSubmitList;
        var studentID = mongoose.Types.ObjectId(_studentID);
        var paperID = mongoose.Types.ObjectId(_paperID);
        var courseID = mongoose.Types.ObjectId(_courseID);

        console.log("[answer-length]"+answerSubmitList.length);
        for(var i=0;i<answerSubmitList.length;i++){
            console.log('[answer]'+answerSubmitList[i]);
        }
    });
}//end
