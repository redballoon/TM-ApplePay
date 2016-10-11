/**
* tm.applepay
*
* A light robust javascript wrapper for the Apple Pay for Web API.
*
* @version v1.0.0
* @author Fredi Quirino
*/
/* jshint elision: true, strict:true, curly:false */
/* globals jQuery:true */
(function (app) {
	'use strict';

	/*
	todo:
	- remove stats, throw events instead so client side can do that if they want
	- make Readme, note down that events will block execution
	- do we handle the shipping address to set an appropriate shipping cost
	- provide validation for all 'request' values when creating a session
	- our purpose:
		- light wrapper
		- consolidate any changes in safari's apple pay API with argument types e.g null doesn't work anymore ? has to be an empty array
		- take care of all the messy try/catch so user doesn't have to
	*/

	var ApplePay = (function ($) {
		//'use strict';

		var defaults = {
			debug : false,
			namespace : 'applepay',
			merchantId : '',
			displayName : '',
			endpoint : {
				session : '',
				payment : ''
			},
			// defaults for payment request
			paymentDefault : {
				countryCode : '',
				currencyCode : '',
				total : {
					label : '',
					amount : 0
				},
				supportedNetworks : ['amex', 'discover', 'masterCard', 'visa'],
				merchantCapabilities : ['supports3DS'],
				shippingMethods : [],
				lineItems : []
			},
			// specify label used to identify the shipping Line Item
			shippingLineItemLabel : 'shipping',
			sessionTimeout : 240000
		},
		// state tracking
		state = {
			init : false
		},
		// session tracking
		session = {
			id : null,
			instance : null,
			$instance : null,
			request : null,
			currentShippingMethod : null,
			timeout : null,
			counter : 0
		},
		options;

		// dom
		var $el;
		
		var methods = {
			log : function () {
				// set default logger
				var logger = console;
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
			rando : function (min, max) {
				return Math.random() * (max - min) + min;
			},
			error : function (code, msg, error, callback) {
				var response = {};

				// stop payment session
				if (session.instance) session.instance.abort();
				session.id = null;
				session.instance = null;
				session.$instance = null;
				session.request = null;
				session.currentShippingMethod = null;
				
				if (session.timeout !== null) {
					clearTimeout(session.timeout);
					session.timeout = null;
				}

				// stop analytics
				if (options.enableStats) {
					//methods.stopStats();
					methods.clearStats();
				}
				
				// no need to create error response
				if (typeof callback !== 'function') return;
				
				if (code !== null) response.error = code;

				// value is custom
				if (code === null && msg === null && error !== null) {
					response = error;
				// custom message
				} else if (msg !== null) {
					response.message = msg;
				// native thrown error
				} else if (error !== null) {
					response.message = error;
				}
				
				callback(response);
			},
			fail : function (response, callback) {
				methods.error(null, null, response, callback);
			},
			normalizeAmount : function (n) {
				var amount = typeof n === 'number' ? n : parseFloat(n);
					amount = isNaN(amount) ? 0 : amount;
					amount = amount < 0 ? 0 : amount;
				return amount;
			},
			request : function (id, url, payload, callback) {
				methods.log('request:', id, url, payload);

				$.ajax({
					'url' : url,
					'method' : 'POST',
					'dataType' : 'json',
					'data' : payload
				}).always(function (data, response, request) {
					methods.log('request: request complete:', id, data);

					// doesn't match the session that made the initial request
					if (!session.instance || session.id !== id) {
						methods.log('request: invalid session.');
						return;
					}

					// request failed
					if (response !== 'success' || !data) {
						methods.log('request: request failed:', response);
						data = false;
					}

					if (typeof callback === 'function') callback(data);
				});
			}
		};

		return {
			/*
			*	getTotal -
			*	
			*
			*/
			getTotal : function () {
				if (!session.id) {
					methods.log('getTotal: invalid session.');
					return false;
				}
				// default value
				var total = session.request.total;
				// get tracked running total instead
				if (options.trackLineItems) {
					var amount = 0;
					$.each(session.lineItems, function () {
						if (typeof this.amount !== 'undefined') {
							amount += this.amount;
						}
					});
					session.request.total.amount = methods.normalizeAmount(amount.toFixed(2));
				}

				return total;
			},
			/*
			*	getLineItems -
			*	
			*
			*/
			getLineItems : function () {
				if (!session.id) {
					methods.log('getLineItems: invalid session.');
					return false;
				}
				// default value
				var lineItems = session.request.lineItems;
				// get tracked line items instead
				if (options.trackLineItems) {
					lineItems = [];
					$.each(session.lineItems, function (k, v) {
						if (typeof this.amount !== 'undefined') {
							//this.type = 'final';
							lineItems.push(this);
						}
					});
				}
				return lineItems;
			},
			/*
			*	updateTotal -
			*	
			*
			*/
			updateTotal : function (total) {
				if (!session.instance) {
					methods.log('updateTotal: invalid session.');
					return false;
				}
				if (typeof total.label !== 'string') {
					methods.log('updateTotal: invalid value for label.');
					return false;
				}
				if (typeof total.amount !== 'string' || typeof total.amount !== 'number') {
					methods.log('updateTotal: invalid value for amount.');
					return false;
				}
				total.amount = methods.normalizeAmount(total.amount);
				session.request.total = total;
				return true;
			},
			/*
			*	updateLineItems -
			*	
			*
			*/
			updateLineItems : function (lineItems) {
				if (!session.instance) {
					methods.log('updateLineItems: invalid session.');
					return false;
				}
				if (!$.isArray(lineItems)) {
					methods.log('updateLineItems: invalid value for lineItems.');
					return false;
				}
				$.each(lineItems, function () {
					this.amount = methods.normalizeAmount(this.amount);
				});
				session.request.lineItems = lineItems;
				return true;
			},
			/*
			*	updateShippingMethod -
			*	
			*
			*/
			updateShippingMethod : function (shippingMethod) {
				methods.log('updateShippingMethod:', shippingMethod);

				if (!session.instance) {
					methods.log('updateShippingMethod: invalid session.');
					return false;
				}
				// * note: amount will be a string if received from Apple event
				session.currentShippingMethod = shippingMethod;
				session.currentShippingMethod.amount = methods.normalizeAmount(session.currentShippingMethod.amount);

				if (!options.trackLineItems) return true;

				session.lineItems.shipping.type = 'final';
				session.lineItems.shipping.amount = session.currentShippingMethod.amount;

				methods.log('updateTaxes:', session.currentShippingMethod.amount);

				return true;
			},
			/*
			*	updateTaxes -
			*	
			*
			*/
			updateTaxes : function (tax) {
				if (!session.instance) {
					methods.log('updateTaxes: invalid session.');
					return false;
				}

				if (!options.trackLineItems) {
					methods.log('updateTaxes: line items are not being tracked.');
					return false;
				}
				if (!tax || typeof tax !== 'number' || isNaN(tax)) {
					methods.log('updateTaxes: invalid argument.');
					return false;	
				}

				session.lineItems.taxes.type = 'final';
				session.lineItems.taxes.amount = tax;

				methods.log('updateTaxes:', tax);

				return true;
			},
			/*
			*	complete -
			*	
			*
			*/
			complete : function (fn, status) {
				methods.log('complete:', fn, status);

				if (!session.instance) {
					methods.log('complete: invalid session.');
					return false;
				}

				var that = this,
					exit = false,
					args = Array.prototype.splice.call(arguments, 2);

				switch(fn) {
					case 'shippingMethodSelection':
					case 'completeShippingMethodSelection':
						fn = 'completeShippingMethodSelection';
						if (!args.length) {
							Array.prototype.splice.call(args, 0, 0, status, that.getTotal(), that.getLineItems());
						} else {
							// validate user's arguments
							Array.prototype.splice.call(args, 0, 0, status);
						}
					break;

					case 'shippingContactSelection':
					case 'completeShippingContactSelection':
						fn = 'completeShippingContactSelection';
						if (!args.length) {
							//Array.prototype.splice.call(args, 0, 0, status, session.request.shippingMethods, that.getTotal(), that.getLineItems());
							args.splice(0, 0, status, session.request.shippingMethods, that.getTotal(), that.getLineItems());
						} else {
							// validate user's arguments
							//Array.prototype.splice.call(args, 0, 0, status);
						}
					break;

					case 'paymentMethodSelection':
					case 'completePaymentMethodSelection':
						fn = 'completePaymentMethodSelection';
						if (!args.length) {
							Array.prototype.splice.call(args, 0, 0, that.getTotal(), that.getLineItems());
						} else {
							// validate user's arguments
						}
					break;

					default:
						methods.log('complete: invalid method argument.');
						exit = true;
					break;
				}

				if (exit) {
					methods.fail(false, null);
					return false;
				}

				methods.log('complete: arguments', args);

				try {
					session.instance[fn].apply(session.instance, args);
				} catch (e) {
					methods.log('complete: an error occured.', e);
					methods.fail(false, null);
					return false;
				}

				return true;
			},
			/*
			*	createSession -
			*	
			*
			*/
			createSession : function (request, callback) {
				var that = this;

				// merge request values with defaults
				request = $.extend({}, options.paymentDefault, request);

				// validate required fields
				if (!request.countryCode) {
					methods.log('createSession: invalid value for country code.');
					methods.error(0, 'invalid arguments.', null, callback);
					return;
				}
				if (!request.currencyCode) {
					methods.log('createSession: invalid value for currency code.');
					methods.error(0, 'invalid arguments.', null, callback);
					return;
				}
				if (!request.total.label) {
					methods.log('createSession: invalid value for label.');
					methods.error(0, 'invalid arguments.', null, callback);
					return;
				}

				// attempt to handle string numbers automagically
				request.total.amount = typeof request.total.amount === 'string' ? parseFloat(request.total.amount) : request.total.amount;
				if (typeof request.total.amount !== 'number' || isNaN(request.total.amount) || request.total.amount < 0) {
					methods.log('createSession: invalid value for amount.');
					methods.error(0, 'invalid arguments.', null, callback);
					return;
				}
				request.total.amount = request.total.amount.toFixed(2);

				// log
				methods.log('createSession: log request object', request);

				// unique session ID
				session.id = Math.ceil(methods.rando(1, 1000)) + '-' + $.now() + session.counter;
				session.counter++;
				// set default shipping method
				session.currentShippingMethod = !request.shippingMethods.length ? null : request.shippingMethods[0];
				// store current session's request data
				session.request = request;
				// reset
				options.trackLineItems = false;

				// internally track total and line items
				if (session.request.trackLineItems && typeof session.request.customLineItems !== 'undefined') {
					options.trackLineItems = true;
					session.lineItems = session.request.customLineItems;
				}
				// remove from request object
				if (typeof session.request.trackLineItems !== 'undefined') delete session.request.trackLineItems;
				if (typeof session.request.customLineItems !== 'undefined') delete session.request.customLineItems;
				
				// if using custom & total/lineItems is not set then fill it using custom object
				if (options.trackLineItems && !session.request.lineItems.length) {
					session.request.lineItems = that.getLineItems();
				}
				// if (options.trackLineItems && !session.request.total.amount) {
				// 	session.request.total = that.getTotal();
				// }

				// instance of Apple Pay session
				try {
					session.instance = new window.ApplePaySession(1, session.request);
					session.$instance = $(session.instance);
				} catch (e) {
					methods.log('createSession: an error occured: 1002.', e);
					methods.error(1002, null, e, callback);
					return;
				}
				
				// temp
				if (options.debug) window.tempsession = session.instance;

				// called when the payment sheet is displayed
				session.$instance
				.on('validatemerchant', function (event) {
					// log
					methods.log('event: validatemerchant:', event);

					// request params
					var data = {
						validationUrl : event.originalEvent.validationURL,
						domainName : window.location.hostname,
						displayName : options.displayName
					};

					// begin request for merchant session
					methods.request(session.id, options.endpoint.session, data, function (data) {

						// validation failed
						if (!data) {
							methods.error(2002, 'validation failed.', null, callback);
							return;	
						}
						// validation successful
						try {
							session.instance.completeMerchantValidation(data);
						} catch (e) {
							methods.log('createSession: an error occured: 1006.', e);
							methods.error(1006, null, e, callback);
							return;
						}

						// timeout
						session.timeout = setTimeout(function () {
							methods.log('createSession: session expired.');
							session.timeout = null;
							methods.fail(false, null);
							// todo:
							// trigger event for timeout on session object
						}, options.sessionTimeout);
					});
				})
				// called when a shipping method is selected
				.on('shippingmethodselected', function (event) {
					methods.log('event: shippingmethodselected:', event);
					that.updateShippingMethod(event.originalEvent.shippingMethod);
				})
				// called when the payment UI is dismissed with an error
				.on('cancel', function (event) {
					methods.log('event: cancel:', event);
					methods.fail(false, null);
				})
				// called when the user has authorized the Apple Pay payment, typically via TouchID
				.on('paymentauthorized', function (event) {
					methods.log('event: paymentauthorized:', event);
					//event.payment
					// billingContact
						// addressLines// ["1001 Durham Ave"]
						// administrativeArea// NJ
						// country// United States
						// countryCode// us
						// familyName// Mosbey
						// givenName// Ted
						// locality// South Plainfield
						// postalCode// '07088'
					// shippingContact
						// same as billing
						// emailAddress
						// phoneNumber
					// token
						// paymentData // Object
						// paymentMethod
							// displayName// MasterCard 1471
							// network// MasterCard
							// type// debit
						// transactionIdentifier//  String
					
					var data = event.originalEvent.payment;

					if (session.timeout !== null) {
						clearTimeout(session.timeout);
						session.timeout = null;
					}

					// begin request to send token to our server
					methods.request(session.id, options.endpoint.payment, data, function (data) {
						var status;

						// validation failed
						if (!data) {
							status = window.ApplePaySession.STATUS_FAILURE;
							// do we still need to abort session ? or will completePayment handle it ?
						} else {
							status = window.ApplePaySession.STATUS_SUCCESS;
						}


						try {
							session.instance.completePayment(status);
						} catch (e) {
							methods.log('createSession: an error occured: 1010.', e);
							methods.error(1010, null, e, callback);
							return;
						}
						// reset session ?
						// take user to thank you page or register page ?
					});
				});
				// called when a shipping contact is selected
				//.on('shippingcontactselected', function (event) {
					//methods.log('event: shippingcontactselected:', event);
					// todo:
					// - do we require family/given names ?
					/*
					e.g:
					event.originalEvent.shippingContact
					administrativeArea// NJ
					country// United States
					familyName// ''
					givenName// ''
					locality// South Plainfield
					postalCode// 07080
					*/
					
					//var status = window.ApplePaySession.STATUS_SUCCESS;//STATUS_INVALID_SHIPPING_CONTACT, STATUS_INVALID_SHIPPING_POSTAL_ADDRESS

					//methods.log('event: shippingcontactselected:', status, request.shippingMethods, request.total, request.lineItems);

					// try {
					// 	session.instance.completeShippingContactSelection(status, request.shippingMethods, request.total, request.lineItems);
					// } catch (e) {
					// 	methods.log('createSession: an error occured 1008.', e);
					// 	methods.error(1008, e, callback);
					// }
				//})
				// called when a new payment method is selected
				//.on('paymentmethodselected', function (event) {
					//methods.log('event: paymentmethodselected:', event);
					/*
					e.g:
					event.originalEvent.paymentMethod
					type// debit
					*/
					//session.instance.completePaymentMethodSelection(request.total, []);
					//return event.originalEvent.paymentMethod;
				//})

				// start session
				try {
					session.instance.begin();
				} catch (e) {
					methods.log('createSession: an error occured: 1004.', e);
					methods.error(1004, null, e, callback);
					return;
				}
				
				// analytics
				//if (options.enableStats) methods.startStats();

				return session.instance;
			},
			/*
			*	available -
			*	
			*
			*/
			available : function (callback) {
				methods.log('available: will check availability.');

				// verify browser supports Apple Pay
				if (!window.ApplePaySession.canMakePayments()) {
					methods.log('available: Apple Pay is not available.');	
					methods.fail(false, callback);
				}
				// verify user has a card attached to wallet
				window.ApplePaySession.canMakePaymentsWithActiveCard(options.merchantId)
				.then(function (available) {
					methods.log('available: request complete.', available);
					if (typeof callback === 'function') callback(available);
					// fire events
				});
			},
			/*
			*	init -
			*	
			*
			*/
			init : function (o) {
				o = !o ? {} : o;

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

				// set container for events
				$el = $('body');
				if (!$el.length) {
					methods.log('init: el element not found.');
					return false;
				}
				
				// set state
				state.init = true;

				return ApplePay;
			}
		};
	})(jQuery);

	app.applePay = function (o) {
		return ApplePay.init(o);
	};
})(window.tm || (window.tm = {}));
