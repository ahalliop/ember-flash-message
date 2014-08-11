Ember.FlashMessageController = Ember.Controller.extend({
  queuedMessage: null,
  currentMessage: null,
  dismissTimer: null,

  message: Ember.computed.alias('currentMessage'),

  now: function() {
    this.setProperties({
      queuedMessage: null,
      currentMessage: this.get('queuedMessage')
    });
  },

  actions: {
    dismissFlashMessage: function() {
      this.set('currentMessage', null);
    }
  }

});
Ember.Handlebars.registerHelper('flashMessage', function(options) {
  var template = options.fn,
      container = options.data.keywords.controller.container,
      controller = container.lookup('controller:flashMessage'),

  parent = Ember.ContainerView.extend({
      timerDuration = this.get('controller.dismissTimer') || null,

      hideAndShowMessage: function() {
        var currentMessage = this.get('controller.currentMessage'),
            view;

        if (currentMessage) {
          view = Ember.View.create({
            template: template
          });
	  if (timerDuration !== null) {
            this.scheduleTimer(timerDuration);
          }
        }
	else {
	  this.cancelTimer();
	}

        this.set('currentView', view);
      }.observes('controller.currentMessage'),

      sendDismissal: function() {
        this.get('controller').send('dismissFlashMessage');
      },

      scheduleTimer: function(duration) {
        var newTimer = Ember.run.later(this, function() {
          this.sendDismissal();
        }, duration);
        this.set('myTimer', newTimer);
      },

      cancelTimer: function() {
        var timerToKill = this.get('myTimer');
        Ember.run.cancel(timerToKill);
      },

      handleReflection: function() {
	if (timerDuration !== null) {
	  this.cancelTimer();
	}
      }.on('mouseEnter'),

      resetTimer: function() {
	if (timerDuration !== null) {
          var duration = this.get('timerDuration')/2;
          this.scheduleTimer(duration);
	}
      }.on('mouseLeave')
    });

  options.hash.controller = controller;
  options.hashTypes = options.hashTypes || {};
  Ember.Handlebars.helpers.view.call(this, parent, options);
});
Ember.Application.initializer({
  name: 'flashMessage',
  initialize: function(container, application) {
    container.register('controller:flashMessage', Ember.FlashMessageController);
  }
});
Ember.FlashMessageRouteMixin = Ember.Mixin.create({
  flashMessage: function(message, messageType, dismissTimer) {
    var controller = this.controllerFor('flashMessage');

    var messageObject = Ember.Object.create({
      text: message
    });

    if(typeof messageType !== 'undefined') {
      messageObject.set('type', messageType);
    }

    if(typeof dismissTimer !== 'undefined') {
      controller.set('dismissTimer', dismissTimer);
    }

    controller.set('queuedMessage', messageObject);

    return controller;
  }
});
Ember.Route.reopen(
  Ember.FlashMessageRouteMixin, {
  enter: function() {
    this._super.apply(this, arguments);

    var controller = this.controllerFor('flashMessage'),
        routeName = this.get('routeName');

    var target = this.get('router.router.activeTransition.targetName');

    // do not display message in loading route, wait until
    // any loading is done.
    if (routeName !== "loading" && routeName === target) {
      controller.now();
    }
  }
});
