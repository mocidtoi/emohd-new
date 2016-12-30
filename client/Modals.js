Template.ModalAddRoom.events({
    "click button#ok": function(event, instance) {
        Meteor.apply('addGroup', [{
            name: instance.$('#inputRoomName').val(),
            parentId: null
        }], {wait: false});
    }
});
Template.ModalAddRoom.helpers({
    modalId: function() {
        return MODALS[0].id;
    }
});
Template.ModalUpdateRoom.events({
    "click button#ok": function(event, instance) {
        var elem = instance.$('#inputUpdateRoomName');
        var roomId = elem.attr("data-room-id");
        var roomName = elem.val();
        roomId = parseInt(roomId);
        console.log("Room:" + roomName + "(" + roomId + ")");
    
        Meteor.apply('updateGroup', [{
            id: roomId,
            name: roomName,
            parentId: null
        }], {wait: false});
    }
});
Template.ModalUpdateRoom.helpers({
    modalId: function() {
        return MODALS[2].id;
    }
});
Template.ModalAddScene.helpers({
    modalId: function() {
        return MODALS[1].id;
    }
});
Template.ModalAddScene.events({
    "click button#ok": function(event, instance) {
        console.log('add scene');
        Meteor.apply('addScene', [{
            name: instance.$('#inputSceneName').val()
        }], {wait: false});
    }
});

Template.ModalConfig.helpers({
    modalId: function() {
        return "modal-config";
    },
    dialogName: function() {
        return Session.get('dialog-name');
    }
});

Template.ModalConfig.events({
    'click button#KodiOk': function(event, instance){
        var params = new Object();
        params.kodiIP = instance.$('#KodiIP').val().trim();
        params.kodiUser = instance.$('#KodiUser').val().trim();
        params.kodiPassword = instance.$('#KodiPassword').val().trim();
        console.log(params);
        Meteor.apply('configKodi', [params], {wait: false});
    },
    'click button#NetatmoOk': function(event, instance) {
        Session.set('has-widget', true);
        var params = new Object();
        params.netatmoURL = instance.$('#NetatmoURL').val().trim();
        params.netatmoUser = instance.$('#NetatmoUser').val().trim();
        params.netatmoPassword = instance.$('#NetatmoPassword').val().trim();
        console.log(params);
        Meteor.apply('configNetatmo', [params], {wait: false});
    }
});

Template.ModalSettings.helpers({
    modalId: function() { return 'modal-settings';}
});

Template.ModalSettings.events({
    'click button#settingsOk': function(event, instance) {
        var dHomeIP = instance.$('#dhomeIP').val().trim();
        var dHomePort = instance.$('#dhomePort').val().trim();
        var dHomeKey = instance.$('#dhomeKey').val().trim();
        if( !dHomeIP || dHomeIP.length <= 0) {
            console.log("-" + dHomeIP + "_");
            instance.$('#dhomeIP').parent().addClass('has-error');
            return;
        }
        if( !dHomePort || isNaN(dHomePort)) {
            console.log("-" + dHomePort + "_");
            instance.$('#dhomePort').parent().addClass('has-error');
            return;
        }
        if( !dHomeKey || dHomeKey.length <= 0) {
            instance.$('#dhomeKey').parent().addClass('has-error');
            return;
        }

        reconfigServer("http://" + dHomeIP + ":" + dHomePort + "/", dHomeKey);        
        instance.$('#modal-settings').modal('hide');;
    },
    'click button#discover': function(event, instance) {
        if(Meteor.isCordova) {
            zeroconf_discover(function(error, res) {
                if(!error) {
                    instance.$('#dhomeIP').val(res.ip);
                    instance.$('#dhomePort').val('7777');
                }
            });
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }
    },
    'click button#discoverGlobal': function(event, instance) {
        var dHomeKey = window.localStorage.getItem("__token");
        if (!dHomeKey) {
            dHomeKey = instance.$('#dhomeKey').val().trim();
        }

        if (dHomeKey) {
            HTTP.call( 'GET', 'http://dicom.vn/get-public-ip.php?key=' + dHomeKey, {}, function(err, res){
                if (err) {
                    console.log(err);
                }   
                else if (res) {
                    console.log(res);
                }
                instance.$('#dhomeIP').val(res.content);
                instance.$('#dhomePort').val('7777');
                instance.$('#dhomeKey').val(dHomeKey);
            });
        }
        else {
            if( !dHomeKey || dHomeKey.length <= 0) {
                instance.$('#dhomeKey').parent().addClass('has-error');
                return;
            }
        }
    }
});

