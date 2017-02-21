Future = Npm.require('fibers/future');

Fiber = Npm.require('fibers');

var fs = Npm.require('fs');

var spawn = Npm.require('child_process').spawn;

var SerialPort;
//var serialPort;

//Kadira.connect('brbe4m789sWzAZSkP', 'ea570338-55ad-429e-a2c6-7f2a2a60c795');

var reqPerSec = 2;
if (process.env.MRATE) {
    reqPerSec = parseFloat(process.env.MRATE);
    if( reqPerSec < 0 ) reqPerSec = 1;
}
var nCheck = 2;
if (process.env.NCHECK) {
    nCheck = parseInt(process.env.NCHECK);
    if( nCheck < 0 ) nCheck = 2;
}
var RateLimiter = Npm.require('limiter').RateLimiter;
var limit = parseFloat(1000/reqPerSec);
myLog("========== reqPerSec: "+ reqPerSec+" - "+"timeout: "+limit);
var limiter = new RateLimiter(1, limit); // (reqPerSec/2) message per 500ms at maximum, 1st message will only need 500ms to be sent, it's better than (reqPerSec, 1000ms)
//var limiter = new RateLimiter(reqPerSec/2, 500);

Notifier = new EventDDP("emohd");
kodiIP = null, kodiUser = null, kodiPassword=null, netatmoURL=null, netatmoUser=null, netatmoPassword=null;

var useBcast = (process.env.USE_BCAST=="yes");

var byteDelimParserState = {
    bufseq: new Buffer(8),
    j: 0 // This is for handling incomplete messages received from ZNP
};

var byteDelimiter = function(emitter, buffer) {
    myLog('----------');
    myLog(buffer);
    myLog('RAW: ' + buffer);
    myLog('----------');

    //var j = byteDelimParserState.lastIdx;
    for (var i = 0; i < buffer.length; i++) {
        if (buffer[i] == 0x44) { //New msg
            byteDelimParserState.j = 0;
            byteDelimParserState.bufseq[0] = buffer[i];
        }

        if (byteDelimParserState.bufseq[0] == 0x44) {
            byteDelimParserState.bufseq[byteDelimParserState.j] = buffer[i];

            if (byteDelimParserState.j == 7) { //Full length msg
                myLog('+++++++++++++++');
                myLog(byteDelimParserState.bufseq);
                myLog('FULL MSG: ' + byteDelimParserState.bufseq);
                myLog('+++++++++++++++');

                emitter.emit('data', byteDelimParserState.bufseq);
                //byteDelimParserState.lastIdx = 0;
                byteDelimParserState.j = 0;
                byteDelimParserState.bufseq = new Buffer(8);
            }
            else {
                byteDelimParserState.j++;
                //byteDelimParserState.lastIdx = j;
            }
        }
    }
}
/*
var byteDelimiter = function(emitter, buffer) {
    myLog('----------');
    myLog(buffer);
    myLog('RAW: ' + buffer);
    myLog('----------');
    for (var i = 0; i < buffer.length;) {
        if (buffer[i] == 0x44) {
            var bufseq = new Buffer(8);
            bufseq[0] = buffer[i];
            i++;
            for (var j = 1; j < 8; j++) {
                if (buffer[i] != 0x44)
                    bufseq[j] = buffer[i];
                else {
                    myLog('----------')
                    myLog('Bad Message: ' + bufseq);
                    myLog(bufseq)
                    myLog('----------')
                    break;
                }
                if (j == 7 || i >= buffer.length) {
                    emitter.emit('data', bufseq);
                    break;
                }
                else {
                    i++;
                }
            }
        }
        else {
            i++;
        }
    }
};
*/

function sendPermitJoin(validSec) {
    var buffer = new Buffer(8);
    buffer[0] = 0x44;
    buffer[1] = 0x31;
    buffer[2] = 0x32;
    buffer[3] = parseInt(validSec, 10);
    buffer[7] = 0x34; // 0x30 = '0': COMMAND_OFF, 0x31: COMMAND_ON, 0x32: COMMAND_CHECK, 0x33: COMMAND_TOA, 0x34: COMMAND_PERJOIN
    serialPort.write(buffer);
    return buffer;
}

function sendTurnOffAll() {
    var buffer = new Buffer(8);
    buffer[0] = 0x44;
    buffer[1] = 0x31;
    buffer[2] = 0x32;
    buffer[7] = 0x33; // 0x30 = '0': COMMAND_OFF, 0x31: COMMAND_ON, 0x32: COMMAND_CHECK, 0x33: COMMAND_TOA, 0x34: COMMAND_PERJOIN
    serialPort.write(buffer);
    return buffer;
}

if (process.env.MOCKUP == 'yes') {
    SerialPort = Meteor.npmRequire("virtual-serialport");
    serialPort = new SerialPort(process.env.TTY, {
        baudrate: 115200
    });
    serialPort.on("dataToDevice", function(data) {
        if (data[0] == 0x44 && data[1] == 0x31) { // D1
            if (data[2] == 0x34) { // D14  --> command OUT
                var res = new Buffer(8);
                res[0] = 0x44; // D
                res[1] = 0x33; // D3
                res[2] = 0x34; // D34 --> status IN
                res[3] = data[3]; // Button ID
                res[4] = data[4]; // NetAddr 
                res[5] = data[5]; // NetAddr
                res[6] = data[6]; // Endpoint
                res[7] = data[7]; // 
                serialPort.writeToComputer(res);
            }
            if (data[2] == 0x32) { // D12  --> Bcast OUT
                var res = new Buffer(8);
                switch(data[7]) {
                    // 0x30 = '0': COMMAND_OFF, 
                    // 0x31: COMMAND_ON, 
                    // 0x32: COMMAND_CHECK, 
                    // 0x33: COMMAND_TOA, 
                    // 0x34: COMMAND_PERJOIN,
                    // 0x35: COMMAND_TOGGLE
                    case 0x30: 
                    case 0x31:
                    case 0x32:
                        res[0] = 0x44; // D
                        res[1] = 0x33; // D3
                        res[2] = 0x34; // D34 --> status IN
                        res[3] = data[3]; // Button ID
                        res[4] = data[4]; // NetAddr 
                        res[5] = data[5]; // NetAddr
                        res[6] = data[6]; // Endpoint
                        res[7] = data[7]; // 
                        break;
                    case 0x33:
                        console.log("TURN OFF ALLLLLLLLL");
                        break;
                    case 0x34: // permit join
                        res[0] = 0x44;
                        res[1] = 0x33;
                        res[2] = 0x33;
                        res[3] = data[3];
                        res[4] = parseInt(Math.random() * 1000) % 100
                        res[5] = parseInt(Math.random() * 1000) % 100
                        //res[4] = 0x29;
                        //res[5] = 0x16;
                        res[6] = 0x10;
                        res[7] = data[7];
                        break;
                    case 0x35: // toggle
                        myLog("Toggle button current status");
                        res[0] = 0x44; // D
                        res[1] = 0x33; // D3
                        res[2] = 0x34; // D34 --> status IN
                        res[3] = data[3]; // Button ID
                        res[4] = data[4]; // NetAddr 
                        res[5] = data[5]; // NetAddr
                        res[6] = data[6]; // Endpoint
                        res[7] = 0x31; // Always on
                        break;
                }
                serialPort.writeToComputer(res);
            }
        }
    });
}
else {
    SerialPort = Meteor.npmRequire("serialport");

    if (process.env.MODEL_VER === 2) {
        serialPort = new SerialPort(process.env.TTY, {
            baudrate: 115200,
            parser: byteDelimiter
        });
    }
    else {
        serialPort = new SerialPort.SerialPort(process.env.TTY, {
            baudrate: 115200,
            parser: byteDelimiter
        });

    }
}

