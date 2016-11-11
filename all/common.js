import { Meteor } from 'meteor/meteor';

Constants = {
    DEVTYPE_IR: 3,
    DEVTYPE_CURTAIN:2,
    DEVTYPE_SCENE:1,
    DEVTYPE_DEVICE:0,
    SHUFFLE: 1,
    PREVIOUS: 2,
    PLAYPAUSE: 3,
    NEXT: 4,
    LED_FILE: '/sys/class/leds/beaglebone:green:usr2',
//    LED_FILE: '/Users/remurd/workspace/meteor/emohd/beaglebone:green:usr2',
    ADMIN_URL:"http://169.254.10.1:8090/"
    //ADMIN_URL:"http://localhost:5000/"
};

TOKEN=null;
var homeRouteOpt = {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        this.render('Favorites');
        setActiveTab(1);
    }
};
Router.route('/Rooms', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        this.render('Rooms');
        setupModalAddRoom(this);
        setupModalUpdateRoom(this);
        this.render('ModalAddDevice', {to: "modal-adddev"});
        this.render('ModalCurtainControl', {to: "modal-curtain"});
        setActiveTab(2);
    }
});
Router.route('/', homeRouteOpt);
Router.route('/Favorites', homeRouteOpt);
Router.route('/Scenes', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        setActiveTab(3);
        this.render('Scenes');
        setupModalAddScene(this);
    }
});
Router.route('/Notifications', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        Session.set("title", "Notifications");
        setActiveTab(4);
        this.render('Notifications');
    }
});
Router.route('/More', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        setActiveTab(5);
        Session.set("title", TAPi18n.__("More") + " ...");
        this.render('More');
        this.render('ModalConfig', {to: "modal-config"});
    }
});

Router.route('/Device/:gid/:id', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        Session.set("title", "_");
        this.render('Device');
        this.render('CancelBtn', {to: "leftNav"});

        setBackLink("/Rooms");
        this.render('SaveBtn', {to: "rightNav"});
        setActiveTab(-1);
    }
});

Router.route('/Scene/:scid', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe data: token=' + TOKEN);
        var res = Meteor.subscribe('data', TOKEN);
        return [ res ];
    },
    action: function() {
        Session.set("title", "_");
        this.render("Scene");
        this.render('CancelBtn', {to: 'leftNav'});
        setBackLink('/Scenes');
        this.render('SaveBtn', {to: "rightNav"});
        setActiveTab(-1);
    }
});
Router.route('/Musics', {
    layoutTemplate:"ApplicationLayout",
    loadingTemplate: 'LoadingScreen1',
    waitOn: function() {
        console.log('Subscribe music: token=' + TOKEN);
        var res = Meteor.subscribe('music', TOKEN);
        return [
            res
        ];
    },
    action: function() {
        Session.set('title', "Musics");
        this.render("Musics");
        this.render("Player", {to: 'player'});
        this.render('SettingsBtn', {to: "rightNav"});
        this.render('ModalConfig', {to: "modal-config"});
        setActiveTab(-1);
    }
});

/*=======================================================
 *  ADMINISTRATION MODE
 *=======================================================*/
Router.route('/admin', {
    layoutTemplate: 'AdminLayout',
    loadingTemplate: 'AdminLoading',
    action:function() {
        this.render('navbar', {to: "navbar"});
        this.render('config');
    },
    waitOn: function() {
        console.log('waitOn Admin');
        var res = Meteor.subscribe('netconfigs');
        return [
            res
        ];
    }
});
Router.route('/admin/signin', {
    layoutTemplate: 'AdminLayout',
    loadingTemplate: 'AdminLoading',
    action: function() {
        this.render('navbar', {to: "navbar"});
        this.render('signin');
    },
    waitOn: function() {
        console.log('waitOn Admin');
        var res = Meteor.subscribe('netconfigs');
        return [
            res
        ];
    }
});
Router.route('/admin/config', {
    layoutTemplate: 'AdminLayout',
    loadingTemplate: 'AdminLoading',
    action:function() {
        this.layout('AdminLayout');
        this.render('navbar', {to: "navbar"});
        this.render('config');
    },
    waitOn: function() {
        console.log('waitOn Admin');
        var res = Meteor.subscribe('netconfigs');
        return [
            res
        ];
    }
});
Router.route('/admin/Guide', {
    layoutTemplate: 'AdminLayout',
    loadingTemplate: 'AdminLoading',
    action:function() {
        this.layout('AdminLayout');
        this.render('navbar', {to: "navbar"});
        this.render('Guide');
    },
    waitOn:null
});

