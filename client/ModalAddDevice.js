Template.ModalAddDevice.dualLightDualScene = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAdd"},
    {index: 1, region:"switch-2", active:"", in:"", pos:"col-xs-6 pos-rt", template:"FragmentAdd"},
    {index: 2, region:"switch-3", active:"", in:"", pos:"col-xs-6 pos-lb", template:"FragmentAddScene"},
    {index: 3, region:"switch-4", active:"", in:"", pos:"col-xs-6 pos-rb", template:"FragmentAddScene"}
];
Template.ModalAddDevice.tripleLightSingleScene = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAdd"},
    {index: 1, region:"switch-2", active:"", in:"", pos:"col-xs-6 pos-rt", template:"FragmentAdd"},
    {index: 2, region:"switch-3", active:"", in:"", pos:"col-xs-6 pos-lb", template:"FragmentAdd"},
    {index: 3, region:"switch-4", active:"", in:"", pos:"col-xs-6 pos-rb", template:"FragmentAddScene"}
];

Template.ModalAddDevice.quadScene = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAddScene"},
    {index: 1, region:"switch-2", active:"", in:"", pos:"col-xs-6 pos-rt", template:"FragmentAddScene"},
    {index: 2, region:"switch-3", active:"", in:"", pos:"col-xs-6 pos-lb", template:"FragmentAddScene"},
    {index: 3, region:"switch-4", active:"", in:"", pos:"col-xs-6 pos-rb", template:"FragmentAddScene"}
];

Template.ModalAddDevice.dualLight = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAdd"},
    {index: 1, region:"switch-2", active:"", in:"", pos:"col-xs-6 pos-rt", template:"FragmentAdd"}
];

Template.ModalAddDevice.dualScene = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAddScene"},
    {index: 1, region:"switch-2", active:"", in:"", pos:"col-xs-6 pos-rt", template:"FragmentAddScene"}
];

Template.ModalAddDevice.singleLight = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAdd"}
];

Template.ModalAddDevice.singleScene = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAddScene"}
];
Template.ModalAddDevice.curtain2 = [
    {index: 0, region:"curtain", active:"active", in:"in", pos:"pos-lt"}
];

Template.ModalAddDevice.CurtainSwitch = [
    {index: 0, region:"curtain", active:"active", in:"in", pos:"pos-lt"},
    {index: 2, region:"switch-3", active:"", in:"", pos:"col-xs-6 pos-lb"},
    {index: 3, region:"switch-4", active:"", in:"", pos:"col-xs-6 pos-rb"}
];

Template.ModalAddDevice.singleLightSingleScene = [
    {index: 0, region:"switch-1", active:"active", in:"in", pos:"col-xs-6 pos-lt", template:"FragmentAdd"},
    {index: 1, region:"switch-2", active:"", in:"", pos:"col-xs-6 pos-rt", template:"FragmentAddScene"}
];

Template.ModalAddDevice.renderDoneCallback = null;

function onDeviceAdded(templtInstance, idx) {
    // Modal header add check symbol
    console.log("onDeviceAdded " + idx);
    console.dir(templtInstance.$('.nav-pills a[data-toggle="pill"]'));
    console.dir(templtInstance.$('.tab-pane button.addBtn'));
    templtInstance.$('.nav-pills a[data-toggle="pill"]').eq(idx).append("<i style='margin-left: 0.5em;' class='rounded xsmall icon iot-icon-check-circle'></i>");
    // disable button in modal content
    templtInstance.$('.tab-pane button.addBtn').eq(idx).prop('disabled', true);
}

Template.ModalAddDevice.modalBodyEvents = {
    'shown.bs.tab .nav-pills a': function(event, instance) {
        var elem = event.currentTarget;
        var i = elem.getAttribute('data-index');
        i = parseInt(i);
        console.dir(instance.data.founds[i]);
        if(instance.data && instance.data.founds[i] && (!(instance.data.added[i]))) {
            instance.data.added[i] = true;
            instance.$('.nav-pills a[href="#gang' + i + '"]').append("<i style='margin-left: 0.5em;color:green;' class='rounded xsmall icon iot-icon-check-circle'></i>");
        }
    }
};

