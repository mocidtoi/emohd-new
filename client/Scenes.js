Template.Scenes.onRendered(function() {
    var self = this;

    Session.set('title', "Scenes");
    var timeoutHandle = null;
    handle = Scene.find().observe({
        added: function(arg) {
                timeoutHandle = Meteor.setTimeout(function() {
                    self.$(".device-list li div a").rippler({
                        effectClass      :  'rippler-effect'
                        ,effectSize      :  16      // Default size (width & height)
                        ,addElement      :  'div'   // e.g. 'svg'(feature)
                        ,duration        :  400
                    });
                    timeoutHandle = null;
                }, 100);
        }
    });

});
Template.Scenes.helpers(PageHelpers);
Template.Scenes.helpers({
    scene: function() {
        return Scene.find({}).fetch();
    }
});
Template.Scenes.events({
   //'click div.list-group-item[data-id]': function(event, instance) {
   'click .button-style-1': function(event, instance) {
        console.log( parseInt(event.currentTarget.getAttribute('data-id')));
        var elem = event.currentTarget;
        Meteor.apply('sceneAction', [elem.getAttribute('data-id')], {wait:false});
        $(elem).removeClass('no-background', 1000);
        Meteor.setTimeout(function(){
            $(elem).addClass('no-background', 1000);
        }, 1000);
    },
    'click .list-group-item a': function(event) {
        event.stopPropagation();
    }
});