Meteor.onConnection(function(){
    myLog("A client connected");
});

serialPort.on("open", function() {
    myLog("Open " + process.env.TTY);
});

//var commandTrig, commandInfo;
/*
var blinkTimerHandle;
function zbLedOn() {
    myLog("zbLedOn");
    fs.writeFileSync(Constants.LED_FILE + "/trigger", "timer");
    fs.writeFileSync(Constants.LED_FILE + "/delay_on", "50");
    fs.writeFileSync(Constants.LED_FILE + "/delay_off", "250");
}

function zbLedOff() {
    myLog("zbLedOff");
    fs.writeFileSync(Constants.LED_FILE + "/trigger", "none");
}

function zbLedBlinkOne() {
        if(blinkTimerHandle) {
            clearTimeout(blinkTimerHandle);
        }
        else {
            zbLedOn();
        }
        blinkTimerHandle = setTimeout(zbLedOff, 1000);
}
*/
serialPort.on('data', Meteor.bindEnvironment(
    function(data) {
        if (data[0] == 0x44) {
            if(data[1] == 0x33) { //"D": start byte; "3": device -> ZAP
                //zbLedBlinkOne();
                try {
                    if (data[2] == 0x34) { // Command response (E.g.: report on/off
                        Device.findOne({
                            where: {
                                idx: data[3],
                                netadd: data[4] * 256 + data[5],
                                endpoint: data[6]
                            }
                        }).then(Meteor.bindEnvironment(function(dev){
                            if(dev) {
                                if(dev.sceneId && dev.type == Constants.DEVTYPE_SCENE) {
                                    myLog("Scene button: " + dev.sceneId);
                                    doScene(dev.sceneId);
                                }
                                else if( dev.type == Constants.DEVTYPE_CURTAIN) {
                                    myLog("Curtain down");
                                }
                                else {
                                    dev.status = data[7];
                                    dev.save().then(function(thisDev){
                                        myLog("change state success");
                                        Favorite.findOne({
                                            where:{deviceId:thisDev.id}
                                        }).then(function(fav) {
                                            fav.count = fav.count + 1;
                                            fav.save();
                                        }).catch(function(e){
                                            myLog("Error " + e);
                                            Favorite.create({
                                                count:1, 
                                                deviceId:thisDev.id
                                            }).then(function(fav){
                                                myLog("Create new fav");
                                            });
                                        });
                                    }).catch(function(e){
                                        myLog("Update device " + e);
                                    });
                                }
                            }
                            else {
                                Device.findOne({
                                    where: {
                                        idx1: data[3],
                                        netadd: data[4] * 256 + data[5],
                                        endpoint: data[6]
                                    }
                                }).then(function(dev){
                                    if( dev && dev.type == Constants.DEVTYPE_CURTAIN) {
                                        myLog("Curtain up");
                                    }
                                }).catch(function(err) {
                                    myLog("Error-3 " + err);
                                    myLog(err.stack);
                                });
                            }
                        })).catch(function(err){
                            myLog("Error-2 " + err);
                            myLog(err.stack);
                        });
                        /*if (commandTrig){
                            commandTrig(data);
                        }*/
                    }
                    if (data[2] == 0x33) {
                        var addr = data[4] * 256 + data[5];
                        var response = {
                            message:"JOIN-INFO-REQ",
                            netadd: addr.toString(16),
                            endpoint: data[6],
                            buttonId: data[3]
                        };
                        myLog("Response: " + JSON.stringify(response));
                        Notifier.emit('joininfo', JSON.stringify(response));
                    }
                }
                catch (err) {
                    myLog("Error-1 " + err);
                    myLog(err.stack);
                }
            }
            else if ( data[1] == 0x34 ){ // "4": error device -> ZAP 
                if(data[3] != 0x30) { 
                    var now = new Date();
                    var sceneActionMessage = {
                        type: "Error",
                        time: (now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()),
                    };
                    sceneActionMessage.name = "Send message " + (data[2] - 0x30) + " - " + (data[3] - 0x30);
                    sceneActionMessage.action = "occurred";
                    myLog("Emit error: " + JSON.stringify(sceneActionMessage));
                    Notifier.emit('sceneAction', JSON.stringify(sceneActionMessage));
                }
            }
        }
    })
);

var Sequelize = Meteor.npmRequire('sequelize-hierarchy')();
var sequelize = new Sequelize('database', null, null, {
    dialect: 'sqlite',
    //storage: '/tmp/database.sqlite'
    storage: process.env.DB_FILE
});
var Group = sequelize.define('group', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, {
    hooks: {
        beforeDestroy: function(grp, option) {
            return Device.destroy({
                where: {
                    groupId: grp.id
                },
                individualHooks: true
            }).then(function(row) {
                return Group.destroy({
                    where: {
                        parentId: grp.id
                    },
                    individualHooks: true
                });
            })
        }
    },
    freezeTableName: true,
    hierarchy: true
});
var Device = sequelize.define('device', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    status: Sequelize.INTEGER,
    available: Sequelize.BOOLEAN,
    type: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    idx: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    idx1: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    netadd: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    endpoint: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    sceneId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    icon: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    irModelId: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    irHubId: {
        type: Sequelize.INTEGER,
        allowNull: true
    }
}, {
    hooks: {
        beforeDestroy: function(dev) {
            Favorite.findAll({
                where: {
                    deviceId: dev.id
                }
            }).then(function(favs){
                favs.forEach(function(fav){
                    myLog("remove Favorite SUCCESS " + fav);
                    fav.destroy();
                });
            }).catch(function(err){
                myLog("remove Favorite vvvv Error: " + err);
            });

            SceneDev.findAll({
                where: {
                    devId: dev.id
                }
            }).then(function(sds){
                sds.forEach(function(sd){
                    myLog("remove scenedev SUCCESS " + sd);
                    sd.destroy();
                });
            }).catch(function(err){
                myLog("remove scenedev vvvv Error: " + err);
            });
        }
    },
    freezeTableName: true
});
Device.belongsTo(Group)
var Task = sequelize.define('task', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    action: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    time: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    active: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
}, {
    hooks: {
        afterCreate: function(tsk, option) {
            if (taskPool[tsk.id] != null) taskPool[tsk.id].clear()
            if (tsk && tsk.active) {
                console.log("Schedule after creation");
                var schedule = later.parse.text("at " +  tsk.time)
                taskPool[tsk.id] = later.setInterval(function() {
                    command({
                        id: tsk.deviceId,
                        act: tsk.action ? 'on' : 'off'
                    }, function(res) {
                        myLog(res)
                    })
                }, schedule);
            }
        },
        afterUpdate: function(tsk, option) {
            if (taskPool[tsk.id] != null) taskPool[tsk.id].clear()
            if (tsk && tsk.active) {
                console.log("Schedule after update");
                var schedule = later.parse.text("at " + tsk.time)
                taskPool[tsk.id] = later.setInterval(function() {
                    command({
                        id: tsk.deviceId,
                        act: tsk.action ? 'on' : 'off'
                    }, function(res) {
                        myLog(res)
                    });
                }, schedule);
            }
        },
        afterDestroy: function(tsk, option) {
            if (taskPool[tsk.id] != null) {
                taskPool[tsk.id].clear()
                taskPool[tsk.id] = undefined
            }
        }
    },
    freezeTableName: true
});
Task.belongsTo(Device);