Template.ModalCurtainControl.onRendered(function(){
    Meteor.setTimeout(function() {
        this.$("button.btn-curtain").rippler({
            effectClass      :  'rippler-effect'
            ,effectSize      :  16      // Default size (width & height)
            ,addElement      :  'div'   // e.g. 'svg'(feature)
            ,duration        :  300
        });
    }, 100);
});

Template.ModalCurtainControl.helpers({
    curtainName: function() {
        return Session.get('curtain-name');;
    }
});
Template.ModalCurtainControl.events({
    'click #curtain-up': function(event, instance) {
        var id = parseInt(Session.get('curtain-id'));
        Meteor.apply('curtainUp', [id], {wait:false});
    },
    'click #curtain-down': function(event, instance) {
        var id = parseInt(Session.get('curtain-id'));
        Meteor.apply('curtainDown', [id], {wait:false});
    },
    'click #curtain-stop': function(event, instance) {
        var id = parseInt(Session.get('curtain-id'));
        Meteor.apply('curtainStop', [id], {wait:false});
    },
});

Template.ModalIRConfig.onRendered(function() {
    var opts = {
          lines: 11 // The number of lines to draw
        , length: 4 // The length of each line
        , width: 2 // The line thickness
        , radius: 4 // The radius of the inner circle
        , scale: 1.0 // Scales overall size of the spinner
        , corners: 0.7 // Corner roundness (0..1)
        , color: '#fff' // #rgb or #rrggbb or array of colors
        , opacity: 0.5 // Opacity of the lines
        , rotate: 0 // The rotation offset
        , direction: 1 // 1: clockwise, -1: counterclockwise
        , speed: 0.5 // Rounds per second
        , trail: 60 // Afterglow percentage
        , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
        , zIndex: 2e9 // The z-index (defaults to 2000000000)
        , className: 'spinner' // The CSS class to assign to the spinner
        , top: '50%' // Top position relative to parent
        , left: '51%' // Left position relative to parent
        , shadow: false // Whether to render a shadow
        , hwaccel: false // Whether to use hardware acceleration
        , position: 'absolute' // Element positioning
    }
    Template.ModalIRConfig.spinnerHolder = this.$('#status')[0];
    Template.ModalIRConfig.spinner = new Spinner(opts);
    Template.ModalIRConfig.spinner.stop();
});
Template.ModalIRConfig.helpers({
    modalId: function() { return 'modal-settings';}
});
Template.ModalIRConfig.events({
    'hide.bs.modal .modal': function(event, instance) {
        Template.ModalIRConfig.spinner.stop();
        if(Meteor.isCordova) {
            RemoteIRLib.cancelConfig(function (res){
                myAlert(JSON.stringify(res));
            },
            function(err) {
                myAlert(JSON.stringify(err));
            });
        }
    },
    'click #IRConfig': function(event, instance) {
        var IRHubName = instance.$('#inputNameConfig').val().trim(); 
        var wifiSSID = instance.$('#inputSSIDConfig').val().trim();
        var wifiKey = instance.$('#inputPasswordConfig').val().trim();         

        if (IRHubName.length == 0) {
            instance.$('#inputNameConfig').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputNameConfig').parent().removeClass('has-error');
            }, 2000);
        }
        else if (wifiSSID.length == 0) {
            instance.$('#inputSSIDConfig').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputSSIDConfig').parent().removeClass('has-error');
            }, 2000);
        }
        else if (wifiKey.length == 0) {
            instance.$('#inputPasswordConfig').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputPasswordConfig').parent().removeClass('has-error');
            }, 2000);
        }
        else {
            console.log(Template.ModalIRConfig.spinner);
            console.log(Template.ModalIRConfig.spinnerHolder);
            Template.ModalIRConfig.spinner.spin(Template.ModalIRConfig.spinnerHolder);
            if( Meteor.isCordova ) {
                RemoteIRLib.configure(function(res) {
                    if(res && res.DEVICE_ID && res.DEVICE_KEY) {
                        Meteor.apply('addIRHub', [{
                            deviceId: res.DEVICE_ID,
                            name: IRHubName,
                            deviceKey: res.DEVICE_KEY,
                        }], {wait: false});
                    }
                    else {
                        alert('Configure error ' + JSON.stringify(res));
                    }
                    instance.$('#modal-ir-config').modal('hide');
                }, function(err) {
                    alert("Config failed " + JSON.stringify(err));
                    instance.$('#modal-ir-config').modal('hide');
                }, wifiSSID, wifiKey);
            }
            else {
                alert(TAPi18n.__("Not supported for browser"));
            }
        }
    }
});
var opts = {
      lines: 11 // The number of lines to draw
    , length: 4 // The length of each line
    , width: 2 // The line thickness
    , radius: 4 // The radius of the inner circle
    , scale: 1.0 // Scales overall size of the spinner
    , corners: 0.7 // Corner roundness (0..1)
    , color: '#fff' // #rgb or #rrggbb or array of colors
    , opacity: 0.5 // Opacity of the lines
    , rotate: 0 // The rotation offset
    , direction: 1 // 1: clockwise, -1: counterclockwise
    , speed: 0.5 // Rounds per second
    , trail: 60 // Afterglow percentage
    , fps: 20 // Frames per second when using setTimeout() as a fallback for CSS
    , zIndex: 2e9 // The z-index (defaults to 2000000000)
    , className: 'spinner' // The CSS class to assign to the spinner
    , top: '50%' // Top position relative to parent
    , left: '51%' // Left position relative to parent
    , shadow: false // Whether to render a shadow
    , hwaccel: false // Whether to use hardware acceleration
    , position: 'absolute' // Element positioning
};
Template.ModalIRHub.helpers({
    IRHubName: function() {
        return Session.get('ir-hub-name');
    },
    IRHubStatus: function(instance) {
        var IRHubStt = Session.get('ir-hub-status');
        return IRHubStt?IRHubStt:'UNKNOWN';
    },
    IRHubId: function() {
        return Session.get('ir-hub-device-id');
    },
    IRHubKey: function() {
        return Session.get('ir-hub-key');
    },
    irhub: function() {
        var irHubId = Router.current().params.id;
        irHubId = parseInt(irHubId);
		return IRHub.find({ id: irHubId }).fetch()[0];
    }
});
Template.ModalIRHub.events({
    'click #delete': function(event, instance) {
        var irHubId = Session.get('ir-hub-id');
        irHubId = parseInt(irHubId);
        myConfirm( TAPi18n.__("Are you sure?"), TAPi18n.__("Do you really want to remove this device?"), function() {
            Meteor.apply('removeIRHub', [irHubId], {wait: false});
        });
    },
    'click #wifi-config': function() {
        if(event.target.checked) {
            Template.instance().$('#wifi-setting').show(500);
            Template.instance().$('#config').show(500);
            Template.instance().$('#cancel').show(500);
        }
        else {
            Template.instance().$('#wifi-setting').hide(500);
            Template.instance().$('#config').hide(500);
            Template.instance().$('#cancel').hide(500);
        }
    },
    'click #cancel': function(event, instance) {
        Template.instance().$('#cancel').hide(500);
    },
    'click #config': function(event, instance) {
        var IRHubName = instance.$('#inputName').val().trim(); 
        var wifiSSID = instance.$('#inputSSID').val().trim();
        var wifiKey = instance.$('#inputPassword').val().trim();         

        if (IRHubName.length == 0) {
            instance.$('#inputName').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputName').parent().removeClass('has-error');
            }, 2000);
        }
        else if (wifiSSID.length == 0) {
            instance.$('#inputSSID').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputSSID').parent().removeClass('has-error');
            }, 2000);
        }
        else if (wifiKey.length == 0) {
            instance.$('#inputPassword').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputPassword').parent().removeClass('has-error');
            }, 2000);
        }
        else {
            if( Template.ModalIRHub.spinner ) Template.ModalIRHub.spinner.stop();
            Template.ModalIRHub.spinnerHolder = instance.$('#config span')[0];
            Template.ModalIRHub.spinner = new Spinner(opts);
            Template.ModalIRHub.spinner.spin(Template.ModalIRHub.spinnerHolder);

            if( Meteor.isCordova ) {
                RemoteIRLib.configure(function(res) {
                    if(res && res.DEVICE_ID && res.DEVICE_KEY) {
                        Meteor.apply('updateIRHub', [{
                            deviceId: res.DEVICE_ID,
                            name: IRHubName,
                            deviceKey: res.DEVICE_KEY
                        }], {wait: false});
                    }
                    else {
                        alert('Configure error ' + JSON.stringify(res));
                    }
                    Template.ModalIRHub.spinner.stop();
                    instance.$('#modal-ir-hub').modal('hide');
                }, function(err) {
                    alert("Config failed " + JSON.stringify(err));
                    Template.ModalIRHub.spinner.stop();
                    instance.$('#modal-ir-hub').modal('hide');
                }, wifiSSID, wifiKey);
            }
            else {
                alert(TAPi18n.__("Not supported for browser"));
            }
        }
    },
    'click #probe': function(event, instance) {
        if(Meteor.isCordova) {
            var irHubDeviceId = Session.get('ir-hub-device-id');
            var irHubDeviceKey = Session.get('ir-hub-key');

            if( Template.ModalIRHub.spinner ) Template.ModalIRHub.spinner.stop();
            Template.ModalIRHub.spinnerHolder = instance.$('#probe span')[0];
            Template.ModalIRHub.spinner = new Spinner(opts);
            Template.ModalIRHub.spinner.spin(Template.ModalIRHub.spinnerHolder);

            RemoteIRLib.probe(function(res) {
                    myAlert(JSON.stringify(res));
                    if( res ) {
                        //if(res.DEVICE_IP && res.DEVICE_SERVER_IP) {
                        if(res.DEVICE_IP) {
                            Session.set('ir-hub-status', 'ONLINE');
                            instance.$('#irHubStatus').removeClass();
                            instance.$('#irHubStatus').addClass('text-center text-success bg-success full-width');
                        }
                        Template.ModalIRHub.spinner.stop();
                    }
                    else {
                        myAlert("Probe error " + JSON.stringify(res));
                        instance.$('#irHubStatus').removeClass();
                        instance.$('#irHubStatus').addClass('text-center text-danger bg-danger full-width');
                        Session.set('ir-hub-status', 'OFFLINE');
                        Template.ModalIRHub.spinner.stop();
                    }
                }, function(err) {
                    myAlert("Probe failed " + JSON.stringify(err));
                    instance.$('#irHubStatus').removeClass();
                    instance.$('#irHubStatus').addClass('text-center text-danger bg-danger full-width');
                    Session.set('ir-hub-status', 'OFFLINE');
                    Template.ModalIRHub.spinner.stop();
                }, irHubDeviceId, irHubDeviceKey
            );
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }
    },
    'show.bs.modal .modal': function(event, instance) {
        instance.$('#wifi-config').attr('checked',false);
        instance.$('#wifi-setting').hide();
        instance.$('#config').hide();
    }
});