function addCurtain(buttonIdx, idx, icon, instance) {
    var gangname = instance.$('input.gangname').eq(idx).val();
    if( gangname && gangname !== "" ) {
        Meteor.apply("addDevice", [{
                name: gangname,
                descrip:"Description curtain",
                type: Constants.DEVTYPE_CURTAIN, // curtain
                idx: "0".charCodeAt(0),
                idx1: "1".charCodeAt(0),
                netadd: parseInt(Session.get("netaddr"), 16),
                endpoint: parseInt(Session.get("endpoint")),
                groupId: parseInt(Session.get('room-id')),
                icon: icon
            }],{wait:false}, 
            function(err, res){
                if(err) {
                    console.log(err);
                }
                else {
                    onDeviceAdded(instance, idx);
                    var jqTabs = instance.$('.nav-pills a[data-toggle="pill"]');
                    jqTabs.eq((idx+1) % jqTabs.length).tab('show');
                }
            }
        );
    }
    else {
        instance.$('input.gangname').eq(idx).parent().addClass('has-error');
        setTimeout(function() {
            instance.$('input.gangname').eq(idx).parent().removeClass('has-error');
        }, 2000);
    }
}
function addSceneButton(buttonIdx, idx, sceneId, sceneName, icon, instance) {
    console.log("____ sceneId:" + sceneId);
    console.log("____ sceneName:" + sceneName);
    var gangname = sceneName;
    if( gangname && gangname !== "" ) {
        Meteor.apply("addDevice", [{
                name: gangname,
                descrip:"Description scene",
                type: Constants.DEVTYPE_SCENE, // scene button
                idx: "0".charCodeAt(0) + buttonIdx,
                sceneId: sceneId,
                netadd: parseInt(Session.get("netaddr"), 16),
                endpoint: parseInt(Session.get("endpoint")),
                groupId: parseInt(Session.get('room-id')),
                icon: icon
            }],{wait:false}, 
            function(err, res){
                if(err) {
                    console.log(err);
                }
                else {
                    onDeviceAdded(instance, idx);
                    var jqTabs = instance.$('.nav-pills a[data-toggle="pill"]');
                    jqTabs.eq((idx+1) % jqTabs.length).tab('show');
                }
            }
        );
    }
    else {
        instance.$('input.sceneName').eq(idx).parent().addClass('has-error');
        setTimeout(function() {
            instance.$('input.sceneName').eq(idx).parent().removeClass('has-error');
        }, 2000);
    }
}
function addButton(buttonIdx, idx, devType, icon, instance) {
    var gangname = instance.$('form#form-' + idx + ' input.gangname').val();
    if( devType > -1 && gangname && gangname !== "" ) {
        Meteor.apply("addDevice", [{
                name: gangname,
                descrip: "Description",
                type: devType,
                idx: "0".charCodeAt(0) + buttonIdx,
                netadd: parseInt(Session.get("netaddr"), 16), //data[4] * 256 + data[5],
                endpoint: parseInt(Session.get("endpoint")),
                groupId: parseInt(Session.get('room-id')),
                icon: icon
            }], {wait:false}, function(err, res){
                if(err) {
                    console.log(err);
                    console.dir(err);
                }
                else {
                    onDeviceAdded(instance, idx);
                    var jqTabs = instance.$('.nav-pills a[data-toggle="pill"]');
                    jqTabs.eq((idx+1) % jqTabs.length).tab('show');
                }
            }
        );
    }
    else {
        instance.$('input.gangname').eq(idx).parent().addClass('has-error');
        instance.$('input.mbsc-control').eq(idx).parent().addClass('has-error');
        setTimeout(function() {
            instance.$('input.gangname').eq(idx).parent().removeClass('has-error');
            instance.$('input.mbsc-control').eq(idx).parent().removeClass('has-error');
        }, 2000);
    }
}
Template.ModalAddDevice.events({
    "click button#configure": function(event, instance) {
        var gangtype = parseInt(Session.get('gang-type'));
        if (isNaN(gangtype)) gangtype = -1;
        switch(gangtype) {
            case 0:
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                Meteor.apply('permit', [{
                        name1: instance.$("#gang1 .gangname").val(),
                        name2: instance.$("#gang2 .gangname").val(),
                        name3: instance.$("#gang3 .gangname").val(),
                        groupId: Session.get("room-id")
                    }], {wait: false}, function(error, result) {
                });
                break;
            case 9:
                Router.current().render("HeaderIRDevice", {to:"modalHeader"});
                Router.current().render("Blank", {to:"modalBody"});
                Router.current().render("BodyIRDevice", {to: "modalBody"});
                Router.current().render("Blank", {to:"modalFooter"});
                Session.set("netaddr", -1);
                break;
            default:
                instance.$('input.mbsc-control').parent().addClass('has-error');
                setTimeout(function() {
                    instance.$('input.mbsc-control').parent().removeClass('has-error');
                }, 2000);
                break;
        }
/*
        if(gangtype > -1) {
            Meteor.apply('permit', [{
                    name1: instance.$("#gang1 .gangname").val(),
                    name2: instance.$("#gang2 .gangname").val(),
                    name3: instance.$("#gang3 .gangname").val(),
                    groupId: Session.get("room-id")
                }], {wait: false}, function(error, result) {
            });
        }
        else {
            instance.$('input.mbsc-control').parent().addClass('has-error');
            setTimeout(function() {
                instance.$('input.mbsc-control').parent().removeClass('has-error');
            }, 2000);
        }
*/
    },
    "click button.addBtn": function(event, instance) {
        var buttonIdx = event.currentTarget.getAttribute('data-btnIdx');
        console.log('buttonIdx:' + buttonIdx);
        var idx = event.currentTarget.getAttribute('data-idx');
        console.log('idx:' + idx);
        var devType = parseInt(instance.$('#icon-' + idx).attr("data-value"));
        var icon = parseInt(instance.$('#icon-' + idx).attr('data-icon'));

        console.log(instance.$('#icon-' + idx).attr("data-value"));

        buttonIdx = parseInt(buttonIdx);
        idx = parseInt(idx);
        console.log("Add device: buttonIdx=" + buttonIdx + " idx=" + idx + " devType=" + devType);
        switch(devType) {
        case Constants.DEVTYPE_CURTAIN: // curtain
            console.log("add curtain");
            addCurtain(buttonIdx, idx, icon, instance);
            break;
        case Constants.DEVTYPE_SCENE: // scene button
            var sceneId = parseInt(Session.get('scene-id'));
            var parentElem = event.currentTarget.parentElement;
            var sceneName = $(parentElem).find('input.mbsc-control.sceneName').val();
            console.log("add scene button");
            if(sceneName.charCodeAt(0) == "[".charCodeAt(0)) {
                $(parentElem).find('input.mbsc-control.sceneName').parent().addClass('has-error');
            }
            else {
                addSceneButton(buttonIdx, idx, sceneId, sceneName, icon, instance);
            }
            break;
        default:
            console.log("Add button: " + buttonIdx + " " + idx);
            addButton(buttonIdx, idx, devType, icon, instance);
            break;
        }
    },
    "show.bs.modal .modal": function(event, instance) {
        console.log("on Show modal");
        Session.set("netaddr", null);
        Session.set("endpoint", null);

        Router.current().render("HeaderTitle", {to: "modalHeader"});

        Router.current().render("BodyStage1", {to: "modalBody"});
    },
    "hide.bs.modal .modal": function(event, instance) {
        Router.current().render("Blank", {to: "modalHeader"});
        Router.current().render("Blank", {to: "modalBody"});
    },
    'click button#addIRDev': function(event, instance) {
        var name = $(instance.$('input[type="text"]')[0]).val().trim();
        if (name.length == 0) {
            $(instance.$('input[type="text"]')[0]).parent().addClass("has-error").delay(1000).queue(function() {
                $(this).removeClass("has-error").dequeue();
            });
            return;
        }
        var model = parseInt(instance.$('select[name="model"]').attr('data-val'));
        if (isNaN(model) || model < 0) {
            instance.$('select[name="model"]').parent().addClass("has-error").delay(1000).queue(function() {
                $(this).removeClass("has-error");
            });
            return;
        }
        var irHub = parseInt(instance.$('select[name="ir-hub"]').attr('data-val'));
        if (isNaN(irHub) || irHub < 0) {
            instance.$('select[name="ir-hub"]').parent().addClass("has-error").delay(1000).queue(function() {
                $(this).removeClass("has-error");
            });
            return;
        }

        console.log("========" + name + " " + model + " " + irHub);
        var icon = parseInt(instance.$('i[data-icon]').attr('data-icon'));
        Meteor.apply("addDevice", [{ // TUNG
                name: name,
                descrip: "IR Description",
                type: Constants.DEVTYPE_IR,
                idx: -1,
                netadd: -1, //data[4] * 256 + data[5],
                endpoint: -1,
                groupId: parseInt(Session.get('room-id')),
                icon: icon,
                irModelId: model,
                irHubId: irHub
            }], {wait:false}, function(err, res){
                if(err) {
                    console.log(err);
                    console.dir(err);
                }
                instance.$('#add_device').modal('hide');
            }
        );
    }
});

