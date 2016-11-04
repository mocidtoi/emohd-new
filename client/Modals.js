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

Template.ModalIRConfig.helpers({
    modalId: function() { return 'modal-settings';}
});

Template.ModalIRConfig.events({
    'click #config': function(event, instance) {
        var params = new Object();
        params.IRHubName = instance.$('#inputName').val().trim(); 
        params.IRHubId = instance.$('#inputSSID').val().trim();
        params.IRHubKey = instance.$('#inputPassword').val().trim();         
        console.log(params);

        if (params.IRHubName.length == 0) {
            console.log("empty name");
            instance.$('#inputName').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputName').parent().removeClass('has-error');
            }, 2000);
        }
        else if (params.IRHubId.length == 0) {
            console.log("empty id");
            instance.$('#inputSSID').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputSSID').parent().removeClass('has-error');
            }, 2000);
        }
        else if (params.IRHubKey.length == 0) {
            console.log("empty key");
            instance.$('#inputPassword').parent().addClass('has-error');
            setTimeout(function(){
                instance.$('#inputPassword').parent().removeClass('has-error');
            }, 2000);
        }
        else {
            Meteor.apply('addIRHub', [{
                deviceId: params.IRHubId,
                name: params.IRHubName,
                deviceKey: params.IRHubKey,
                }], {wait: false});
            instance.$('#modal-ir-config').modal('hide');
        }
    }
});
Template.ModalIRHub.helpers({
    IRHubName: function() {
        return Session.get('ir-hub-name');;
    },
    IRHubStatus: function(instance) {
        return "UNKNOWN";;
    },
    IRHubId: function() {
        return Session.get('ir-hub-device-id');;
    },
    IRHubKey: function() {
        return Session.get('ir-hub-key');;
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
    }

});