/*=============== END ADMIN MODE ==================*/
function isIPv4(str) {
    var blocks = str.split('.');
    if( blocks.length != 4 ) return false;
    for( var i = 0; i < 4; i++ ) {
        var bNum = parseInt(blocks[i]);
        if(bNum < 0 || bNum > 256 ) return false;
    }
    return true;
}
zeroconf_discover = function(callback) {
    var zeroconf = cordova.plugins.zeroconf;

    var timeoutHandle = Meteor.setTimeout(function() {
        zeroconf_unwatch('_workstation._tcp.local.');
    }, 10*1000);

    zeroconf.watch('_workstation._tcp.local.', function(result) {
        var action = result.action;
        var service = result.service;

        if (action == 'added') {
            if( service.name.indexOf("dhome") > -1 ) {
                for( var i = 0; i < service.addresses.length; i++) {
                    // check for service name
                    if( isIPv4(service.addresses[i]) ) {
                        var res = new Object();
                        res.ip = service.addresses[i];
                        res.port = 7777;
                        Meteor.clearTimeout(timeoutHandle);
                        zeroconf.unwatch('_workstation._tcp.local.');
                        callback(null, res);
                        return;
                    }
                }
            }
            callback("No valid address found", null);
        }
    });
}

reconfigServer = function(rootURL, serverKey) {
    if( Meteor.isClient ) {
        if(typeof(Storage) !== "undefined") {
            window.localStorage.setItem("__root_url", rootURL);
            if(serverKey) {
                window.localStorage.setItem("__token", serverKey);
            }
            //alert("rootURL:" + rootURL + "\n" + serverKey);
            
            Meteor.setTimeout(function() {
                window.location.reload();
            }, 1000);
        }
        else {
            alert("Setting failed! No localStorage support");
        }
    }
}
myLog = function (message) {
    console.log(message);
}