Template.ModalAddDevice.onRendered(function() {
});
Template.ModalAddDevice.helpers({
    modules: function() {
        console.log(Template.ModalAddDevice.modules);
        return Template.ModalAddDevice.modules;
    },
    showConfig: function() {
        return ( Session.get("netaddr") == null) ? "":"hide";
    },
    showAdd: function() {
        console.log("showAdd");
        return ( Session.get("netaddr") != null) ? "":"hide";
    }
});

Template.BodyStage1.onRendered(function() {
    var self = this;
    $("#step1").show(100, function() {
        $("#step1").removeClass("iot-color-llg").addClass("text-primary");
    });
    Session.set('gang-type', undefined);
    Meteor.setTimeout(function() {
        try {
            var listDown = self.$('.list-down');
            listDown.mobiscroll().select({
                theme: 'mobiscroll', 
                lang: 'en', 
                display: 'bottom', 
                minWidth: 200,
                inputClass: 'form-control gangtype',
                // https://github.com/acidb/mobiscroll/issues/341
                onShow: function () {
                    $(window).off('focusin');
                },
                onSelect: function(valueText, inst) {
                    var gangtype = inst.getVal();
                    console.log('gangtype:' + inst.getVal());
                    Session.set('gang-type', gangtype);
                    var secondH4 = $('#step2');
                    if( parseInt(gangtype) == 9 ) {
                        secondH4.text("(2) " + TAPi18n.__("Press") + " " + TAPi18n.__("Next"));
                    }
                    else {
                        secondH4.text("(2) " + TAPi18n.__("reset your Smart IO box") + " " + TAPi18n.__("then press") + " " + TAPi18n.__("Next"));
                    }
                    $('#step1').removeClass('text-primary').addClass('iot-color-llg');
                    secondH4.show(400, function() {
                        secondH4.removeClass('iot-color-llg').addClass('text-primary');
                    });
                }
            });
        }
        catch(err) {
            console.log(err);
        }
    }, 300);
});

