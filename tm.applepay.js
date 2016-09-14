// jshint elision: true, strict:true, curly:false
(function (app) {
	'use strict';

	var ApplePay = (function ($) {
		//'use strict';

		var defaults = {
			debug : false,
			// update this on the other helpers
			namespace : 'applepay',
			merchantId : ''

		},
		state = {
			init : false,
			transition : false
		},
		session,
		options;

		// dom
		var $el;

		var methods = {
			log : function () {
				// set default logger
				var logger = console;
				// check
				if (!options.debug) return;
				// set defined logger
				if (typeof options.logger !== 'undefined') {
					logger = options.logger;
				}
				Array.prototype.splice.call(arguments, 0, 0, options.namespace);
				logger.log.apply(logger, arguments);
			},
			events : function (event, data) {
				$el.trigger(event + '.' + options.namespace, data);
			},
			createToken : function () {

			},
			createSession : function () {

			},
			available : function (callback) {
				methods.log('available:');
				
				if (!session.canMakePayments()) {
					methods.log('available: Apple Pay is not available.');	
					if (typeof callback === 'function') callback(false);
				}

				session.canMakePaymentsWithActiveCard(options.merchantId)
				.then(function (available) {
					methods.log('available: async complete.');
					if (typeof callback === 'function') callback(available);
					// fire events
				});
			},
			init : function (o) {
				if (state.init) {
					methods.log('init: already initiated.');
					return ApplePay;
				}
				if (!window.ApplePaySession) {
					if (o.debug) console.log('init: ApplePaySession is not available.');
					return false;
				}
				if (typeof window.jQuery === 'undefined') {
					if (o.debug) console.log('init: jQuery is required.');
					return false;
				}
				if (!o.merchantId || typeof o.merchantId !== 'string') {
					if (o.debug) console.log('init: invalid merchant ID argument.');
					return false;
				}

				// merge options
				options = $.extend({}, defaults, o);

				// set container
				$el = $('body');
				if (!$el.length) {
					methods.log('init: el element not found.');
					return false;
				}

				session = window.ApplePaySession;
				// set state
				state.init = true;

				return ApplePay;
			}
		};

		return methods;
	})(jQuery);

	app.applePay = function (o) {
		return ApplePay.init(o);
	};
})(window.tm || {});