if (Meteor.isClient) {
    TOKEN = window.localStorage.getItem("__token");
    Notifier = new EventDDP("emohd");

    Device = new Mongo.Collection('device');
    Group = new Mongo.Collection('group');
    SceneDev = new Mongo.Collection('scenedev');
    Task = new Mongo.Collection('task');
    Favorite = new Mongo.Collection('favorite');
    Scene = new Mongo.Collection('scene');
    IRHub = new Mongo.Collection('irhub');
    IRDevModel = new Mongo.Collection('irdevmodel');
    IRCommand = new Mongo.Collection('ircommand');

    Song = new Mongo.Collection('song');
    PlayingItem = new Mongo.Collection('playingItem');
    Progress = new Mongo.Collection('progress');

    Meteor.Notification = new Queue(20);
    ColorList = [
        "bg-cyan-800", "bg-teal-800", "bg-indigo-800", 
        "bg-blue-800", "bg-green-800", "bg-pink-800"
    ];
    LampIconList = [
        {icon:"den-chung", title:"Light", color:"bg-cyan-800"}, 
        {icon:"downlight", title: "Command", color: "bg-teal-800"},
        {icon:"den-trang-tri", title: "Curtain", color: "bg-indigo-800"},
        {icon:"den-tuong", title:"Fan", color:"bg-blue-800"}, 
        {icon:"den-hat-khe", title: "Air conditioner", color: "bg-green-800"},
        {icon:"den-chum", title: "Television", color: "bg-pink-800"} 
    ];
    CurtainIconList = [
        {icon:"rem-chung", title:"Light", color:"bg-cyan-800"}, 
        {icon:"rem-voan", title: "Command", color: "bg-teal-800"},
        {icon:"rem-cuon", title: "Curtain", color: "bg-indigo-800"},
        {icon:"rem-vai", title:"Fan", color:"bg-blue-800"}
        
    ];
    SceneIconList = [
        {icon:"script", title:"Light", color:"bg-cyan-800"}, 
        {icon:"power", title: "Command", color: "bg-teal-800"},
        {icon:"doc-sach", title: "Curtain", color: "bg-indigo-800"},
        {icon:"hang-ngay", title:"Fan", color:"bg-blue-800"}, 
        {icon:"thao-luan", title: "Air conditioner", color: "bg-green-800"},
        {icon:"thu-gian", title: "Air conditioner", color: "bg-green-800"},
        {icon:"di-ngu", title: "Air conditioner", color: "bg-green-800"},
        {icon:"hoc-bai", title: "Air conditioner", color: "bg-green-800"},
        {icon:"nghe-nhac", title: "Air conditioner", color: "bg-green-800"},
        {icon:"tiep-khach", title: "Air conditioner", color: "bg-green-800"},
        {icon:"trinh-chieu", title: "Air conditioner", color: "bg-green-800"},
        {icon:"ra-phong", title: "Air conditioner", color: "bg-green-800"},
        {icon:"vao-phong", title: "Air conditioner", color: "bg-green-800"},
        {icon:"an-toi", title: "Air conditioner", color: "bg-green-800"},
        {icon:"diu-nhe", title: "Air conditioner", color: "bg-green-800"},
        {icon:"xem-tivi", title: "Air conditioner", color: "bg-green-800"}
    ];
    IRIconList = [
        {icon:"ti-vi", title:"TV Set", color:"bg-cyan-800"},
        {icon:"dieu-hoa", title:"AirCon", color:"bg-cyan-800"},
        {icon:"quat", title:"AirCon", color:"bg-cyan-800"}
    ];
    IconList = [
        {icon:"light", title:"Light", color:"bg-cyan-800"}, 
        {icon:"scene", title: "Command", color: "bg-teal-800"},
        {icon:"curtain", title: "Curtain", color: "bg-indigo-800"},
        {icon:"fan", title:"Fan", color:"bg-blue-800"}, 
        {icon:"aircon", title: "Air conditioner", color: "bg-green-800"},
        {icon:"tv", title: "Television", color: "bg-pink-800"} 
    ];
    IRIconControlList = [
        {icon:"triangle-up", title:"IR Command", color:"bg-cyan-800"},
        {icon:"triangle-down", title:"IR Command", color:"bg-cyan-800"},
        {icon:"triangle-left", title:"IR Command", color:"bg-cyan-800"},
        {icon:"triangle-right", title:"IR Command", color:"bg-cyan-800"},
        {icon:"power", title:"IR Command", color:"bg-cyan-800"}
    ];

    myAlert = function(message) {
        //alert(message);
    }
    myConfirm = function(title, content, callback) {
        Session.set('confirm-title',title);
        Session.set('confirm-content', content);
        Template.ModalConfirm.cbFunc = callback;
        console.log(Template.ModalConfirm.title);
        $('#confirm').modal();
    };

    isDevOn = function(id) {
        return Device.findOne(id).status == 49;
    };
    setActiveTab = function(index) {
        Session.set('active-tab', index);
    };
    setBackLink = function(backlink) {
        Session.set('cancel-btn-back', backlink);
    };
    getBackLink = function() {
        var backlink = Session.get('cancel-btn-back');
        return backlink?backlink:"#";
    };
    CALLBACKS = {
        saveBtn: null
    };
    MODALS = [
        {id: "modal-addroom"},
        {id: "modal-addscene"},
        {id: "modal-updateroom"}
    ];
    setupModalAddRoom = function(router) {
        router.render('ModalAddRoom', {to: "modal-addroom"});
        Session.set('modal-top', MODALS[0].id);
        router.render('AddBtn', {to: "rightNav"});
    };
    setupModalUpdateRoom = function(router) {
        router.render('ModalUpdateRoom', {to: "modal-updateroom"});
    };
    setupModalAddScene = function(router) {
        router.render('ModalAddScene', {to: "modal-addroom"});
        Session.set('modal-top', MODALS[1].id);
        router.render('AddBtn', {to: "rightNav"});
    };
    Meteor.Spinner.options = {
        lines: 13, // The number of lines to draw
        length: 10, // The length of each line
        width: 5, // The line thickness
        radius: 15, // The radius of the inner circle
        corners: 0.7, // Corner roundness (0..1)
        rotate: 0, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#fff', // #rgb or #rrggbb
        speed: 1, // Rounds per second
        trail: 60, // Afterglow percentage
        shadow: true, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '45%', // Top position relative to parent in px
        left: '50%' // Left position relative to parent in px        
    };
    PageHelpers = {
        top_margin: function() {
            return Session.get('has-widget')?"70":"40";
        }
    };
}