var Scene = sequelize.define('scene', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    time: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    active: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
}, {
    hooks: {
        beforeDestroy: function(scene) {
            myLog("Scene beforeDestroy: " + scene.id);
            Device.findAll({
                where: {
                    sceneId: scene.id
                }
            }).then(function(devs) {
                devs.forEach(function(dev) {
                    myLog("remove device iiii SUCCESS: " + dev);
                    dev.destroy();
                });
            }).catch(function(err){
                myLog("remove device kkkk Error: " + err);
            });

            SceneDev.findAll({
                where: {
                    sceneId: scene.id
                }
            }).then(function(sds){
                sds.forEach(function(sd){
                    myLog("remove scenedev SUCCESS " + sd);
                    sd.destroy();
                });
            }).catch(function(err){
                myLog("remove scenedev vvvv Error: " + err);
            });
        }
    },
    freezeTableName: true
});

//Device.belongsTo(Scene);
/*
Group.hasMany(Scene);
*/
var SceneDev = sequelize.define('scenedev', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    action: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});
Scene.belongsToMany(Device, {
    through: 'scenedev',
    foreignKey: 'sceneId'
});
Device.belongsToMany(Scene, {
    through: 'scenedev',
    foreignKey: 'devId'
});

var Favorite = sequelize.define( 'favorite', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    count: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
}, {
    freezeTableName: true
});

Favorite.belongsTo(Device);

var Config = sequelize.define( 'config', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    value: {
        type: Sequelize.TEXT,
        allowNull: true
    }
}, {
    freezeTableName: true
});

var IRHub = sequelize.define('irhub', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    deviceId: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT, 
        allowNull: false
    },
    deviceKey: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, {
    freezeTableName: true
});

var IRDevModel = sequelize.define('irdevmodel', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    deviceType: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT,
        allowNull: true
    }
},{
    freezeTableName: true
});

var IRCommand = sequelize.define('ircommand', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    modelId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    name: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    irData: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    icon: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
},{
    freezeTableName: true
});

function getParam(name) {
    var value;
    var future = new Future();
    Config.findOne({where:{name: name}}).then(function(config) {
        value = config.value;
        future.return();
    }).catch(function(){
        value = null;
        future.return();
    });
    future.wait();
    return value;
}
function setParam(name, value, callback) {
    var retVal = false;
    var future = new Future();
    Config.findOne({where: {name: name}}).then(function(config){
        if (config) {
            config.value = value;
            config.save();
            retVal = true;
            future.return();
        }
        else {
            Config.create({name:name, value:value}).then(function(config){
                retVal = true;
                future.return();
            }).catch(function(){
                future.return();
            });
        }
    }).catch(function(config){
        future.return();
    });
    future.wait();
    return retVal;
}

var later = Meteor.npmRequire('later');
later.date.localTime();
var taskPool = new Array();


// var t = later.setInterval(function(){
//     command({id: 1, act: 'on'}, function(res) {
//         myLog(res)
//         command({id: 1, act: 'off'},function(res) {
//             myLog(res)
//         })
//     })
// }, sched);

function loadKodiParams() {
    kodiIP = getParam('kodiIP');
    kodiUser = getParam('kodiUser');
    kodiPassword = getParam('kodiPassword');
    myLog("kodiIP:" + kodiIP);
    myLog("kodiUser:" + kodiUser);
    myLog("kodiPassword:" + kodiPassword);
}
function loadNetatmoParams() {
    netatmoURL = getParam('netatmoURL');
    netatmoUser = getParam('netatmoUser');
    netatmoURL = getParam('netatmoPassword');
}

function onStartupSuccess() {
}

function onStartupError() {
}

Meteor.startup(function() {
    var future = new Future();
    sequelize.sync().then(function() {
        Task.findAll().then(function(tsk) {
            console.log("---- " + tsk.length);
            for (var i = 0; i < tsk.length; i++) {
                if (tsk[i] && tsk[i].active) {
                    var schedule = later.parse.text("at " + tsk[i].time)
                    var task = tsk[i];
                    taskPool[task.id] = later.setInterval(function() {
                        console.log("---- Do event --- " + task.time);
                        command({
                            id: task.deviceId,
                            act: task.action ? 'on' : 'off'
                        }, function(res) {
                            myLog(res)
                        });
                    }, schedule);
                    /*taskPool[tsk[i].id] = later.setInterval(function() {
                        command({
                            id: tsk[i].deviceId,
                            act: tsk[i].action ? 'on' : 'off'
                        }, function(res) {
                            myLog(res)
                        });
                    }, schedule);*/
                }
            }
            onStartupSuccess();
            future.return();
        }).catch(function(e) { 
            myLog("Select all tasks " + e); 
            onStartupError();
            future.return();
        });
    }).catch(function(e) {
        onStartupError();
        myLog("Database sync " + e);
        future.return();
    });
    future.wait();
    //loadKodiParams();
    //loadNetatmoParams();
    scheduleCheck(nCheck, checkAll);
    //KodiReload();
/*
    kodiPlay(0, function(err, res) {
        console.log("kodiPlay");
        if(err) console.log(err);
    });
*/
});

function addGroup(arg, callback) {
    if (arg) {
        arg.parentId = isNaN(parseInt(arg.parentId)) || parseInt(arg.parentId) < 1 ? undefined : parseInt(arg.parentId);
        Group.create(arg).then(function(grp) {
            callback({
                success: true,
                group: grp.toJSON()
            });
        }).catch(function(err) {
            callback({
                success: false,
                message: err.name == 'SequelizeForeignKeyConstraintError' ? 'Không có Group cha nào phù hợp.' : err.toString()
            });
        });
    }
    else callback({
        success: false,
        message: 'Dữ liệu gửi lên không đúng định dạng'
    });
}

