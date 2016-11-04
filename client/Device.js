var handle;
function getIcon(type, icon) {
    var iconList = null;
    switch(type) {
        case Constants.DEVTYPE_CURTAIN:
            iconList = CurtainIconList;
            break;
        case Constants.DEVTYPE_SCENE:
            iconList = SceneIconList;
            break;
        case Constants.DEVTYPE_IR:
            iconList = IRIconList;
            break;
        default:
            iconList = LampIconList;
            break;
    }
    var newIcon = icon % iconList.length;
    return {iconName:iconList[icon % iconList.length].icon,iconIdx:newIcon};
}

Template.Device.onRendered(function() {
 /*   var elems = Array.prototype.slice.call(document.querySelectorAll('.js-switch'));
    elems.forEach(function (html) {
        var switchery = new Switchery(html, {
            size: 'small',
            color: '#008dd0',
            secondaryColor: '#eeeeee'
        });
    });
*/
    var self = this;


    var iconElem = self.$("li > div > i#icon");
    var type = parseInt(iconElem.attr('data-type'));
    var icon = parseInt(iconElem.attr('data-icon'));
    var classes = "icon icon-big icon-fit iot-icon-" + getIcon(type, icon).iconName;
    iconElem.removeClass();
    console.log(classes);
    iconElem.addClass(classes);

    CALLBACKS.saveBtn = function(){
        var devId = parseInt(Router.current().params.id);
        var timeObjs = self.$('input.time-select');
        var actionObjs = self.$('input.mbsc-control');
        var length = timeObjs.size();
        for( var i = 0; i < length; i++ ) {
            var timeObj = timeObjs.eq(i);
            var taskId = parseInt(timeObj.attr('data-id'));
            
            Meteor.apply('updateTask', [{
                id: parseInt(timeObj.attr('data-id')),
                time: timeObj.val(),
                action: (actionObjs.eq(i).val() == TAPi18n.__("turnon"))
            }], {wait:false});
        }
        var ret = Meteor.apply('updateDevice', [{
            id: devId,
            name: self.$('#deviceName').val(),
            icon: parseInt(self.$('li > div > i#icon').attr('data-icon'))
        }], {wait: false});
        console.log(ret);
    }
    var timeoutHandle = null;
    handle = Task.find().observe({
        added: function(arg) {
            if( timeoutHandle != null ) {
                Meteor.clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }
            timeoutHandle = Meteor.setTimeout(function() {
                self.$('.time-select').mobiscroll().time({
                    theme: 'mobiscroll', 
                    lang: 'en',           
                    display: 'bottom',
                    headerText: false,   
                    maxWidth: 90,
                    onSelect: function(valueText, inst) {
                        Session.set('show-save-btn', true);
                    }
                });
                self.$('.list-down').mobiscroll().select({
                    theme: 'mobiscroll', 
                    lang: 'en', 
                    display: 'bottom', 
                    inputClass: "full-width text-right",
                    minWidth: 200,
                    onSelect: function(valueText, inst) {
                        Session.set('show-save-btn', true);
                    }
                });
                timeoutHandle = null;
            }, 500);
        }
    });
});

Template.Device.onDestroyed(function() {
    handle.stop();
    CALLBACKS.saveBtn = null;
});
function showSaveBtn(event, instance) {
    Session.set('show-save-btn', true);
}

function hideSaveBtn(event, instance) {
    Session.set('show-save-btn', false);
}

function addZero(i) {
    if (i < 10) {
        i = "0" + i;
    }
    return i;
}

Template.Device.events({
    'input input.glass': showSaveBtn,
    'click #addTask': function(event, instance) {
        console.log('Add task');
        var date = new Date();
        date.setTime(date.getTime() - 300000);
        var h = date.getHours();
        var m = date.getMinutes();
        var ampm = ['AM', 'PM'];
        Meteor.apply('addTask', [{
			action: false,
			time: addZero((h + 11)%12 + 1) + ":" + addZero(date.getMinutes()) + " " + ampm[Math.floor(h/12)],
			deviceId: parseInt(Router.current().params.id)
		}], {wait: false});

        Session.set('show-save-btn', true);
    },
    "click span[data-action='remove-task']": function(event, instance) {
        var task_id = parseInt(event.currentTarget.getAttribute('data-id'));
        myConfirm( TAPi18n.__("Are you sure?"), TAPi18n.__("Do you really want to remove this task?"), function() {
            Meteor.apply('removeTask', [task_id], {wait: false});
        });
    },
    'click button#removeDevice': function(event) {
        var devId = parseInt(Router.current().params.id);
        myConfirm( TAPi18n.__("Are you sure?"), TAPi18n.__("Do you really want to remove this device?"), function() {
            Meteor.apply('removeDevice', [devId], {wait:false});
            Router.go('/Rooms');
        });
    },
    'click i#icon': function(event) {
        var iconElem = $(event.currentTarget);
        var type = parseInt(iconElem.attr('data-type'));
        var icon = parseInt(iconElem.attr('data-icon'));
        icon = icon + 1;
        var obj = getIcon(type, icon);
        iconElem.attr("data-icon", obj.iconIdx);
        iconElem.removeClass();
        iconElem.addClass("icon icon-big iot-icon-" + obj.iconName);
        showSaveBtn();
    }
});

Template.Device.helpers(PageHelpers);
Template.Device.helpers({
    device: function() {
        var devId = Router.current().params.id;
        devId = parseInt(devId);
		return Device.find({ id: devId }).fetch()[0];
    },
    room: function() {
        var roomId = Router.current().params.gid;
        return Group.find({ id: parseInt(roomId) }).fetch()[0].name;
    },
    tasks: function() {
        var devId = Router.current().params.id;
        var tsks = Task.find({deviceId: parseInt(devId)}).fetch();
        Session.set('taskCount', tsks.length);
        return tsks;
    },
    selected: function(action) {
        return action?"selected":"";
    },
    notSelected: function(action) {
        return action?"":"selected";
    },
});
