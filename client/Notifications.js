Template.Notifications.onRendered(function(){
    Session.set('notification-count', 0);
});
Template.Notifications.helpers(PageHelpers);
Template.Notifications.helpers({
    notification: function(){
        return Meteor.Notification.items_reverse();
    },
    newClass: function(notif) {
        if(notif && notif.isNew == true) {
            notif.isNew = false;
            return "iot-color-lg";
        }
        return "iot-color-llg";
    },
    icon: function(type) {
        return IconList[type].icon;
    }
});