/*-------------- Template FragmentAdd --------------*/
Template.FragmentAdd.helpers({
    devTypes: IconList.slice(0, Constants.DEVTYPE_SCENE),
    found: function() {
        return this.found;
    },
    foundId : function() {
        return "";
        console.log(this.found.id);
        return this.found.id;
    },
    foundName: function() {
        if(!this.found) return "";
        return this.found.name;
    },
    foundIcon: function() {
        if(!this.found) return "0";
        if(!this.found.icon) return "0";
        return this.found.icon;
    },
    readonlyName: function() {
        (this.found == undefined)?"":"readonly";
    },
    roomName: function() {
        var rId = Session.get("room-id");
        if(this.found) rId = this.found.groupId;
        var room = Group.findOne({
                id:parseInt(rId)
            }, {fields:{name:1}
        });
        return room.name;
    },
    disabledButton: function() {
        return (this.found == undefined)?"":"disabled";
    },
    icon: function() {
        if( !this.found ) return "";
        return IconList[this.found.type];
    }
});

Template.FragmentAdd.events({
    'click i[data-icon]': function(event, instance) {
        var iconElem = $(event.currentTarget);
        var icon = parseInt(iconElem.attr("data-icon"));
        icon = (icon + 1) % LampIconList.length;
        iconElem.attr("data-icon", "" + icon);
        iconElem.removeClass();
        iconElem.addClass("icon icon-big icon-fit iot-icon-" + LampIconList[icon].icon);
    }
});

