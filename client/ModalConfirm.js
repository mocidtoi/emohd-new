Template.ModalConfirm.onRendered(function(){
    console.log("Modal confirm rendered");
});
Template.ModalConfirm.helpers({
    title: function() {
        return Session.get('confirm-title');
    },
    content: function() {
        return Session.get('confirm-content');
    },
    dev: function() {
        var devId = Session.get('deviceTarget');
        devId = parseInt(devId);
        var device = Device.find({id: devId}).fetch()[0];
        if (device) {
            var netAdd = device.netadd;
        }
        return Device.find({netadd: netAdd}).fetch();
    }
});

Template.ModalConfirm.events({
    'hidden.bs.modal #confirm': function() {
        Template.ModalConfirm.cbFunc = undefined;
    },
    'click #ok': function(event, instance) {
        Template.ModalConfirm.cbFunc();
    },
    'click #cancel': function(event, instance) {
        console.log("Cancel clicked");
    }
});
