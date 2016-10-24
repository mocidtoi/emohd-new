var handle;
Template.Favorites.onRendered(function() {
    Session.set("title", "Favorites");
    setActiveTab(1);
    var self = this;
    handle = Favorite.find().observe({
        changed: function() {
            Meteor.setTimeout(function() {
                self.$('div.grid-item[data-big=1]').addClass("grid-item-x2", 1500, 'linear');
                self.$('div.grid-item.grid-item-x2[data-big=0]').removeClass("grid-item-x2");
                self.$('.grid').packery("layout");
            }, 800);
        },
        added: function() {
            Meteor.setTimeout(function() {
                self.$('div.grid-item[data-big=1]').addClass("grid-item-x2");
                self.$('div.grid-item.grid-item-x2[data-big=0]').removeClass("grid-item-x2");
                self.$('.grid').packery({
                    itemSelector: '.grid-item',
                    columnWidth: '.grid-sizer'
                });
            }, 800);
        }
    });
    console.dir(Favorite.find().fetch());
});

Template.Favorites.onDestroyed(function() {
    if(handle) handle.stop();
});
Template.Favorites.helpers(PageHelpers);
Template.Favorites.helpers({
    tileColorById: function(devId) {
        var i = devId % ColorList.length;
        return ColorList[i];
    },
    tileColor: function(devType) {
        return IconList[devType].color;
    },
    icon: function(devType) {
        return IconList[devType].icon;
    },
    favorites: function() {
        return Favorite.find({}).fetch();
    },
    device: function(devId) {
        return Device.find({id: parseInt(devId)}).fetch()[0];
    },
    room: function(roomId) {
        return Group.find({id:parseInt(roomId)}).fetch()[0];
    },
    big: function(index) {
        //return (index == 0)?"grid-item-x2":"";
        return (index == 0)?"1":"0";
    },
    disabled: function(status) {
        return (status == 48)?"iot-bgcolor-llg":"iot-bgcolor-brand";
    }
});

Template.Favorites.events({
    'click .tile > .content': function(event, instance) {
        console.log('fired');
        var devId = parseInt(event.currentTarget.getAttribute('data-devId'));
        console.log("devId : " + devId + "--");
		Meteor.apply('com', [{
			id: devId,
			act: isDevOn(devId)?'off':'on'
		}], {wait: false});
    } 
});