function removeGroup(arg, callback) {
    if (arg && (typeof arg == 'number' || typeof arg == 'string')) {
        Group.destroy({
            where: (typeof arg == 'number' && {
                id: arg
            }) || (typeof arg == 'string' && {
                name: {
                    $like: '%' + arg + '%'
                }
            }),
            individualHooks: true
        }).then(function(row) {
            if (row > 0) callback({
                success: true,
                message: 'Đã xóa ' + row + ' Group tương ứng và các Group con'
            });
            else callback({
                success: false,
                message: 'Không có Group nào tương ứng'
            })
        }).catch(function(err) {
            callback({
                success: false,
                message: err.toString()
            })
        });
    }
    else callback({
        success: false,
        message: 'Dữ liệu gửi lên không đúng định dạng'
    });
}

function updateGroup(arg, callback) {
    if (arg && arg.id) {
        Group.update(arg, {
            where: {
                id: arg.id
            },
            individualHooks: true
        }).then(function(grp) {
            if (grp[0] > 0) callback({
                success: true,
                group: grp[1][0].toJSON()
            });
            else callback({
                success: false,
                message: 'Không có group nào tương ứng'
            });
        }).catch(function(err) {
            callback({
                success: false,
                message: err.toString()
            });
        });
    }
    else callback({
        success: false,
        message: 'Dữ liệu gửi lên không đúng định dạng'
    });
}