Template.FragmentAdd.onRendered(function() {
    var self = this;
    var idx = parseInt(self.$("button[data-idx]").attr("data-idx"));
    var iconElem = self.$("#icon-" + idx);
    var icon = parseInt(iconElem.attr("data-icon"));
    iconElem.removeClass();
    iconElem.addClass("icon icon-big icon-fit iot-icon-" + LampIconList[icon].icon);
/*
    var self = this;
    if(self.data || !self.data.found){
        Meteor.setTimeout(function() {
            try {
                var listDown = self.$('.list-down');
                listDown.mobiscroll().select({
                    theme: 'mobiscroll', 
                    lang: 'en', 
                    display: 'bottom', 
                    minWidth: 200,
                    inputClass: 'form-control w-percent-70',
                    // https://github.com/acidb/mobiscroll/issues/341
                    onShow: function () {
                        $(window).off('focusin');
                    },
                    onSelect: function(valueText, inst) {
                        self.$('label i').removeClass(function (index, css) {
                            return (css.match (/(^|\s)dicon-\S+/g) || []).join(' ');
                        }).addClass("dicon-" + IconList[inst.getVal()].icon).attr("data-value", inst.getVal());
                    }
                });
            }
            catch(err) {
                console.log(err);
            }
        }, 300);
    }
*/
});
// FragmentAdd end

/*------------ Template Body4Gang ---------------*/
Template.Body4Gang.onRendered(function() {
    var foundGangs = this.data.foundGangs;
    console.log(Template.ModalAddDevice.modules);
    for(var i = 0; i< Template.ModalAddDevice.modules.length; i++) {
        console.log("Module");
        console.log(Template.ModalAddDevice.modules[i].template);
        console.log(Template.ModalAddDevice.modules[i].region);
        Router.current().render(Template.ModalAddDevice.modules[i].template, {
            to:Template.ModalAddDevice.modules[i].region,
            data:{btnIdx: i, index:i, found: foundGangs[i]}
        });
    }
});
Template.Body4Gang.helpers({
    modules: function() {
        return Template.ModalAddDevice.modules;
    }
});
Template.Body4Gang.events({});

/*------------ Template Body2Gang ---------------*/
Template.Body2Gang.onRendered(function(){
    var foundGangs = this.data.foundGangs;
    for(var i = 0; i< Template.ModalAddDevice.modules.length; i++) {
        Router.current().render(Template.ModalAddDevice.modules[i].template, {
            to:Template.ModalAddDevice.modules[i].region, 
            data:{btnIdx:i, index:i, found: foundGangs[i]}
        });
    }
});

Template.Body2Gang.helpers({
    modules: function(){
        return Template.ModalAddDevice.modules;
    }
});
Template.Body2Gang.events({});