Template.ModalIRControl.onRendered(function(){
});

Template.ModalIRControl.helpers({
    devName: function() {
        return Session.get('ir-dev-name');
    },
    irModelId: function() {
        return Session.get('ir-model-id');
    },
    irHubId: function() {
        return Session.get('ir-hub-id');
    },
    irHubKey: function() {
        return Session.get('ir-hub-key');
    },
    irHubStatus: function() {
        var hubIP = Session.get('ir-hub-ip');
        var hubServerIP = Session.get('ir-hub-server-ip');
        //return  (hubIP == null || hubServerIP == null) ? "Offline":"Online";
        return  (hubIP == null) ? "Offline":"Online";
    },
    irHubStatusStyle: function() {
        //return (Session.get('ir-hub-ip') == null || Session.get('ir-hub-server-ip') == null) ? "text-danger bg-danger":"text-success bg-success";
        return (Session.get('ir-hub-ip') == null) ? "text-danger bg-danger":"text-success bg-success";
    },
    probeStatus: function() {
        return Session.get('ir-hub-probe');
    },
    commandStatus: function() {
        return Session.get('ir-command-status');
    },
    IRCmd: function() {
        var irModelId = Session.get('ir-model-id');
        irModelId = parseInt(irModelId);
        console.log(irModelId);
        return IRCommand.find({modelId: irModelId}).fetch();
    },
    itemIcon: function(icon) {
        return IRIconControlList[icon].icon;
    }
});
Template.ModalIRControl.events({
    'click .ir-cmd-item': function(event, instance) {
        var irDeviceId = event.currentTarget.getAttribute('data-irModelId');
        var deviceIP = Session.get('ir-hub-ip');
        var irHubId = event.currentTarget.getAttribute('data-irHubId');
        var irHubIP = Session.get("ir-hub-ip");
        var irHubServerIP = Session.get('ir-hub-server-ip');
        var irCommand = event.currentTarget.getAttribute('data-command');
        var irHubKey = event.currentTarget.getAttribute('data-irHubKey');

        if( Meteor.isCordova && irHubIP != null) {
            Session.set('ir-command-status', 'Sending command ...');
            instance.$('#mask').css('display', 'block');
            RemoteIRLib.sendCommand(function(res) {
                    myAlert(res);
                    Session.set('ir-command-status', 'Send command SUCCESS');
                    instance.$('#mask').css('display', 'none');
                }, function(err) {
                    myAlert("Send command error " + err);
                    Session.set('ir-command-status', 'Send command ERROR');
                    instance.$('#mask').css('display', 'none');
                }, irHubId, irHubIP, irHubServerIP, irCommand
            );
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }
    },
    'show.bs.modal .modal': function(event, instance) {
        console.log(instance.$(".rippler"));
        Meteor.setTimeout(function() {
            instance.$(".rippler").rippler({
                effectClass      :  'rippler-effect'
                ,effectSize      :  16      // Default size (width & height)
                ,addElement      :  'div'   // e.g. 'svg'(feature)
                ,duration        :  900
            });
        }, 100);
        var irHubId = Session.get('ir-hub-id');
        var irHubKey = Session.get('ir-hub-key');
        if(Meteor.isCordova) {
            Session.set('ir-hub-probe', 'probing ...');
            RemoteIRLib.probe(
                function(res) {
                    if(res) {
                        myAlert(JSON.stringify(res));
                        if (res.DEVICE_IP) {
                            Session.set("ir-hub-ip", res.DEVICE_IP);
                        }
                        if (res.DEVICE_SERVER_IP) {
                            Session.set("ir-hub-server-ip", res.DEVICE_SERVER_IP);
                        }
                        Session.set('ir-hub-probe', '');
                    }
                }, function(err) {
                    Session.set('ir-hub-probe', '');
                    alert("probe failed " + JSON.stringify(err));
                }, irHubId, irHubKey
            );
        }
    }
});

