Template.More.onRendered(function(){
    var self = this;

    Meteor.call("getServerInfo", function (error, result) {
        window.localStorage.setItem("__version", result.version);
    });

    Meteor.setTimeout(function(){
        self.$(".rippler").rippler({
            effectClass      :  'rippler-effect'
            ,effectSize      :  16      // Default size (width & height)
            ,addElement      :  'div'   // e.g. 'svg'(feature)
            ,duration        :  400
        });
    }, 100);
});

Template.More.events({
    'click a[data-action]': function(event, instance) {
        var elem = event.currentTarget;
        var dataAction = elem.getAttribute('data-action');
        if(dataAction) {
            Meteor.setTimeout( function() {
                Session.set('dialog-name', dataAction);
                $('#modal-config').modal();
            }, 200);
        }
    },
    'click a#language': function(event, instance) {
        var lang = window.localStorage.getItem("__lang");
        if (lang == 'vn') lang = 'en';
        else lang = 'vn';
        window.localStorage.setItem("__lang", lang);
        Meteor.setTimeout(function() {
            window.location.reload();
        }, 10);
    },
    'click a[data-href]': function(event, instance) {
        var url = event.currentTarget.getAttribute('data-href');
        Meteor.setTimeout(function(){
            Router.go(url);
        }, 200);
    },
    'click a#clock-syn': function(event, instance) {
        Meteor.apply('syncClock', [Date.now()], {wait:false}, function(err, res) {
            console.log(res);
            if (res) {
                Session.set("time",res);
            }
        });
    }, 
    'click a#KBSound': function(event, instance) {
        console.log("Clicked KBSound");
        if(Meteor.isCordova) { 
            startApp.set({ /* params */
                "component": ["com.xpg.iselect","com.xpg.iselect.StartActivity"],
                "flags": ["FLAG_ACTIVITY_NEW_TASK"]
            }).start();
        }
        else {
            alert(TAPi18n.__("Not supported for browser"));
        }
    },
    'click a#diagnostic': function(event, instance) {
        Meteor.call("diagnostic", function (error, result) {
            console.log("Diagnostic: " + result);
        });
    },
    'click a.ir-hub': function(event, instance) {
        Session.set('ir-hub-id', event.currentTarget.getAttribute('data-id'));
        Session.set('ir-hub-name', event.currentTarget.getAttribute('data-name'));
        Session.set('ir-hub-device-id', event.currentTarget.getAttribute('data-device-id'));
        Session.set('ir-hub-key', event.currentTarget.getAttribute('data-key'));
    }
});
Template.More.helpers(PageHelpers);
Template.More.helpers({
    irhubs: function() {
        return IRHub.find({}).fetch();
    },
    version1: function() {
        var version = window.localStorage.getItem("__version");
        console.log(version);
        if (version == "1" || !version) {
            return true;
        }
        else {
            return false;
        }
    }
});

Template.More.helpers({
    language: function() {
        var lang = window.localStorage.getItem("__lang");
        if (!lang) {
            lang = "vn";
            window.localStorage.setItem("__lang", lang);
        }
        return lang.toUpperCase();
    },
    time :function() {
        var time = Session.get("time");
        return time;
    }
});