/*------------ Template Body1Gang ---------------*/
Template.Body1Gang.onRendered(function(){
    var foundGangs = this.data.foundGangs;
    for(var i = 0; i< Template.ModalAddDevice.modules.length; i++) {
        Router.current().render(Template.ModalAddDevice.modules[i].template, {
            to:Template.ModalAddDevice.modules[i].region, 
            data:{btnIdx:i, index:i, found: foundGangs[i]}
        });
    }
});
Template.Body1Gang.helpers({
    modules: function() {
        return Template.ModalAddDevice.modules;
    }
});

/*------------ Template BodyCurtain ------------------*/
Template.BodyCurtain.onRendered(function() {
    var foundGangs = this.data.foundGangs;
    Router.current().render("FragmentAddCurtain", {
        to:Template.ModalAddDevice.curtain2[0].region,
        data:{btnIdx:0, index:0, found: foundGangs[0]}
    });
});

Template.BodyCurtain.helpers({
    hasSwitchFree: function() {
        return ((this.foundGangs[0] == undefined) && (this.foundGangs[1] == undefined));
    }
});

/*------------ Template Header4Gang ------------------*/
Template.Header4Gang.onRendered(function() {
    console.log("Header4Gang rendered");
    this.$('.nav-pills a[href="#gang0"][data-toggle="pill"]').tab('show');
});

Template.Header4Gang.events(Template.ModalAddDevice.modalBodyEvents);

Template.Header4Gang.helpers({
    modules: function() {
        console.log(Template.ModalAddDevice.modules);
        return Template.ModalAddDevice.modules;
    }
});

/*------------ Template Header2Gang ------------------*/
Template.Header2Gang.onRendered(function() {
    this.$('.nav-pills a[href="#gang0"][data-toggle="pill"]').tab('show');
});
Template.Header2Gang.helpers({
    modules: function() {
        console.log(Template.ModalAddDevice.modules);
        return Template.ModalAddDevice.modules;
    }
});
Template.Header2Gang.events(Template.ModalAddDevice.modalBodyEvents);

/*------------ Template Header1Gang ------------------*/
Template.Header1Gang.onRendered(function() {
    this.$('.nav-pills a[href="#gang0"][data-toggle="pill"]').tab('show');
});
Template.Header1Gang.helpers({
    modules: function() {
        console.log(Template.ModalAddDevice.modules);
        return Template.ModalAddDevice.modules;
    }
});
Template.Header1Gang.events(Template.ModalAddDevice.modalBodyEvents);

Template.FragmentAddCurtain.onRendered(function() {
    var self = this;
    var idx = parseInt(self.$("button[data-idx]").attr("data-idx"));
    var iconElem = self.$("#icon-" + idx);
    var icon = parseInt(iconElem.attr("data-icon"));
    iconElem.removeClass();
    iconElem.addClass("icon icon-big icon-fit iot-icon-" + CurtainIconList[icon].icon);
});
Template.FragmentAddCurtain.events({
    'click i[data-icon]': function(event, instance) {
        var iconElem = $(event.currentTarget);
        var icon = parseInt(iconElem.attr("data-icon"));
        icon = (icon + 1) % CurtainIconList.length;
        iconElem.attr("data-icon", "" + icon);
        iconElem.removeClass();
        iconElem.addClass("icon icon-big icon-fit iot-icon-" + CurtainIconList[icon].icon);
    }
});
Template.FragmentAddCurtain.helpers({
    roomName: function() {
        var rId = Session.get("room-id");
        if(this.found) rId = this.found.groupId;
        var room = Group.findOne({
                id:parseInt(rId)
            }, {fields:{name:1}
        });
        return room.name;
    }
});
Template.BodyCurtainSwitch.onRendered(function() {
    var foundGangs = this.data.foundGangs;
    Router.current().render("FragmentAddCurtain", {
        to:Template.ModalAddDevice.CurtainSwitch[0].region,
        data:{btnIdx:0, index:0, found: foundGangs[0]}
    });
    Router.current().render("FragmentAdd", {
        to: Template.ModalAddDevice.CurtainSwitch[1].region,
        data: {btnIdx: 2, index:1, found: foundGangs[2]}
    });
    Router.current().render("FragmentAdd", {
        to: Template.ModalAddDevice.CurtainSwitch[2].region,
        data: {btnIdx: 3, index: 2, found: foundGangs[3]}
    });
});
Template.BodyCurtainSwitch.helpers({
    hasSwitchFree: function() {
        return ((this.foundGangs[0] == undefined) && (this.foundGangs[1] == undefined));
    }
});