Template.ModalIRControlAC.onRendered(function(){
});

Template.ModalIRControlAC.helpers({
    devName: function() {
        return Session.get('ir-dev-name');
    },
    irModelId: function() {
        return Session.get('ir-model-id');
    },
    irHubId: function() {
        return Session.get('ir-hub-id');
    },
    irHubKey: function() {
        return Session.get('ir-hub-key');
    },
    irHubStatus: function() {
        var hubIP = Session.get('ir-hub-ip');
        var hubServerIP = Session.get('ir-hub-server-ip');
        //return  (hubIP == null || hubServerIP == null) ? "Offline":"Online";
        return  (hubIP == null) ? "Offline":"Online";
    },
    irHubStatusStyle: function() {
        //return (Session.get('ir-hub-ip') == null || Session.get('ir-hub-server-ip') == null) ? "text-danger bg-danger":"text-success bg-success";
        return (Session.get('ir-hub-ip') == null) ? "text-danger bg-danger":"text-success bg-success";
    },
    probeStatus: function() {
        return Session.get('ir-hub-probe');
    },
    commandStatus: function() {
        return Session.get('ir-command-status');
    },
    IRCmd: function() {
        var irModelId = Session.get('ir-model-id');
        irModelId = parseInt(irModelId);
        console.log(irModelId);
        return IRCommand.find({
            $and: [
                {modelId: irModelId},
                {name:  {"$nin": ['17','18','19','20','21','22','23','24','25','26','27', '28','29','30','31','32', 'On', 'Off']}}
            ]
        }).fetch();
    },
    itemIcon: function(icon) {
        return IRIconControlList[icon].icon;
    },
    tempInfo: function() {
        var devId = Session.get('ir-dev-id');
        var tempId = "__temp" + devId;
        var temp = Session.get(tempId);

        if (!temp) {
            console.log(tempId);
            temp = parseInt(window.localStorage.getItem(tempId));
        }
        return temp?temp:23;
    },
    fanInfo: function() {
        var fan = Session.get('fan-info');
        if (!fan) {
            fan = parseInt(window.localStorage.getItem("__fan"));
        }
        return fan?fan:"NA";
    },
    modeInfo: function() {
        var mode = Session.get('mode-info');
        if (!mode) {
            mode = parseInt(window.localStorage.getItem("__mode"));
        }
        return mode?mode:"NA";
    }
});