function addDevice(arg, callback) {
    if (arg) {
        Device.findOne({
            where: {
                name: arg.name,
                idx: arg.idx,
                netadd: arg.netadd,
                endpoint: arg.endpoint,
                groupId: isNaN(arg.groupId) || parseInt(arg.groupId) < 1 ? undefined : parseInt(arg.groupId)
            }
        }).then(function(dev) {
            myLog("device:");
            if (dev) {
                callback({
                    success: false,
                    message: 'Device bị trùng, đã có sẵn trong Group cha.'
                });
            }
            else {
                arg.groupId = isNaN(arg.groupId) || parseInt(arg.groupId) < 1 ? undefined : parseInt(arg.groupId);
                this.create(arg).then(function(dev2) {
                    callback({
                        success: true,
                        device: dev2.toJSON()
                    });
                }).catch(function(err) {
                    callback({
                        success: false,
                        message: err.name == 'SequelizeForeignKeyConstraintError' ? 'Không có Group cha nào phù hợp.' : err.toString()
                    });
                });
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function removeDevice(arg, callback) {
    if (arg && (typeof arg == 'number' || typeof arg == 'string')) {
        Device.destroy({
            where: (typeof arg == 'number' && {
                id: arg
            }) || (typeof arg == 'string' && {
                name: {
                    $like: '%' + arg + '%'
                }
            }),
            individualHooks: true
        }).then(function(row) {
            if (row > 0) callback({
                success: true,
                message: 'Đã xóa ' + row + ' thiết bị tương ứng'
            });
            else callback({
                success: false,
                message: 'Không có thiết bị nào tương ứng'
            });
        }).catch(function(err) {
            callback({
                success: false,
                message: err.toString()
            });
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function updateDevice(arg, callback) {
    if (arg && (arg.id || arg.sceneId)) {
        Device.update(arg, {
            where: {
                $or: [{
                    id: arg.id
                    },{
                    sceneId: arg.sceneId
                }]
            },
            individualHooks: true
        }).then(function(res) {
            if (res[0] > 0) callback({
                success: true,
                group: res[1][0].toJSON()
            });
            else callback({
                success: false,
                message: 'Không tìm thấy thiết bị này.'
            });
        }).catch(function(err) {
            myLog(err);
            callback({
                success: false,
                message: err.toString()
            });
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

function addIRHub(arg, callback) {
    if (arg) {
        console.log("Name: " + arg.deviceId + " ID: " + arg.name + " Key: "+ arg.deviceKey);
        IRHub.findOne({
            where: {
                $or: [{
                        deviceId: arg.deviceId
                    },{
                        name: arg.name
                    }
                    ]
            }
        }).then(function(dev) {
            myLog("device:");
            if (dev) {
                console.log("Name: " + dev.deviceId + " ID: " + dev.name + " Key: "+ dev.deviceKey);
                callback({
                    success: false,
                    message: 'IRHub Device bị trùng'
                });
            }
            else {
                myLog("new dev");
                this.create(arg).then(function(tsk) {
                    myLog("addIRHub: " + tsk.toJSON());
                }).catch(function(err) {
                    myLog("addIRHub: " + err);
                });
            }
        });
    }
    else {
        callback({
            success: false,
            message: 'Dữ liệu gửi lên không đúng định dạng.'
        });
    }
}

Meteor.publish('data', function(token) {
    var self = this;
    myLog('publish: token=' + token + " | " + process.env.TOKEN);
    if (token != process.env.TOKEN) {
        myLog("Wrong token: " + token + " | " + process.env.TOKEN);
        return;
    }

    function preOrder(tree, self) {
        var children = [];
        if (tree.children) {
            for (var i = 0; i < tree.children.length; i++) {
                preOrder(tree.children[i], self);
                children.push(tree.children[i].id);
            }
        }
        var value = tree.toJSON();
        value.children = children;
        self.added('group', value.id, value);
    }

    function findTree(tree, id) {
        if (tree.id == id) return tree;
        if (tree.children) {
            for (var i = 0; i < tree.children.length; i++) {
                var temp = findTree(tree.children[i], id);
                if (temp.id == id) return temp;
            }
        }
    }
    Group.findAll({
        hierarchy: true
    }).then(function(grpp) {
        for (var i = 0; i < grpp.length; i++) {
            preOrder(grpp[i], self)
        }
    });
    IRDevModel.findAll().then(function(irdevmodel) {
        for (var i = 0; i < irdevmodel.length; i++) {
            self.added('irdevmodel', irdevmodel[i].id, irdevmodel[i].toJSON());
        }
    });
    IRHub.findAll().then(function(irhub) {
        for (var i = 0; i < irhub.length; i++) {
            self.added('irhub', irhub[i].id, irhub[i].toJSON());
        }
    });
    IRCommand.findAll().then(function(ircmd) {
        for (var i = 0; i < ircmd.length; i++) {
            self.added('ircommand', ircmd[i].id, ircmd[i].toJSON());
        }
    });
    Device.findAll().then(function(dev) {
        for (var i = 0; i < dev.length; i++) {
            self.added('device', dev[i].id, dev[i].toJSON())
        }
    });
    Task.findAll().then(function(tsk) {
        if(tsk) {
            for (var i = 0; i < tsk.length; i++) {
                self.added('task', tsk[i].id, tsk[i].toJSON())
            }
        }
    });
    Favorite.findAll().then(function(fav) {
        for (var i = 0; i < fav.length; i++) {
            self.added('favorite', fav[i].id, fav[i].toJSON());
        }
    });
    Scene.findAll().then(function(scene) {
        for (var i = 0; i < scene.length; i++ ) {
            self.added('scene', scene[i].id, scene[i].toJSON());
        }
    });
    SceneDev.findAll().then(function(sceneDev) {
        for (var i = 0; i < sceneDev.length; i++ ) {
            self.added('scenedev', sceneDev[i].id, sceneDev[i].toJSON());
        }
    });
    Group.addHook('afterCreate', self._session.id, function(grp, option) {
        Group.findAll({
            hierarchy: true
        }).then(function(grpp) {
            var parentNode = findTree(grpp[0].toJSON(), grp.parentId)
            if (parentNode) {
                var child = []
                if (parentNode.children)
                    for (var i = 0; i < parentNode.children.length; i++) {
                        child.push(parentNode.children[i].id)
                    }
                self.changed('group', parentNode.id, {
                    children: child
                });
            }
        });
        var value = grp.toJSON();
        value.children = [];
        self.added('group', grp.id, value);
    });
    Group.addHook('afterUpdate', self._session.id, function(grp, option) {
        myLog(grp);
        if (grp._changed.parentId) {
            Group.findAll({
                hierarchy: true
            }).then(function(grpp) {
                var oldParentNode = findTree(grpp[0].toJSON(), grp._previousDataValues.parentId);
                var newParentNode = findTree(grpp[0].toJSON(), grp.parentId);
                myLog(oldParentNode);
                myLog(newParentNode);
                if (oldParentNode) {
                    var childtemp = []
                    if (oldParentNode.children)
                        for (var i = 0; i < oldParentNode.children.length; i++) {
                            childtemp.push(oldParentNode.children[i].id)
                        }
                    self.changed('group', oldParentNode.id, {
                        updatedAt: oldParentNode.updatedAt,
                        children: childtemp
                    });
                }
                if (newParentNode) {
                    var childtemp = [];
                    if (newParentNode.children)
                        for (var i = 0; i < newParentNode.children.length; i++) {
                            childtemp.push(newParentNode.children[i].id)
                        }
                    self.changed('group', newParentNode.id, {
                        updatedAt: newParentNode.updatedAt,
                        children: childtemp
                    });
                }
            });
        }
        self.changed('group', grp.id, grp.toJSON());
    });
    Group.addHook('afterDestroy', self._session.id, function(grp, option) {
        self.removed('group', grp.id);
    });
    IRHub.addHook('afterCreate', self._session.id, function(irhub, option){
        self.added('irhub', irhub.id, irhub.toJSON());
    });
    IRHub.addHook('afterUpdate', self._session.id, function(irhub, option) {
        self.changed('irhub', irhub.id, irhub.toJSON());
        myLog('IRHub updated');
    });
    IRHub.addHook('afterDestroy', self._session.id, function(irhub, option){
        self.removed('irhub', irhub.id);
    });
    Device.addHook('afterCreate', self._session.id, function(dev, option) {
        self.added('device', dev.id, dev.toJSON());
    });
    Device.addHook('afterUpdate', self._session.id, function(dev, option) {
        self.changed('device', dev.id, dev.toJSON());
        myLog('Device updated');
    });
    Device.addHook('afterDestroy', self._session.id, function(dev, option) {
        myLog("device (" + dev.id + ") removed");
        self.removed('device', dev.id);
    });
    Task.addHook('afterCreate', self._session.id, function(tsk, option) {
        self.added('task', tsk.id, tsk.toJSON());
    });
    Task.addHook('afterUpdate', self._session.id, function(tsk, option) {
        self.changed('task', tsk.id, tsk.toJSON());
    });
    Task.addHook('afterDestroy', self._session.id, function(tsk, option) {
        self.removed('task', tsk.id);
    });
    Favorite.addHook('afterCreate', self._session.id, function(fav, option) {
        self.added('favorite', fav.id, fav.toJSON());
    });
    Favorite.addHook('afterUpdate', self._session.id, function(fav, option){
        self.changed('favorite', fav.id, fav.toJSON()); 
    });
    Favorite.addHook('afterDestroy', self._session.id, function(fav, option){
        self.removed('favorite', fav.id);
    });
    Scene.addHook('afterCreate', self._session.id, function(scene, option){
        self.added('scene', scene.id, scene.toJSON());
    });
    Scene.addHook('afterUpdate', self._session.id, function(scene, option){
        self.changed('scene', scene.id, scene.toJSON());
    });
    Scene.addHook('afterDestroy', self._session.id, function(scene, option){
        myLog("Sceneeeeee (" + scene.id +") removed");
        self.removed('scene', scene.id);
    });
    SceneDev.addHook('afterCreate', self._session.id, function(sceneDev, option){
        myLog('scenedev added');
        self.added('scenedev', sceneDev.id, sceneDev.toJSON());
    });
    SceneDev.addHook('afterUpdate', self._session.id, function(sceneDev, option){
        myLog('scenedev changed');
        self.changed('scenedev', sceneDev.id, sceneDev.toJSON());
    });
    SceneDev.addHook('afterDestroy', self._session.id, function(sceneDev, option){
        myLog('afterDestroy sceneDev ' + sceneDev.id);
        self.removed('scenedev', sceneDev.id);
    });
    self.onStop(function() {
        Task.removeHook('afterCreate', self._session.id);
        Task.removeHook('afterUpdate', self._session.id);
        Task.removeHook('afterDestroy', self._session.id);
        Device.removeHook('afterCreate', self._session.id);
        Device.removeHook('afterUpdate', self._session.id);
        Device.removeHook('afterDestroy', self._session.id);
        IRHub.removeHook('afterCreate', self._session.id);
        IRHub.removeHook('afterUpdate', self._session.id);
        IRHub.removeHook('afterDestroy', self._session.id);
        Group.removeHook('afterCreate', self._session.id);
        Group.removeHook('afterUpdate', self._session.id);
        Group.removeHook('afterDestroy', self._session.id);
        Favorite.removeHook('afterCreate', self._session.id);
        Favorite.removeHook('afterUpdate', self._session.id);
        Favorite.removeHook('afterDestroy', self._session.id);
        Scene.removeHook('afterCreate', self._session.id);
        Scene.removeHook('afterUpdate', self._session.id);
        Scene.removeHook('afterDestroy', self._session.id);
        SceneDev.removeHook('afterCreate', self._session.id);
        SceneDev.removeHook('afterUpdate', self._session.id);
        SceneDev.removeHook('afterDestroy', self._session.id);
    });
    self.ready();
});

function permitjoin(info, callback) {
    var res = sendPermitJoin(20);
    callback(res);
}

function writeToSerialPort(devCmd, callback) {
    limiter.removeTokens(1, function(error, remainingRequests) {
        if(error) {
            myLog("ERRORRRR:" + error);
        }
        else {
            serialPort.write(devCmd, callback);
        }
    });
}

function command(input, callback) {
    Device.findOne({
        where: {
            id: input.id
        }
    }).then(function(dev) {
        if (dev) {
            console.log('action:' + input.act + '--');
            var devCtrl = new Buffer(8);
            devCtrl[0] = 0x44;
            devCtrl[1] = 0x31;
            devCtrl[2] = useBcast?0x32:0x34;
            devCtrl[3] = dev.idx;
            devCtrl[4] = dev.netadd / 256;
            devCtrl[5] = dev.netadd % 256;
            devCtrl[6] = dev.endpoint;
            devCtrl[7] = input.act == 'on' ? 0x31 : input.act == 'off' ? 0x30 : input.act == 'status' ? 0x32 : input.act == 'toggle'? 0x35 : 0x0;
            writeToSerialPort(devCtrl, function(err, results) {
                myLog('err ' + err);
                myLog('results ' + results);
                myLog(devCtrl);
            });
        }
        else {
            callback({
                success: false,
                message: "Không có thiết bị nào tương ứng"
            });
        }
    });
}
/*
function command(input, callback) {
    Device.findOne({
        where: {
            id: input.id
        }
    }).then(function(dev) {
        if (dev) {
            var devCtrl = new Buffer(8);
            devCtrl[0] = 0x44;
            devCtrl[1] = 0x31;
            devCtrl[2] = 0x34;
            devCtrl[3] = dev.idx;
            devCtrl[4] = dev.netadd / 256;
            devCtrl[5] = dev.netadd % 256;
            devCtrl[6] = dev.endpoint;
            devCtrl[7] = input.act == 'on' ? 0x31 : input.act == 'off' ? 0x30 : input.act == 'status' ? 0x32 : 0x0;
            if (input.act == 'on' || input.act == 'off' || input.act == 'status') {
                commandInfo = {
                    input: input,
                    callback: callback
                };
                commandTrig = function(data) {
                    if (data[0] == 0x44 && data[1] == 0x33 && data[2] == 0x34) {
                        if (commandInfo.input.act == 'status') {
                            commandInfo.callback({
                                success: true,
                                status: data[7],
                                message: "Trạng thái thiết bị"
                            });
                        }
                        else {
                            commandInfo.callback({
                                success: true,
                                status: data[7],
                                message: "Chuyển trạng thái thiết bị thành công"
                            });
                        }
                        commandTrig = undefined;
                        commandInfo = undefined;
                    }
                };
                writeToSerialPort(devCtrl, function(err, results) {
                    myLog('err ' + err);
                    myLog('results ' + results);
                    myLog(devCtrl);
                });
            }
            else callback({
                success: false,
                message: "Sai cú pháp điều khiển"
            });
        }
        else {
            callback({
                success: false,
                message: "Không có thiết bị nào tương ứng"
            });
        }
    });
}
*/
// setInterval(function(){
//     Device.findAll().then(function(devs){
//         devs.forEach(function(dev) {
//             var future = new Future();
//             command({
//                 id: dev.id,
//                 act: 'status'
//             }, future);
//             var respon = future.wait();
//             if (respon.success == false && respon.message == "offline") {
//                 Device.update({
//                     available: false
//                 }, {
//                     where: {
//                         id: dev.id
//                     },
//                     individualHooks: true
//                 })
//             }
//         })
//     })
// }, 5000)
function doScene(sceneId) {
    console.log("doScene:" + sceneId + "--");
    if(sceneId < -2 ) return;
    if(sceneId == -1) { // Default scene - Turn Off All
        /*Device.findAll({
            where: { 
                type: {
                    //$in: [0,1,2,3]
                    $in: [0]
                }
            }
        }).then(function(devices) {
            for( var i = 0; i < devices.length; i++ ) {
                command({
                    id:devices[i].id,
                    act: 'off'
                }, function(res) {
                    console.dir(res);
                });
            }
            emitSceneAction(-1);
        }).catch(function(err){
            myLog("Error: " + err.toString());
        });*/
        // SEND Command broadcast

        // For No-check version
        Device.update( {
               status: 48
            }, {
            where: {
                type: {"$in": [0]}
            },
            individualHooks: true
        }).then(function(res) {
                }).catch(function(err) {
        });

        sendTurnOffAll();
        emitSceneAction(-1);
        scheduleCheck(nCheck, checkAll);
    }
    else if(sceneId == -2) { // PlayPause Audio
        kodiPlayPause();
        emitSceneAction(-2);
    }
    else {
        SceneDev.findAll({
            where: {
                sceneId: sceneId
            }
        }).then(function(sds) {
            for( var i = 0; i < sds.length; i++ ) {
                console.log("ZZZ: " + sds.length);
                var devId = sds[i].devId;
                var sdAction = parseInt(sds[i].action);

                switch(sdAction) {
                    case 0:
                    case 1:
                    case 2:
                        var actVals = ['off','on','toggle'];
                        if (sdAction < 0 || sdAction >= actVals.length) sdAction = 0;
                            command({
                            id: devId,
                            act: actVals[sdAction]
                        }, function(res) {
                            myLog(res);
                        });
                        break;
                    case 3:
                        curtainUp(devId);
                        break;
                    case 4:
                        curtainStop(devId);
                        break;
                    case 5:
                        curtainDown(devId);
                        break;
                }
            }
            emitSceneAction(sceneId);
        }).catch(function(err){
            myLog("Error: " + err.toString());
        });
    }
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function checkAll() {
    Device.findAll({
        where: {
            type: {
                //$in: [0,1,2,3]
                $in: [0]
            }
        }
    }).then(function(devices) {
        shuffle(devices);
        for( var i = 0; i < devices.length; i++ ) {
            command({
                id:devices[i].id,
                act: 'status'
            }, function(res) {
                console.dir(res);
            });
        }
    }).catch(function(err){
        myLog("Check All error: " + err.toString());
    });
}

function scheduleCheck(ntime, callback) {
    var count = ntime;
    function doIt() {
        myLog("Check ALL: " + count);
        callback();
        if(count > 0) { 
            count--;
            setTimeout(doIt, 5000 + Math.floor(Math.random() * 5000));
        }
    }
    if(count > 0) {
        count--;
        setTimeout(doIt, 1000 + Math.floor(Math.random() * 1000));
    }
}

function emitSceneAction(sceneId) {
    var now = new Date();
    var sceneActionMessage = {
        type: "Scene",
        time: (now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds()),
    };
    if(sceneId == -1) {
        sceneActionMessage.name = "TURN OFF ALL";
        sceneActionMessage.action = "activated";
        myLog("Emit: " + JSON.stringify(sceneActionMessage));
        Notifier.emit('sceneAction', JSON.stringify(sceneActionMessage));
    }
    if(sceneId == -2) {
        sceneActionMessage.name = "MUSIC";
        sceneActionMessage.action = "activated";
        myLog("Emit: " + JSON.stringify(sceneActionMessage));
        Notifier.emit('sceneAction', JSON.stringify(sceneActionMessage));
    }
    else {
        Scene.findOne({
            where: {
                id:sceneId
            }
        }).then(function(scene) {
            sceneActionMessage.name = scene.name;
            sceneActionMessage.action = "activated";
            myLog("Emit: " + JSON.stringify(sceneActionMessage));
            Notifier.emit('sceneAction', JSON.stringify(sceneActionMessage));
        }).catch(function(){});
    }
}

function curtainUp(curtainId) {
    Device.findOne({
        where: {
            id: curtainId
        }
    }).then(function(dev) {
        if (dev) {
            var devCtrl = new Buffer(8);
            devCtrl[0] = 0x44;
            devCtrl[1] = 0x31;
            devCtrl[2] = useBcast?0x32:0x34;
            devCtrl[3] = dev.idx1; // Button 1 --> Up curtain
            devCtrl[4] = dev.netadd / 256;
            devCtrl[5] = dev.netadd % 256;
            devCtrl[6] = dev.endpoint;
            //devCtrl[7] = input.act == 'on' ? 0x31 : input.act == 'off' ? 0x30 : input.act == 'status' ? 0x32 : 0x0;
            devCtrl[7] = 0x31; // "1" --> action "on"
            myLog('Write curtain up command');
            writeToSerialPort(devCtrl, function(err, results) {
                myLog('err ' + err);
                myLog('results ' + results);
                myLog(devCtrl);
            });
        }
        else {
            myLog({
                success: false,
                message: "Không có thiết bị nào tương ứng"
            });
        }
    }).catch(function(err) {
        myLog(err.stack);
    });
}
function curtainDown(curtainId) {
    Device.findOne({
        where: {
            id: curtainId
        }
    }).then(function(dev) {
        if (dev) {
            var devCtrl = new Buffer(8);
            devCtrl[0] = 0x44;
            devCtrl[1] = 0x31;
            devCtrl[2] = useBcast?0x32:0x34;
            devCtrl[3] = dev.idx; // Button 0 --> Up curtain
            devCtrl[4] = dev.netadd / 256;
            devCtrl[5] = dev.netadd % 256;
            devCtrl[6] = dev.endpoint;
            //devCtrl[7] = input.act == 'on' ? 0x31 : input.act == 'off' ? 0x30 : input.act == 'status' ? 0x32 : 0x0;
            devCtrl[7] = 0x31; // "1" --> action "on"
            myLog('Write curtain down command');
            writeToSerialPort(devCtrl, function(err, results) {
                myLog('err ' + err);
                myLog('results ' + results);
                myLog(devCtrl);
            });
        }
        else {
            myLog({
                success: false,
                message: "Không có thiết bị nào tương ứng"
            });
        }
    }).catch(function(err) {
        myLog(err.stack);
    });
}
function curtainStop(curtainId) {
    Device.findOne({
        where: {
            id: curtainId
        }
    }).then(function(dev) {
        if (dev) {
            limiter.removeTokens(1, function(error, remainingRequests) {
                var stopCmd = new Buffer(8);
                stopCmd[0] = 0x44;
                stopCmd[1] = 0x31;
                stopCmd[2] = useBcast?0x32:0x34;
                stopCmd[3] = 0x32; // "2" -> "stop"
                stopCmd[4] = dev.netadd / 256;
                stopCmd[5] = dev.netadd % 256;
                stopCmd[6] = dev.endpoint;
                stopCmd[7] = 0x31; // "1" --> action "on"
                myLog('Write curtain stop command');

                serialPort.write(stopCmd, function(err, results) {
                    myLog('err ' + err);
                    myLog('results ' + results);
                    myLog(stopCmd);
                });
            });
        }
        else {
            myLog({
                success: false,
                message: "Không có thiết bị nào tương ứng"
            });
        }
    }).catch(function(err) {
        myLog(err.stack);
    });
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

if (Meteor.isServer) {
    Meteor.methods({
        com: function(input) {
            command(input, function(res) {
                myLog(res);
            });
        },
        com2: function(input) {
            Device.findOne({
                where: {
                    id: input.id
                }
            }).then(function(dev) {
                if (dev) {
                    var devCtrl = new Buffer(8);
                    devCtrl[0] = 0x44;
                    devCtrl[1] = 0x31;
                    devCtrl[2] = 0x34;
                    devCtrl[3] = dev.idx;
                    devCtrl[4] = dev.netadd / 256;
                    devCtrl[5] = dev.netadd % 256;
                    devCtrl[6] = dev.endpoint;
                    devCtrl[7] = input.act == 'on' ? 0x31 : input.act == 'off' ? 0x30 : input.act == 'status' ? 0x32 : 0x0;
                    if (input.act == 'on' || input.act == 'off' || input.act == 'status') {
                        writeToSerialPort(devCtrl, function(err, results) {
                            myLog(devCtrl);
                            myLog('err ' + err);
                            myLog('results ' + results);
                        });
                    }
                }
            });
            return true;
        },
        permit: function(info) {
            permitjoin(info, function(res) {
                myLog("permit:" + res);
            });
        },
        stopPermit: function() {
            var messper = new Buffer(8);
            messper[0] = 0x44;
            messper[1] = 0x31;
            messper[2] = 0x32;
            messper[3] = 0x00;
            writeToSerialPort(messper);
        },
        addDevice: function(arg) {
            myLog('addDevice:' + arg);
            addDevice(arg, function(res) {
                myLog('addDevice result:');
                myLog(res);
            });
        },
        updateDevice: function(arg) {
            updateDevice(arg, function(res) { });
        },
        removeDevice: function(arg) {
            removeDevice(arg, function(res) { 
                myLog('removeDevice result:');
                myLog(res);
            })
        },
        addGroup: function(arg) {
            addGroup(arg, function(res) {
                myLog('addGroup result:');
                myLog(res);
            })
        },
        updateGroup: function(arg) {
            updateGroup(arg, function(res) {
                myLog('updateGroup result:');
                myLog(res);
            })
        },
        removeGroup: function(arg) {
            removeGroup(arg, function(res) {
                myLog('removeGroup result:');
                myLog(res);
            })
        },
        addTask: function(arg) {
            if (arg) {
                arg.active = true;
                Task.create(arg).then(function(tsk) {
                    myLog("addTask: " + tsk.toJSON());
                }).catch(function(err) {
                    myLog("addTask: " + err);
                });
            }
            else {
                myLog("Invalid input parameters");
                return {success:false, message:"Invalid data input"};
            }
        },
        updateTask: function(arg) {
            if (arg) {
                Task.findById(arg.id).then(function(tsk) {
                    if (tsk)
                        tsk.update(arg).then(function(res) {
                            myLog('updateTask: ' + res.toJSON());
                        });
                });
            }
            else {
                myLog("Invalid input parameters");
                return {success:false, message:"Invalid data input"};
            }
        },
        removeTask: function(arg) {
            if (arg) {
                Task.findById(arg).then(function(tsk) {
                    if (tsk) tsk.destroy();
                });
            }
            else {
                myLog("Invalid input parameters " + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        addScene: function(arg) {
            if(arg) {
                arg.active = true;
                Scene.create(arg).then(function(scene) {
                    myLog("addScene: success");
                }).catch(function(err) {
                    myLog("addScene: error " + err);
                });
            }
            else {
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        updateScene: function(arg) {
            if(arg) {
                myLog("Update Scene: " + arg.id + "name: " + arg.name);
                Scene.update(arg, {
                    where:{
                        id: parseInt(arg.id)
                    },
                    individualHooks: true
                }).then(function() {
                    myLog('updateScene: Success');
                }).catch(function(err) {
                    myLog(err.toString());
                });
            }
            else {
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        removeScene: function(arg) {
            if(arg) {
                Scene.destroy({
                    where: {
                        id: parseInt(arg)
                    },
                    individualHooks: true
                }).then(function(){
                    myLog('removeScene: success');
                }).catch(function(err){
                    myLog('removeScene: error ' + err);
                });
            }
            else {
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        sceneAction: function(arg) {
            if(!isNaN(arg)) {
                doScene(parseInt(arg));
            }
            else {
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        addSceneDev: function(arg) {
            if(!isNaN(arg)) {
                SceneDev.create({
                    sceneId: parseInt(arg),
                    action: true
                }).then(function() {
                    myLog('Success');
                }).catch(function(err){
                    myLog(err.toString());
                });
            }
            else {
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        updateSceneDev: function(arg) {
            if(arg) {
                myLog("Update SceneDev: " + arg.id);
                SceneDev.update(arg, {
                    where:{
                        id: parseInt(arg.id)
                    },
                    individualHooks: true
                }).then(function() {
                    myLog('updateSceneDev:Success');
                }).catch(function(err) {
                    myLog(err.toString());
                });
            }
            else {
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        removeSceneDev: function(arg) {
            if(arg) {
                SceneDev.destroy({
                    where: {id: parseInt(arg)},
                    individualHooks: true
                }).then(function(){
                    myLog("Done then");
                }).catch(function(err){
                    myLog("Done error")
                });
            }
            else {
                return {success:false, message:"Invalid data input"};
            }
        },
        configKodi: function(arg) {
            if(arg) {
                if( !setParam('kodiIP', arg.kodiIP) ) 
                    return {success:false, message: "Cannot set kodiIP"};
                if( !setParam('kodiUser', arg.kodiUser) ) 
                    return {success:false, message: "Cannot set kodiUser"};
                if( !setParam('kodiPassword', arg.kodiPassword) ) 
                    return {success:false, message: "Cannot set kodiPassword"};
                loadKodiParams();
                return {success:true};
            }
            else {
                return {success:false, message:"Invalid data input"};
            }
        },
        configNetatmo: function(arg) {
            myLog("configNetatmo");
            console.dir(arg)
            if(arg) {
                if( !setParam('netatmoURL', arg.netatmoURL) ) 
                    return {success:false, message: "Cannot set netatmoURL"};
                if( !setParam('netatmoUser', arg.netatmoUser) ) 
                    return {success:false, message: "Cannot set netatmoUser"};
                if( !setParam('netatmoPassword', arg.netatmoPassword) ) 
                    return {success:false, message: "Cannot set netatmoPassword"};
                loadNetatmoParams();
                return {success:true};
            }
            else {
                return {success:false, message:"Invalid data input"};
            }
        },
        curtainUp: curtainUp,
        curtainDown: curtainDown,
        curtainStop: curtainStop,
        syncClock: function(timestamp) {
            var now = Date.now();
            console.log(Date(now));
            console.log(Date(timestamp));


            var offset = Math.abs(Date.now() - timestamp);
            myLog("offset:" + offset);
            function pad(n) {
                return (n < 10) ? ("0" + n) : n;
            }
            if(offset > 3*1000) {
                var currentTime = new Date(timestamp);
                var timeStr = currentTime.getFullYear() + "-" + pad(currentTime.getMonth() + 1)
                            + "-" + currentTime.getDate() + " " + currentTime.getHours()
                            + ":" + pad(currentTime.getMinutes()) + ":" + pad(currentTime.getSeconds());
                myLog(timeStr);
                var timeSyncProcess = spawn(process.env.TIME_SYNC, [timeStr]);
                timeSyncProcess.on('error', function(err){
                    myLog('timeSync:Error:' + err);
                });
                timeSyncProcess.stdout.on('data', function(data) {
                    myLog('timeSync:output:' + data);
                });
            }
            else {
                myLog("No need to sync time");
            }
            var time = new Date(timestamp);
            var _time = addZero(time.getHours()) + ":" + addZero(time.getMinutes());
            return _time;
        },
        getDHomeClock: function() {
            var now = Date.now();
            var currentTime = new Date(now);
            myLog(now + " =? " + currentTime);
            var timeStr = currentTime.getHours() + ":" + currentTime.getMinutes() + ":" + currentTime.getSeconds();
            myLog(timeStr);
            return {timestamp:now, time:timeStr};
        },
        addIRHub: function(arg) {
            myLog('addIRHub:' + arg);
            addIRHub(arg, function(res) {
                myLog('addIRHub result:');
                myLog(res);
            });
        },
        updateIRHub: function(arg) {
            if(arg) {
                myLog('addIRHub:' + arg);
                IRHub.update(arg, {
                    where:{
                        deviceId: arg.deviceId
                    },
                    individualHooks: true
                }).then(function() {
                    myLog('update IRHub: Success');
                }).catch(function(err) {
                    myLog(err.toString());
                });
            }
            else{
                myLog('failure ' + arg);
                return {success:false, message:"Invalid data input"};
            }
        },
        removeIRHub: function(arg) {
            myLog('removeIRHub: ' + arg);
            if(arg) {
                IRHub.destroy({
                    where: {
                        id: arg},
                    individualHooks: true
                }).then(function(){
                    myLog("Done then");
                }).catch(function(err){
                    myLog("Done error")
                });
            }
            else {
                return {success:false, message:"Invalid data input"};
            }

        },
        getPublicIp: function(arg){   
            try {
                var result = HTTP.post('http://dicom.vn/get-public-ip.php?key='+arg);
            } catch(err) {
                console.log(err);
                return err;
            }
                return result   
        },
        getServerTime: function () {
            var now = Date.now();
            var time = new Date(now);
            var _time = addZero(time.getHours()) + ":" + addZero(time.getMinutes());
            return _time;
        },
        getServerInfo: function () {
            var version = process.env.MODEL_VER;
            if (!version) {
                version = "Not Available";
            }
            var serial = process.env.SERIAL;
            if (!serial) {
                serial = "Not Available";
            }
            var ip = process.env.IP;
            if (!ip) {
                ip = "Not Available";
            }
            var gw = process.env.GW;
            if (!gw) {
                gw = "Not Available";
            }

            return {version: version, serial: serial, ip: ip, gw: gw};
        },
        diagnostic: function() {
            var buffer = new Buffer(8);
            buffer[0] = 0x44;
            buffer[1] = 0x31;
            buffer[2] = 0x32;
            buffer[7] = 0x36; // 0x30 = '0': COMMAND_OFF, 0x31: COMMAND_ON, 0x32: COMMAND_CHECK, 0x33: COMMAND_TOA, 0x34: COMMAND_PERJOIN, 0x35: TOGGLE, 0x36: DAG
            serialPort.write(buffer);
            console.log('Diagnostic: ' + buffer);
            return JSON.stringify(buffer);
        }
    });
}