Template.FragmentAddScene.onRendered(function(){
    var self = this;

    var idx = parseInt(self.$("button[data-idx]").attr("data-idx"));
    var iconElem = self.$("#icon-" + idx);
    var icon = parseInt(iconElem.attr("data-icon"));
    iconElem.removeClass();
    iconElem.addClass("icon icon-big icon-fit iot-icon-" + SceneIconList[icon].icon);

    Session.set('scene-id', -1);
    Meteor.setTimeout(function() {
        try {
            var listDown = self.$('.list-down');
            listDown.mobiscroll().select({
                theme: 'mobiscroll', 
                lang: 'en', 
                display: 'bottom', 
                minWidth: 200,
                inputClass: 'form-control gangtype w-percent-70 sceneName',
                // https://github.com/acidb/mobiscroll/issues/341
                onShow: function () {
                    $(window).off('focusin');
                },
                onSelect: function(valueText, inst) {
                    Session.set('scene-id', inst.getVal());
                }
            });
        }
        catch(err) {
            console.log(err);
        }
    }, 300);
});
Template.FragmentAddScene.onDestroyed(function() {
    Session.set("scene-id", undefined);
});
Template.FragmentAddScene.events({
    'click i[data-icon]': function(event, instance) {
        var iconElem = $(event.currentTarget);
        var icon = parseInt(iconElem.attr("data-icon"));
        icon = (icon + 1) % SceneIconList.length;
        iconElem.attr("data-icon", "" + icon);
        iconElem.removeClass();
        iconElem.addClass("icon icon-big icon-fit iot-icon-" + SceneIconList[icon].icon);
    }
});
Template.FragmentAddScene.helpers({
    scenes: function() {
        return Scene.find({}).fetch();
    },
    readonlyName: function() {
        (this.found == undefined)?"":"readonly";
    },
    roomName: function() {
        var rId = Session.get("room-id");
        if(this.found) rId = this.found.groupId;
        var room = Group.findOne({
                id:parseInt(rId)
            }, {fields:{name:1}
        });
        return room.name;
    },
    disabledButton: function() {
        return (this.found == undefined)?"":"disabled";
    }
});
Template.BodyIRDevice.onRendered(function(){
    var self = this;
    var iconElem = self.$('i[data-icon]');
    var icon = parseInt(iconElem.attr('data-icon'));
    iconElem.removeClass();
    iconElem.addClass("icon icon-big icon-fit iot-icon-" + IRIconList[icon].icon);
    try {
        console.log(self.$('select.list-down'));
        self.$('select.list-down').mobiscroll().select({
            theme: 'mobiscroll', 
            lang: 'en', 
            display: 'bottom', 
            minWidth: 200,
            inputClass: 'form-control gangtype',
            // https://github.com/acidb/mobiscroll/issues/341
            onShow: function () {
                $(window).off('focusin');
            },
            onSelect: function(valueText, inst) {
                $(this).attr("data-val", inst.getVal());
            }
        });
    }
    catch (err) {
        console.log(err);
    }
});
Template.BodyIRDevice.events({
    'click i[data-icon]': function(event) {
        var iconElem = $(event.currentTarget);
        var icon = parseInt(iconElem.attr("data-icon"));
        icon = (icon + 1) % IRIconList.length;
        iconElem.attr("data-icon", "" + icon);
        iconElem.removeClass();
        iconElem.addClass("icon icon-big icon-fit iot-icon-" + IRIconList[icon].icon);
    }
});
Template.BodyIRDevice.helpers({
    irdevmodel: function() {
        return IRDevModel.find({}).fetch();
    },
    irhub: function() {
        return IRHub.find({}).fetch();
    }
});