function doCommand(irDeviceId,deviceIP,irHubId,irHubIP,irHubServerIP,irCommand,irHubKey) {
    if( Meteor.isCordova && irHubIP != null) {
        Session.set('ir-command-status', 'Sending command ...');
        instance.$('#mask').css('display', 'block');
        RemoteIRLib.sendCommand(function(res) {
                myAlert(res);
                Session.set('ir-command-status', 'Send command SUCCESS');
                instance.$('#mask').css('display', 'none');
            }, function(err) {
                myAlert("Send command error " + err);
                Session.set('ir-command-status', 'Send command ERROR');
                instance.$('#mask').css('display', 'none');
            }, irHubId, irHubIP, irHubServerIP, irCommand
        );
    }
    else {
        alert(TAPi18n.__("Not supported for browser"));
    }    
}

Template.ModalIRControlAC.events({
    'click #power-btn': function(event, instance) {
        var devId = Session.get('ir-dev-id');
        var powerId = "__power" + devId;
        var irDeviceId = parseInt(Session.get('ir-model-id'));
        var deviceIP = Session.get('ir-hub-ip');
        var irHubId = Session.get('ir-hub-id');
        var irHubIP = Session.get("ir-hub-ip");
        var irHubServerIP = Session.get('ir-hub-server-ip');

        var powerStatus = window.localStorage.getItem(powerId);

        if (!powerStatus || powerStatus === 'off') {
            var irCmd = IRCommand.find({
                $and: [
                    {modelId: irDeviceId},
                    {name: 'On'}
                ]
            }).fetch()[0];
            window.localStorage.setItem(powerId, 'on');
        }
        else {
             var irCmd = IRCommand.find({
                $and: [
                    {modelId: irDeviceId},
                    {name: 'Off'}
                ]
            }).fetch()[0];
            window.localStorage.setItem(powerId, 'off');
        }

        if (irCmd) {
            var irCommand = irCmd.irData;
        }
        var irHubKey = Session.get('ir-hub-key');

        console.log(irDeviceId+"-"+deviceIP +"-"+irHubId+"-"+ irHubIP+"-"+ irHubServerIP+"-"+ irCommand+"-"+ irHubKey);

        if( Meteor.isCordova && irHubIP != null) {
            Session.set('ir-command-status', 'Sending command ...');
            instance.$('#mask').css('display', 'block');
            RemoteIRLib.sendCommand(function(res) {
                    myAlert(res);
                    Session.set('ir-command-status', 'Send command SUCCESS');
                    instance.$('#mask').css('display', 'none');
                }, function(err) {
                    myAlert("Send command error " + err);
                    Session.set('ir-command-status', 'Send command ERROR');
                    instance.$('#mask').css('display', 'none');
                }, irHubId, irHubIP, irHubServerIP, irCommand
            );
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }    
    },
    'click #up-btn': function(event, instance) {
        var devId = Session.get('ir-dev-id');
        var tempId = "__temp" + devId;
        var irDeviceId = parseInt(Session.get('ir-model-id'));
        var deviceIP = Session.get('ir-hub-ip');
        var irHubId = Session.get('ir-hub-id');
        var irHubIP = Session.get("ir-hub-ip");
        var irHubServerIP = Session.get('ir-hub-server-ip');

        var temp = parseInt(window.localStorage.getItem(tempId));
        if (!temp) {
            temp = 23;
        }
        else if (temp < 28) {
            temp = temp + 1;
        }
        else if (temp === 28) {
            return;
        }
        temp = temp.toString();

        var irCmd = IRCommand.find({
                $and: [
                    {modelId: irDeviceId},
                    {name: temp}
                ]
                }).fetch()[0];
        window.localStorage.setItem(tempId, temp);
        Session.set(tempId, temp);

        if (irCmd) {
            var irCommand = irCmd.irData;
        }
        var irHubKey = irHubKey = Session.get('ir-hub-key');

        console.log(irDeviceId+"-"+deviceIP +"-"+irHubId+"-"+ irHubIP+"-"+ irHubServerIP+"-"+ irCommand+"-"+ irHubKey+"-"+temp);

        if( Meteor.isCordova && irHubIP != null) {
            Session.set('ir-command-status', 'Sending command ...');
            instance.$('#mask').css('display', 'block');
            RemoteIRLib.sendCommand(function(res) {
                    myAlert(res);
                    Session.set('ir-command-status', 'Send command SUCCESS');
                    instance.$('#mask').css('display', 'none');
                }, function(err) {
                    myAlert("Send command error " + err);
                    Session.set('ir-command-status', 'Send command ERROR');
                    instance.$('#mask').css('display', 'none');
                }, irHubId, irHubIP, irHubServerIP, irCommand
            );
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }    
    },
    'click #down-btn': function(event, instance) {
        var devId = Session.get('ir-dev-id');
        var tempId = "__temp" + devId;
        var irDeviceId = parseInt(Session.get('ir-model-id'));
        var deviceIP = Session.get('ir-hub-ip');
        var irHubId = Session.get('ir-hub-id');
        var irHubIP = Session.get("ir-hub-ip");
        var irHubServerIP = Session.get('ir-hub-server-ip');

        var temp = parseInt(window.localStorage.getItem(tempId));
        if (!temp) {
            temp = 23;
        }
        else if (temp > 17) {
            temp = temp - 1;
        }
        else if (temp === 17) {
            return;
        }

       temp = temp.toString();

        var irCmd = IRCommand.find({
                $and: [
                    {modelId: irDeviceId},
                    {name: temp}
                ]
                }).fetch()[0];

        window.localStorage.setItem(tempId, temp);
        Session.set(tempId, temp);

        if (irCmd) {
            var irCommand = irCmd.irData;
        }
        var irHubKey = irHubKey = Session.get('ir-hub-key');

        console.log(irDeviceId+"-"+deviceIP +"-"+irHubId+"-"+ irHubIP+"-"+ irHubServerIP+"-"+ irCommand+"-"+ irHubKey+"-"+temp);

        if( Meteor.isCordova && irHubIP != null) {
            Session.set('ir-command-status', 'Sending command ...');
            instance.$('#mask').css('display', 'block');
            RemoteIRLib.sendCommand(function(res) {
                    myAlert(res);
                    Session.set('ir-command-status', 'Send command SUCCESS');
                    instance.$('#mask').css('display', 'none');
                }, function(err) {
                    myAlert("Send command error " + err);
                    Session.set('ir-command-status', 'Send command ERROR');
                    instance.$('#mask').css('display', 'none');
                }, irHubId, irHubIP, irHubServerIP, irCommand
            );
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }    
    },
    'click .ir-cmd-item': function(event, instance) {
        var irDeviceId = event.currentTarget.getAttribute('data-irModelId');
        var deviceIP = Session.get('ir-hub-ip');
        var irHubId = event.currentTarget.getAttribute('data-irHubId');
        var irHubIP = Session.get("ir-hub-ip");
        var irHubServerIP = Session.get('ir-hub-server-ip');
        var irCommand = event.currentTarget.getAttribute('data-command');
        var irHubKey = event.currentTarget.getAttribute('data-irHubKey');

        if( Meteor.isCordova && irHubIP != null) {
            Session.set('ir-command-status', 'Sending command ...');
            instance.$('#mask').css('display', 'block');
            RemoteIRLib.sendCommand(function(res) {
                    myAlert(res);
                    Session.set('ir-command-status', 'Send command SUCCESS');
                    instance.$('#mask').css('display', 'none');
                }, function(err) {
                    myAlert("Send command error " + err);
                    Session.set('ir-command-status', 'Send command ERROR');
                    instance.$('#mask').css('display', 'none');
                }, irHubId, irHubIP, irHubServerIP, irCommand
            );
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }
    },
    'show.bs.modal .modal': function(event, instance) {
        //console.log(instance.$(".rippler"));
        Meteor.setTimeout(function() {
            instance.$(".rippler").rippler({
                effectClass      :  'rippler-effect'
                ,effectSize      :  16      // Default size (width & height)
                ,addElement      :  'div'   // e.g. 'svg'(feature)
                ,duration        :  900
            });
        }, 100);
        var irHubId = Session.get('ir-hub-id');
        var irHubKey = Session.get('ir-hub-key');
        if(Meteor.isCordova) {
            Session.set('ir-hub-probe', 'probing ...');
            RemoteIRLib.probe(
                function(res) {
                    if(res) {
                        myAlert(JSON.stringify(res));
                        if (res.DEVICE_IP) {
                            Session.set("ir-hub-ip", res.DEVICE_IP);
                        }
                        if (res.DEVICE_SERVER_IP) {
                            Session.set("ir-hub-server-ip", res.DEVICE_SERVER_IP);
                        }
                        Session.set('ir-hub-probe', '');
                    }
                }, function(err) {
                    Session.set('ir-hub-probe', '');
                    alert("probe failed " + JSON.stringify(err));
                }, irHubId, irHubKey
            );
        }
    }
});
