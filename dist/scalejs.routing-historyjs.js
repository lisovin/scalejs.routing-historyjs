
/**
 * History.js Native Adapter
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

// Closure
(function(window,undefined){
	

	// Localise Globals
	var History = window.History = window.History||{};

	// Check Existence
	if ( typeof History.Adapter !== 'undefined' ) {
		throw new Error('History.js Adapter has already been loaded...');
	}

	// Add the Adapter
	History.Adapter = {
		/**
		 * History.Adapter.handlers[uid][eventName] = Array
		 */
		handlers: {},

		/**
		 * History.Adapter._uid
		 * The current element unique identifier
		 */
		_uid: 1,

		/**
		 * History.Adapter.uid(element)
		 * @param {Element} element
		 * @return {String} uid
		 */
		uid: function(element){
			return element._uid || (element._uid = History.Adapter._uid++);
		},

		/**
		 * History.Adapter.bind(el,event,callback)
		 * @param {Element} element
		 * @param {String} eventName - custom and standard events
		 * @param {Function} callback
		 * @return
		 */
		bind: function(element,eventName,callback){
			// Prepare
			var uid = History.Adapter.uid(element);

			// Apply Listener
			History.Adapter.handlers[uid] = History.Adapter.handlers[uid] || {};
			History.Adapter.handlers[uid][eventName] = History.Adapter.handlers[uid][eventName] || [];
			History.Adapter.handlers[uid][eventName].push(callback);

			// Bind Global Listener
			element['on'+eventName] = (function(element,eventName){
				return function(event){
					History.Adapter.trigger(element,eventName,event);
				};
			})(element,eventName);
		},

		/**
		 * History.Adapter.trigger(el,event)
		 * @param {Element} element
		 * @param {String} eventName - custom and standard events
		 * @param {Object} event - a object of event data
		 * @return
		 */
		trigger: function(element,eventName,event){
			// Prepare
			event = event || {};
			var uid = History.Adapter.uid(element),
				i,n;

			// Apply Listener
			History.Adapter.handlers[uid] = History.Adapter.handlers[uid] || {};
			History.Adapter.handlers[uid][eventName] = History.Adapter.handlers[uid][eventName] || [];

			// Fire Listeners
			for ( i=0,n=History.Adapter.handlers[uid][eventName].length; i<n; ++i ) {
				History.Adapter.handlers[uid][eventName][i].apply(this,[event]);
			}
		},

		/**
		 * History.Adapter.extractEventData(key,event,extra)
		 * @param {String} key - key for the event data to extract
		 * @param {String} event - custom and standard events
		 * @return {mixed}
		 */
		extractEventData: function(key,event){
			var result = (event && event[key]) || undefined;
			return result;
		},

		/**
		 * History.Adapter.onDomLoad(callback)
		 * @param {Function} callback
		 * @return
		 */
		onDomLoad: function(callback) {
			var timeout = window.setTimeout(function(){
				callback();
			},2000);
			window.onload = function(){
				clearTimeout(timeout);
				callback();
			};
		}
	};

	// Try to Initialise History
	if ( typeof History.init !== 'undefined' ) {
		History.init();
	}

})(window);
/**
 * History.js Core
 * @author Benjamin Arthur Lupton <contact@balupton.com>
 * @copyright 2010-2011 Benjamin Arthur Lupton <contact@balupton.com>
 * @license New BSD License <http://creativecommons.org/licenses/BSD/>
 */

(function(window,undefined){
	

	// ========================================================================
	// Initialise

	// Localise Globals
	var
		console = window.console||undefined, // Prevent a JSLint complain
		document = window.document, // Make sure we are using the correct document
		navigator = window.navigator, // Make sure we are using the correct navigator
		sessionStorage = window.sessionStorage||false, // sessionStorage
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		setInterval = window.setInterval,
		clearInterval = window.clearInterval,
		JSON = window.JSON,
		alert = window.alert,
		History = window.History = window.History||{}, // Public History Object
		history = window.history; // Old History Object

	try {
		sessionStorage.setItem('TEST', '1');
		sessionStorage.removeItem('TEST');
	} catch(e) {
		sessionStorage = false;
	}

	// MooTools Compatibility
	JSON.stringify = JSON.stringify||JSON.encode;
	JSON.parse = JSON.parse||JSON.decode;

	// Check Existence
	if ( typeof History.init !== 'undefined' ) {
		throw new Error('History.js Core has already been loaded...');
	}

	// Initialise History
	History.init = function(options){
		// Check Load Status of Adapter
		if ( typeof History.Adapter === 'undefined' ) {
			return false;
		}

		// Check Load Status of Core
		if ( typeof History.initCore !== 'undefined' ) {
			History.initCore();
		}

		// Check Load Status of HTML4 Support
		if ( typeof History.initHtml4 !== 'undefined' ) {
			History.initHtml4();
		}

		// Return true
		return true;
	};


	// ========================================================================
	// Initialise Core

	// Initialise Core
	History.initCore = function(options){
		// Initialise
		if ( typeof History.initCore.initialized !== 'undefined' ) {
			// Already Loaded
			return false;
		}
		else {
			History.initCore.initialized = true;
		}


		// ====================================================================
		// Options

		/**
		 * History.options
		 * Configurable options
		 */
		History.options = History.options||{};

		/**
		 * History.options.hashChangeInterval
		 * How long should the interval be before hashchange checks
		 */
		History.options.hashChangeInterval = History.options.hashChangeInterval || 100;

		/**
		 * History.options.safariPollInterval
		 * How long should the interval be before safari poll checks
		 */
		History.options.safariPollInterval = History.options.safariPollInterval || 500;

		/**
		 * History.options.doubleCheckInterval
		 * How long should the interval be before we perform a double check
		 */
		History.options.doubleCheckInterval = History.options.doubleCheckInterval || 500;

		/**
		 * History.options.disableSuid
		 * Force History not to append suid
		 */
		History.options.disableSuid = History.options.disableSuid || false;

		/**
		 * History.options.storeInterval
		 * How long should we wait between store calls
		 */
		History.options.storeInterval = History.options.storeInterval || 1000;

		/**
		 * History.options.busyDelay
		 * How long should we wait between busy events
		 */
		History.options.busyDelay = History.options.busyDelay || 250;

		/**
		 * History.options.debug
		 * If true will enable debug messages to be logged
		 */
		History.options.debug = History.options.debug || false;

		/**
		 * History.options.initialTitle
		 * What is the title of the initial state
		 */
		History.options.initialTitle = History.options.initialTitle || document.title;

		/**
		 * History.options.html4Mode
		 * If true, will force HTMl4 mode (hashtags)
		 */
		History.options.html4Mode = History.options.html4Mode || false;

		/**
		 * History.options.delayInit
		 * Want to override default options and call init manually.
		 */
		History.options.delayInit = History.options.delayInit || false;


		// ====================================================================
		// Interval record

		/**
		 * History.intervalList
		 * List of intervals set, to be cleared when document is unloaded.
		 */
		History.intervalList = [];

		/**
		 * History.clearAllIntervals
		 * Clears all setInterval instances.
		 */
		History.clearAllIntervals = function(){
			var i, il = History.intervalList;
			if (typeof il !== "undefined" && il !== null) {
				for (i = 0; i < il.length; i++) {
					clearInterval(il[i]);
				}
				History.intervalList = null;
			}
		};


		// ====================================================================
		// Debug

		/**
		 * History.debug(message,...)
		 * Logs the passed arguments if debug enabled
		 */
		History.debug = function(){
			if ( (History.options.debug||false) ) {
				History.log.apply(History,arguments);
			}
		};

		/**
		 * History.log(message,...)
		 * Logs the passed arguments
		 */
		History.log = function(){
			// Prepare
			var
				consoleExists = !(typeof console === 'undefined' || typeof console.log === 'undefined' || typeof console.log.apply === 'undefined'),
				textarea = document.getElementById('log'),
				message,
				i,n,
				args,arg
				;

			// Write to Console
			if ( consoleExists ) {
				args = Array.prototype.slice.call(arguments);
				message = args.shift();
				if ( typeof console.debug !== 'undefined' ) {
					console.debug.apply(console,[message,args]);
				}
				else {
					console.log.apply(console,[message,args]);
				}
			}
			else {
				message = ("\n"+arguments[0]+"\n");
			}

			// Write to log
			for ( i=1,n=arguments.length; i<n; ++i ) {
				arg = arguments[i];
				if ( typeof arg === 'object' && typeof JSON !== 'undefined' ) {
					try {
						arg = JSON.stringify(arg);
					}
					catch ( Exception ) {
						// Recursive Object
					}
				}
				message += "\n"+arg+"\n";
			}

			// Textarea
			if ( textarea ) {
				textarea.value += message+"\n-----\n";
				textarea.scrollTop = textarea.scrollHeight - textarea.clientHeight;
			}
			// No Textarea, No Console
			else if ( !consoleExists ) {
				alert(message);
			}

			// Return true
			return true;
		};


		// ====================================================================
		// Emulated Status

		/**
		 * History.getInternetExplorerMajorVersion()
		 * Get's the major version of Internet Explorer
		 * @return {integer}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 * @author James Padolsey <https://gist.github.com/527683>
		 */
		History.getInternetExplorerMajorVersion = function(){
			var result = History.getInternetExplorerMajorVersion.cached =
					(typeof History.getInternetExplorerMajorVersion.cached !== 'undefined')
				?	History.getInternetExplorerMajorVersion.cached
				:	(function(){
						var v = 3,
								div = document.createElement('div'),
								all = div.getElementsByTagName('i');
						while ( (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->') && all[0] ) {}
						return (v > 4) ? v : false;
					})()
				;
			return result;
		};

		/**
		 * History.isInternetExplorer()
		 * Are we using Internet Explorer?
		 * @return {boolean}
		 * @license Public Domain
		 * @author Benjamin Arthur Lupton <contact@balupton.com>
		 */
		History.isInternetExplorer = function(){
			var result =
				History.isInternetExplorer.cached =
				(typeof History.isInternetExplorer.cached !== 'undefined')
					?	History.isInternetExplorer.cached
					:	Boolean(History.getInternetExplorerMajorVersion())
				;
			return result;
		};

		/**
		 * History.emulated
		 * Which features require emulating?
		 */

		if (History.options.html4Mode) {
			History.emulated = {
				pushState : true,
				hashChange: true
			};
		}

		else {

			History.emulated = {
				pushState: !Boolean(
					window.history && window.history.pushState && window.history.replaceState
					&& !(
						(/ Mobile\/([1-7][a-z]|(8([abcde]|f(1[0-8]))))/i).test(navigator.userAgent) /* disable for versions of iOS before version 4.3 (8F190) */
						|| (/AppleWebKit\/5([0-2]|3[0-2])/i).test(navigator.userAgent) /* disable for the mercury iOS browser, or at least older versions of the webkit engine */
					)
				),
				hashChange: Boolean(
					!(('onhashchange' in window) || ('onhashchange' in document))
					||
					(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8)
				)
			};
		}

		/**
		 * History.enabled
		 * Is History enabled?
		 */
		History.enabled = !History.emulated.pushState;

		/**
		 * History.bugs
		 * Which bugs are present
		 */
		History.bugs = {
			/**
			 * Safari 5 and Safari iOS 4 fail to return to the correct state once a hash is replaced by a `replaceState` call
			 * https://bugs.webkit.org/show_bug.cgi?id=56249
			 */
			setHash: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * Safari 5 and Safari iOS 4 sometimes fail to apply the state change under busy conditions
			 * https://bugs.webkit.org/show_bug.cgi?id=42940
			 */
			safariPoll: Boolean(!History.emulated.pushState && navigator.vendor === 'Apple Computer, Inc.' && /AppleWebKit\/5([0-2]|3[0-3])/.test(navigator.userAgent)),

			/**
			 * MSIE 6 and 7 sometimes do not apply a hash even it was told to (requiring a second call to the apply function)
			 */
			ieDoubleCheck: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 8),

			/**
			 * MSIE 6 requires the entire hash to be encoded for the hashes to trigger the onHashChange event
			 */
			hashEscape: Boolean(History.isInternetExplorer() && History.getInternetExplorerMajorVersion() < 7)
		};

		/**
		 * History.isEmptyObject(obj)
		 * Checks to see if the Object is Empty
		 * @param {Object} obj
		 * @return {boolean}
		 */
		History.isEmptyObject = function(obj) {
			for ( var name in obj ) {
				if ( obj.hasOwnProperty(name) ) {
					return false;
				}
			}
			return true;
		};

		/**
		 * History.cloneObject(obj)
		 * Clones a object and eliminate all references to the original contexts
		 * @param {Object} obj
		 * @return {Object}
		 */
		History.cloneObject = function(obj) {
			var hash,newObj;
			if ( obj ) {
				hash = JSON.stringify(obj);
				newObj = JSON.parse(hash);
			}
			else {
				newObj = {};
			}
			return newObj;
		};


		// ====================================================================
		// URL Helpers

		/**
		 * History.getRootUrl()
		 * Turns "http://mysite.com/dir/page.html?asd" into "http://mysite.com"
		 * @return {String} rootUrl
		 */
		History.getRootUrl = function(){
			// Create
			var rootUrl = document.location.protocol+'//'+(document.location.hostname||document.location.host);
			if ( document.location.port||false ) {
				rootUrl += ':'+document.location.port;
			}
			rootUrl += '/';

			// Return
			return rootUrl;
		};

		/**
		 * History.getBaseHref()
		 * Fetches the `href` attribute of the `<base href="...">` element if it exists
		 * @return {String} baseHref
		 */
		History.getBaseHref = function(){
			// Create
			var
				baseElements = document.getElementsByTagName('base'),
				baseElement = null,
				baseHref = '';

			// Test for Base Element
			if ( baseElements.length === 1 ) {
				// Prepare for Base Element
				baseElement = baseElements[0];
				baseHref = baseElement.href.replace(/[^\/]+$/,'');
			}

			// Adjust trailing slash
			baseHref = baseHref.replace(/\/+$/,'');
			if ( baseHref ) baseHref += '/';

			// Return
			return baseHref;
		};

		/**
		 * History.getBaseUrl()
		 * Fetches the baseHref or basePageUrl or rootUrl (whichever one exists first)
		 * @return {String} baseUrl
		 */
		History.getBaseUrl = function(){
			// Create
			var baseUrl = History.getBaseHref()||History.getBasePageUrl()||History.getRootUrl();

			// Return
			return baseUrl;
		};

		/**
		 * History.getPageUrl()
		 * Fetches the URL of the current page
		 * @return {String} pageUrl
		 */
		History.getPageUrl = function(){
			// Fetch
			var
				State = History.getState(false,false),
				stateUrl = (State||{}).url||History.getLocationHref(),
				pageUrl;

			// Create
			pageUrl = stateUrl.replace(/\/+$/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/\./).test(part) ? part : part+'/';
			});

			// Return
			return pageUrl;
		};

		/**
		 * History.getBasePageUrl()
		 * Fetches the Url of the directory of the current page
		 * @return {String} basePageUrl
		 */
		History.getBasePageUrl = function(){
			// Create
			var basePageUrl = (History.getLocationHref()).replace(/[#\?].*/,'').replace(/[^\/]+$/,function(part,index,string){
				return (/[^\/]$/).test(part) ? '' : part;
			}).replace(/\/+$/,'')+'/';

			// Return
			return basePageUrl;
		};

		/**
		 * History.getFullUrl(url)
		 * Ensures that we have an absolute URL and not a relative URL
		 * @param {string} url
		 * @param {Boolean} allowBaseHref
		 * @return {string} fullUrl
		 */
		History.getFullUrl = function(url,allowBaseHref){
			// Prepare
			var fullUrl = url, firstChar = url.substring(0,1);
			allowBaseHref = (typeof allowBaseHref === 'undefined') ? true : allowBaseHref;

			// Check
			if ( /[a-z]+\:\/\//.test(url) ) {
				// Full URL
			}
			else if ( firstChar === '/' ) {
				// Root URL
				fullUrl = History.getRootUrl()+url.replace(/^\/+/,'');
			}
			else if ( firstChar === '#' ) {
				// Anchor URL
				fullUrl = History.getPageUrl().replace(/#.*/,'')+url;
			}
			else if ( firstChar === '?' ) {
				// Query URL
				fullUrl = History.getPageUrl().replace(/[\?#].*/,'')+url;
			}
			else {
				// Relative URL
				if ( allowBaseHref ) {
					fullUrl = History.getBaseUrl()+url.replace(/^(\.\/)+/,'');
				} else {
					fullUrl = History.getBasePageUrl()+url.replace(/^(\.\/)+/,'');
				}
				// We have an if condition above as we do not want hashes
				// which are relative to the baseHref in our URLs
				// as if the baseHref changes, then all our bookmarks
				// would now point to different locations
				// whereas the basePageUrl will always stay the same
			}

			// Return
			return fullUrl.replace(/\#$/,'');
		};

		/**
		 * History.getShortUrl(url)
		 * Ensures that we have a relative URL and not a absolute URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getShortUrl = function(url){
			// Prepare
			var shortUrl = url, baseUrl = History.getBaseUrl(), rootUrl = History.getRootUrl();

			// Trim baseUrl
			if ( History.emulated.pushState ) {
				// We are in a if statement as when pushState is not emulated
				// The actual url these short urls are relative to can change
				// So within the same session, we the url may end up somewhere different
				shortUrl = shortUrl.replace(baseUrl,'');
			}

			// Trim rootUrl
			shortUrl = shortUrl.replace(rootUrl,'/');

			// Ensure we can still detect it as a state
			if ( History.isTraditionalAnchor(shortUrl) ) {
				shortUrl = './'+shortUrl;
			}

			// Clean It
			shortUrl = shortUrl.replace(/^(\.\/)+/g,'./').replace(/\#$/,'');

			// Return
			return shortUrl;
		};

		/**
		 * History.getLocationHref(document)
		 * Returns a normalized version of document.location.href
		 * accounting for browser inconsistencies, etc.
		 *
		 * This URL will be URI-encoded and will include the hash
		 *
		 * @param {object} document
		 * @return {string} url
		 */
		History.getLocationHref = function(doc) {
			doc = doc || document;

			// most of the time, this will be true
			if (doc.URL === doc.location.href)
				return doc.location.href;

			// some versions of webkit URI-decode document.location.href
			// but they leave document.URL in an encoded state
			if (doc.location.href === decodeURIComponent(doc.URL))
				return doc.URL;

			// FF 3.6 only updates document.URL when a page is reloaded
			// document.location.href is updated correctly
			if (doc.location.hash && decodeURIComponent(doc.location.href.replace(/^[^#]+/, "")) === doc.location.hash)
				return doc.location.href;

			if (doc.URL.indexOf('#') == -1 && doc.location.href.indexOf('#') != -1)
				return doc.location.href;
			
			return doc.URL || doc.location.href;
		};


		// ====================================================================
		// State Storage

		/**
		 * History.store
		 * The store for all session specific data
		 */
		History.store = {};

		/**
		 * History.idToState
		 * 1-1: State ID to State Object
		 */
		History.idToState = History.idToState||{};

		/**
		 * History.stateToId
		 * 1-1: State String to State ID
		 */
		History.stateToId = History.stateToId||{};

		/**
		 * History.urlToId
		 * 1-1: State URL to State ID
		 */
		History.urlToId = History.urlToId||{};

		/**
		 * History.storedStates
		 * Store the states in an array
		 */
		History.storedStates = History.storedStates||[];

		/**
		 * History.savedStates
		 * Saved the states in an array
		 */
		History.savedStates = History.savedStates||[];

		/**
		 * History.noramlizeStore()
		 * Noramlize the store by adding necessary values
		 */
		History.normalizeStore = function(){
			History.store.idToState = History.store.idToState||{};
			History.store.urlToId = History.store.urlToId||{};
			History.store.stateToId = History.store.stateToId||{};
		};

		/**
		 * History.getState()
		 * Get an object containing the data, title and url of the current state
		 * @param {Boolean} friendly
		 * @param {Boolean} create
		 * @return {Object} State
		 */
		History.getState = function(friendly,create){
			// Prepare
			if ( typeof friendly === 'undefined' ) { friendly = true; }
			if ( typeof create === 'undefined' ) { create = true; }

			// Fetch
			var State = History.getLastSavedState();

			// Create
			if ( !State && create ) {
				State = History.createStateObject();
			}

			// Adjust
			if ( friendly ) {
				State = History.cloneObject(State);
				State.url = State.cleanUrl||State.url;
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByState(State)
		 * Gets a ID for a State
		 * @param {State} newState
		 * @return {String} id
		 */
		History.getIdByState = function(newState){

			// Fetch ID
			var id = History.extractId(newState.url),
				str;

			if ( !id ) {
				// Find ID via State String
				str = History.getStateString(newState);
				if ( typeof History.stateToId[str] !== 'undefined' ) {
					id = History.stateToId[str];
				}
				else if ( typeof History.store.stateToId[str] !== 'undefined' ) {
					id = History.store.stateToId[str];
				}
				else {
					// Generate a new ID
					while ( true ) {
						id = (new Date()).getTime() + String(Math.random()).replace(/\D/g,'');
						if ( typeof History.idToState[id] === 'undefined' && typeof History.store.idToState[id] === 'undefined' ) {
							break;
						}
					}

					// Apply the new State to the ID
					History.stateToId[str] = id;
					History.idToState[id] = newState;
				}
			}

			// Return ID
			return id;
		};

		/**
		 * History.normalizeState(State)
		 * Expands a State Object
		 * @param {object} State
		 * @return {object}
		 */
		History.normalizeState = function(oldState){
			// Variables
			var newState, dataNotEmpty;

			// Prepare
			if ( !oldState || (typeof oldState !== 'object') ) {
				oldState = {};
			}

			// Check
			if ( typeof oldState.normalized !== 'undefined' ) {
				return oldState;
			}

			// Adjust
			if ( !oldState.data || (typeof oldState.data !== 'object') ) {
				oldState.data = {};
			}

			// ----------------------------------------------------------------

			// Create
			newState = {};
			newState.normalized = true;
			newState.title = oldState.title||'';
			newState.url = History.getFullUrl(oldState.url?oldState.url:(History.getLocationHref()));
			newState.hash = History.getShortUrl(newState.url);
			newState.data = History.cloneObject(oldState.data);

			// Fetch ID
			newState.id = History.getIdByState(newState);

			// ----------------------------------------------------------------

			// Clean the URL
			newState.cleanUrl = newState.url.replace(/\??\&_suid.*/,'');
			newState.url = newState.cleanUrl;

			// Check to see if we have more than just a url
			dataNotEmpty = !History.isEmptyObject(newState.data);

			// Apply
			if ( (newState.title || dataNotEmpty) && History.options.disableSuid !== true ) {
				// Add ID to Hash
				newState.hash = History.getShortUrl(newState.url).replace(/\??\&_suid.*/,'');
				if ( !/\?/.test(newState.hash) ) {
					newState.hash += '?';
				}
				newState.hash += '&_suid='+newState.id;
			}

			// Create the Hashed URL
			newState.hashedUrl = History.getFullUrl(newState.hash);

			// ----------------------------------------------------------------

			// Update the URL if we have a duplicate
			if ( (History.emulated.pushState || History.bugs.safariPoll) && History.hasUrlDuplicate(newState) ) {
				newState.url = newState.hashedUrl;
			}

			// ----------------------------------------------------------------

			// Return
			return newState;
		};

		/**
		 * History.createStateObject(data,title,url)
		 * Creates a object based on the data, title and url state params
		 * @param {object} data
		 * @param {string} title
		 * @param {string} url
		 * @return {object}
		 */
		History.createStateObject = function(data,title,url){
			// Hashify
			var State = {
				'data': data,
				'title': title,
				'url': url
			};

			// Expand the State
			State = History.normalizeState(State);

			// Return object
			return State;
		};

		/**
		 * History.getStateById(id)
		 * Get a state by it's UID
		 * @param {String} id
		 */
		History.getStateById = function(id){
			// Prepare
			id = String(id);

			// Retrieve
			var State = History.idToState[id] || History.store.idToState[id] || undefined;

			// Return State
			return State;
		};

		/**
		 * Get a State's String
		 * @param {State} passedState
		 */
		History.getStateString = function(passedState){
			// Prepare
			var State, cleanedState, str;

			// Fetch
			State = History.normalizeState(passedState);

			// Clean
			cleanedState = {
				data: State.data,
				title: passedState.title,
				url: passedState.url
			};

			// Fetch
			str = JSON.stringify(cleanedState);

			// Return
			return str;
		};

		/**
		 * Get a State's ID
		 * @param {State} passedState
		 * @return {String} id
		 */
		History.getStateId = function(passedState){
			// Prepare
			var State, id;

			// Fetch
			State = History.normalizeState(passedState);

			// Fetch
			id = State.id;

			// Return
			return id;
		};

		/**
		 * History.getHashByState(State)
		 * Creates a Hash for the State Object
		 * @param {State} passedState
		 * @return {String} hash
		 */
		History.getHashByState = function(passedState){
			// Prepare
			var State, hash;

			// Fetch
			State = History.normalizeState(passedState);

			// Hash
			hash = State.hash;

			// Return
			return hash;
		};

		/**
		 * History.extractId(url_or_hash)
		 * Get a State ID by it's URL or Hash
		 * @param {string} url_or_hash
		 * @return {string} id
		 */
		History.extractId = function ( url_or_hash ) {
			// Prepare
			var id,parts,url, tmp;

			// Extract
			
			// If the URL has a #, use the id from before the #
			if (url_or_hash.indexOf('#') != -1)
			{
				tmp = url_or_hash.split("#")[0];
			}
			else
			{
				tmp = url_or_hash;
			}
			
			parts = /(.*)\&_suid=([0-9]+)$/.exec(tmp);
			url = parts ? (parts[1]||url_or_hash) : url_or_hash;
			id = parts ? String(parts[2]||'') : '';

			// Return
			return id||false;
		};

		/**
		 * History.isTraditionalAnchor
		 * Checks to see if the url is a traditional anchor or not
		 * @param {String} url_or_hash
		 * @return {Boolean}
		 */
		History.isTraditionalAnchor = function(url_or_hash){
			// Check
			var isTraditional = !(/[\/\?\.]/.test(url_or_hash));

			// Return
			return isTraditional;
		};

		/**
		 * History.extractState
		 * Get a State by it's URL or Hash
		 * @param {String} url_or_hash
		 * @return {State|null}
		 */
		History.extractState = function(url_or_hash,create){
			// Prepare
			var State = null, id, url;
			create = create||false;

			// Fetch SUID
			id = History.extractId(url_or_hash);
			if ( id ) {
				State = History.getStateById(id);
			}

			// Fetch SUID returned no State
			if ( !State ) {
				// Fetch URL
				url = History.getFullUrl(url_or_hash);

				// Check URL
				id = History.getIdByUrl(url)||false;
				if ( id ) {
					State = History.getStateById(id);
				}

				// Create State
				if ( !State && create && !History.isTraditionalAnchor(url_or_hash) ) {
					State = History.createStateObject(null,null,url);
				}
			}

			// Return
			return State;
		};

		/**
		 * History.getIdByUrl()
		 * Get a State ID by a State URL
		 */
		History.getIdByUrl = function(url){
			// Fetch
			var id = History.urlToId[url] || History.store.urlToId[url] || undefined;

			// Return
			return id;
		};

		/**
		 * History.getLastSavedState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastSavedState = function(){
			return History.savedStates[History.savedStates.length-1]||undefined;
		};

		/**
		 * History.getLastStoredState()
		 * Get an object containing the data, title and url of the current state
		 * @return {Object} State
		 */
		History.getLastStoredState = function(){
			return History.storedStates[History.storedStates.length-1]||undefined;
		};

		/**
		 * History.hasUrlDuplicate
		 * Checks if a Url will have a url conflict
		 * @param {Object} newState
		 * @return {Boolean} hasDuplicate
		 */
		History.hasUrlDuplicate = function(newState) {
			// Prepare
			var hasDuplicate = false,
				oldState;

			// Fetch
			oldState = History.extractState(newState.url);

			// Check
			hasDuplicate = oldState && oldState.id !== newState.id;

			// Return
			return hasDuplicate;
		};

		/**
		 * History.storeState
		 * Store a State
		 * @param {Object} newState
		 * @return {Object} newState
		 */
		History.storeState = function(newState){
			// Store the State
			History.urlToId[newState.url] = newState.id;

			// Push the State
			History.storedStates.push(History.cloneObject(newState));

			// Return newState
			return newState;
		};

		/**
		 * History.isLastSavedState(newState)
		 * Tests to see if the state is the last state
		 * @param {Object} newState
		 * @return {boolean} isLast
		 */
		History.isLastSavedState = function(newState){
			// Prepare
			var isLast = false,
				newId, oldState, oldId;

			// Check
			if ( History.savedStates.length ) {
				newId = newState.id;
				oldState = History.getLastSavedState();
				oldId = oldState.id;

				// Check
				isLast = (newId === oldId);
			}

			// Return
			return isLast;
		};

		/**
		 * History.saveState
		 * Push a State
		 * @param {Object} newState
		 * @return {boolean} changed
		 */
		History.saveState = function(newState){
			// Check Hash
			if ( History.isLastSavedState(newState) ) {
				return false;
			}

			// Push the State
			History.savedStates.push(History.cloneObject(newState));

			// Return true
			return true;
		};

		/**
		 * History.getStateByIndex()
		 * Gets a state by the index
		 * @param {integer} index
		 * @return {Object}
		 */
		History.getStateByIndex = function(index){
			// Prepare
			var State = null;

			// Handle
			if ( typeof index === 'undefined' ) {
				// Get the last inserted
				State = History.savedStates[History.savedStates.length-1];
			}
			else if ( index < 0 ) {
				// Get from the end
				State = History.savedStates[History.savedStates.length+index];
			}
			else {
				// Get from the beginning
				State = History.savedStates[index];
			}

			// Return State
			return State;
		};
		
		/**
		 * History.getCurrentIndex()
		 * Gets the current index
		 * @return (integer)
		*/
		History.getCurrentIndex = function(){
			// Prepare
			var index = null;
			
			// No states saved
			if(History.savedStates.length < 1) {
				index = 0;
			}
			else {
				index = History.savedStates.length-1;
			}
			return index;
		};

		// ====================================================================
		// Hash Helpers

		/**
		 * History.getHash()
		 * @param {Location=} location
		 * Gets the current document hash
		 * Note: unlike location.hash, this is guaranteed to return the escaped hash in all browsers
		 * @return {string}
		 */
		History.getHash = function(doc){
			var url = History.getLocationHref(doc),
				hash;
			hash = History.getHashByUrl(url);
			return hash;
		};

		/**
		 * History.unescapeHash()
		 * normalize and Unescape a Hash
		 * @param {String} hash
		 * @return {string}
		 */
		History.unescapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Unescape hash
			result = decodeURIComponent(result);

			// Return result
			return result;
		};

		/**
		 * History.normalizeHash()
		 * normalize a hash across browsers
		 * @return {string}
		 */
		History.normalizeHash = function(hash){
			// Prepare
			var result = hash.replace(/[^#]*#/,'').replace(/#.*/, '');

			// Return result
			return result;
		};

		/**
		 * History.setHash(hash)
		 * Sets the document hash
		 * @param {string} hash
		 * @return {History}
		 */
		History.setHash = function(hash,queue){
			// Prepare
			var State, pageUrl;

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.setHash: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.setHash,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Log
			//History.debug('History.setHash: called',hash);

			// Make Busy + Continue
			History.busy(true);

			// Check if hash is a state
			State = History.extractState(hash,true);
			if ( State && !History.emulated.pushState ) {
				// Hash is a state so skip the setHash
				//History.debug('History.setHash: Hash is a state so skipping the hash set with a direct pushState call',arguments);

				// PushState
				History.pushState(State.data,State.title,State.url,false);
			}
			else if ( History.getHash() !== hash ) {
				// Hash is a proper hash, so apply it

				// Handle browser bugs
				if ( History.bugs.setHash ) {
					// Fix Safari Bug https://bugs.webkit.org/show_bug.cgi?id=56249

					// Fetch the base page
					pageUrl = History.getPageUrl();

					// Safari hash apply
					History.pushState(null,null,pageUrl+'#'+hash,false);
				}
				else {
					// Normal hash apply
					document.location.hash = hash;
				}
			}

			// Chain
			return History;
		};

		/**
		 * History.escape()
		 * normalize and Escape a Hash
		 * @return {string}
		 */
		History.escapeHash = function(hash){
			// Prepare
			var result = History.normalizeHash(hash);

			// Escape hash
			result = window.encodeURIComponent(result);

			// IE6 Escape Bug
			if ( !History.bugs.hashEscape ) {
				// Restore common parts
				result = result
					.replace(/\%21/g,'!')
					.replace(/\%26/g,'&')
					.replace(/\%3D/g,'=')
					.replace(/\%3F/g,'?');
			}

			// Return result
			return result;
		};

		/**
		 * History.getHashByUrl(url)
		 * Extracts the Hash from a URL
		 * @param {string} url
		 * @return {string} url
		 */
		History.getHashByUrl = function(url){
			// Extract the hash
			var hash = String(url)
				.replace(/([^#]*)#?([^#]*)#?(.*)/, '$2')
				;

			// Unescape hash
			hash = History.unescapeHash(hash);

			// Return hash
			return hash;
		};

		/**
		 * History.setTitle(title)
		 * Applies the title to the document
		 * @param {State} newState
		 * @return {Boolean}
		 */
		History.setTitle = function(newState){
			// Prepare
			var title = newState.title,
				firstState;

			// Initial
			if ( !title ) {
				firstState = History.getStateByIndex(0);
				if ( firstState && firstState.url === newState.url ) {
					title = firstState.title||History.options.initialTitle;
				}
			}

			// Apply
			try {
				document.getElementsByTagName('title')[0].innerHTML = title.replace('<','&lt;').replace('>','&gt;').replace(' & ',' &amp; ');
			}
			catch ( Exception ) { }
			document.title = title;

			// Chain
			return History;
		};


		// ====================================================================
		// Queueing

		/**
		 * History.queues
		 * The list of queues to use
		 * First In, First Out
		 */
		History.queues = [];

		/**
		 * History.busy(value)
		 * @param {boolean} value [optional]
		 * @return {boolean} busy
		 */
		History.busy = function(value){
			// Apply
			if ( typeof value !== 'undefined' ) {
				//History.debug('History.busy: changing ['+(History.busy.flag||false)+'] to ['+(value||false)+']', History.queues.length);
				History.busy.flag = value;
			}
			// Default
			else if ( typeof History.busy.flag === 'undefined' ) {
				History.busy.flag = false;
			}

			// Queue
			if ( !History.busy.flag ) {
				// Execute the next item in the queue
				clearTimeout(History.busy.timeout);
				var fireNext = function(){
					var i, queue, item;
					if ( History.busy.flag ) return;
					for ( i=History.queues.length-1; i >= 0; --i ) {
						queue = History.queues[i];
						if ( queue.length === 0 ) continue;
						item = queue.shift();
						History.fireQueueItem(item);
						History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
					}
				};
				History.busy.timeout = setTimeout(fireNext,History.options.busyDelay);
			}

			// Return
			return History.busy.flag;
		};

		/**
		 * History.busy.flag
		 */
		History.busy.flag = false;

		/**
		 * History.fireQueueItem(item)
		 * Fire a Queue Item
		 * @param {Object} item
		 * @return {Mixed} result
		 */
		History.fireQueueItem = function(item){
			return item.callback.apply(item.scope||History,item.args||[]);
		};

		/**
		 * History.pushQueue(callback,args)
		 * Add an item to the queue
		 * @param {Object} item [scope,callback,args,queue]
		 */
		History.pushQueue = function(item){
			// Prepare the queue
			History.queues[item.queue||0] = History.queues[item.queue||0]||[];

			// Add to the queue
			History.queues[item.queue||0].push(item);

			// Chain
			return History;
		};

		/**
		 * History.queue (item,queue), (func,queue), (func), (item)
		 * Either firs the item now if not busy, or adds it to the queue
		 */
		History.queue = function(item,queue){
			// Prepare
			if ( typeof item === 'function' ) {
				item = {
					callback: item
				};
			}
			if ( typeof queue !== 'undefined' ) {
				item.queue = queue;
			}

			// Handle
			if ( History.busy() ) {
				History.pushQueue(item);
			} else {
				History.fireQueueItem(item);
			}

			// Chain
			return History;
		};

		/**
		 * History.clearQueue()
		 * Clears the Queue
		 */
		History.clearQueue = function(){
			History.busy.flag = false;
			History.queues = [];
			return History;
		};


		// ====================================================================
		// IE Bug Fix

		/**
		 * History.stateChanged
		 * States whether or not the state has changed since the last double check was initialised
		 */
		History.stateChanged = false;

		/**
		 * History.doubleChecker
		 * Contains the timeout used for the double checks
		 */
		History.doubleChecker = false;

		/**
		 * History.doubleCheckComplete()
		 * Complete a double check
		 * @return {History}
		 */
		History.doubleCheckComplete = function(){
			// Update
			History.stateChanged = true;

			// Clear
			History.doubleCheckClear();

			// Chain
			return History;
		};

		/**
		 * History.doubleCheckClear()
		 * Clear a double check
		 * @return {History}
		 */
		History.doubleCheckClear = function(){
			// Clear
			if ( History.doubleChecker ) {
				clearTimeout(History.doubleChecker);
				History.doubleChecker = false;
			}

			// Chain
			return History;
		};

		/**
		 * History.doubleCheck()
		 * Create a double check
		 * @return {History}
		 */
		History.doubleCheck = function(tryAgain){
			// Reset
			History.stateChanged = false;
			History.doubleCheckClear();

			// Fix IE6,IE7 bug where calling history.back or history.forward does not actually change the hash (whereas doing it manually does)
			// Fix Safari 5 bug where sometimes the state does not change: https://bugs.webkit.org/show_bug.cgi?id=42940
			if ( History.bugs.ieDoubleCheck ) {
				// Apply Check
				History.doubleChecker = setTimeout(
					function(){
						History.doubleCheckClear();
						if ( !History.stateChanged ) {
							//History.debug('History.doubleCheck: State has not yet changed, trying again', arguments);
							// Re-Attempt
							tryAgain();
						}
						return true;
					},
					History.options.doubleCheckInterval
				);
			}

			// Chain
			return History;
		};


		// ====================================================================
		// Safari Bug Fix

		/**
		 * History.safariStatePoll()
		 * Poll the current state
		 * @return {History}
		 */
		History.safariStatePoll = function(){
			// Poll the URL

			// Get the Last State which has the new URL
			var
				urlState = History.extractState(History.getLocationHref()),
				newState;

			// Check for a difference
			if ( !History.isLastSavedState(urlState) ) {
				newState = urlState;
			}
			else {
				return;
			}

			// Check if we have a state with that url
			// If not create it
			if ( !newState ) {
				//History.debug('History.safariStatePoll: new');
				newState = History.createStateObject();
			}

			// Apply the New State
			//History.debug('History.safariStatePoll: trigger');
			History.Adapter.trigger(window,'popstate');

			// Chain
			return History;
		};


		// ====================================================================
		// State Aliases

		/**
		 * History.back(queue)
		 * Send the browser history back one item
		 * @param {Integer} queue [optional]
		 */
		History.back = function(queue){
			//History.debug('History.back: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.back: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.back,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.back(false);
			});

			// Go back
			history.go(-1);

			// End back closure
			return true;
		};

		/**
		 * History.forward(queue)
		 * Send the browser history forward one item
		 * @param {Integer} queue [optional]
		 */
		History.forward = function(queue){
			//History.debug('History.forward: called', arguments);

			// Handle Queueing
			if ( queue !== false && History.busy() ) {
				// Wait + Push to Queue
				//History.debug('History.forward: we must wait', arguments);
				History.pushQueue({
					scope: History,
					callback: History.forward,
					args: arguments,
					queue: queue
				});
				return false;
			}

			// Make Busy + Continue
			History.busy(true);

			// Fix certain browser bugs that prevent the state from changing
			History.doubleCheck(function(){
				History.forward(false);
			});

			// Go forward
			history.go(1);

			// End forward closure
			return true;
		};

		/**
		 * History.go(index,queue)
		 * Send the browser history back or forward index times
		 * @param {Integer} queue [optional]
		 */
		History.go = function(index,queue){
			//History.debug('History.go: called', arguments);

			// Prepare
			var i;

			// Handle
			if ( index > 0 ) {
				// Forward
				for ( i=1; i<=index; ++i ) {
					History.forward(queue);
				}
			}
			else if ( index < 0 ) {
				// Backward
				for ( i=-1; i>=index; --i ) {
					History.back(queue);
				}
			}
			else {
				throw new Error('History.go: History.go requires a positive or negative integer passed.');
			}

			// Chain
			return History;
		};


		// ====================================================================
		// HTML5 State Support

		// Non-Native pushState Implementation
		if ( History.emulated.pushState ) {
			/*
			 * Provide Skeleton for HTML4 Browsers
			 */

			// Prepare
			var emptyFunction = function(){};
			History.pushState = History.pushState||emptyFunction;
			History.replaceState = History.replaceState||emptyFunction;
		} // History.emulated.pushState

		// Native pushState Implementation
		else {
			/*
			 * Use native HTML5 History API Implementation
			 */

			/**
			 * History.onPopState(event,extra)
			 * Refresh the Current State
			 */
			History.onPopState = function(event,extra){
				// Prepare
				var stateId = false, newState = false, currentHash, currentState;

				// Reset the double check
				History.doubleCheckComplete();

				// Check for a Hash, and handle apporiatly
				currentHash = History.getHash();
				if ( currentHash ) {
					// Expand Hash
					currentState = History.extractState(currentHash||History.getLocationHref(),true);
					if ( currentState ) {
						// We were able to parse it, it must be a State!
						// Let's forward to replaceState
						//History.debug('History.onPopState: state anchor', currentHash, currentState);
						History.replaceState(currentState.data, currentState.title, currentState.url, false);
					}
					else {
						// Traditional Anchor
						//History.debug('History.onPopState: traditional anchor', currentHash);
						History.Adapter.trigger(window,'anchorchange');
						History.busy(false);
					}

					// We don't care for hashes
					History.expectedStateId = false;
					return false;
				}

				// Ensure
				stateId = History.Adapter.extractEventData('state',event,extra) || false;

				// Fetch State
				if ( stateId ) {
					// Vanilla: Back/forward button was used
					newState = History.getStateById(stateId);
				}
				else if ( History.expectedStateId ) {
					// Vanilla: A new state was pushed, and popstate was called manually
					newState = History.getStateById(History.expectedStateId);
				}
				else {
					// Initial State
					newState = History.extractState(History.getLocationHref());
				}

				// The State did not exist in our store
				if ( !newState ) {
					// Regenerate the State
					newState = History.createStateObject(null,null,History.getLocationHref());
				}

				// Clean
				History.expectedStateId = false;

				// Check if we are the same state
				if ( History.isLastSavedState(newState) ) {
					// There has been no change (just the page's hash has finally propagated)
					//History.debug('History.onPopState: no change', newState, History.savedStates);
					History.busy(false);
					return false;
				}

				// Store the State
				History.storeState(newState);
				History.saveState(newState);

				// Force update of the title
				History.setTitle(newState);

				// Fire Our Event
				History.Adapter.trigger(window,'statechange');
				History.busy(false);

				// Return true
				return true;
			};
			History.Adapter.bind(window,'popstate',History.onPopState);

			/**
			 * History.pushState(data,title,url)
			 * Add a new State to the history object, become it, and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.pushState = function(data,title,url,queue){
				//History.debug('History.pushState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.pushState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.pushState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.pushState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End pushState closure
				return true;
			};

			/**
			 * History.replaceState(data,title,url)
			 * Replace the State and trigger onpopstate
			 * We have to trigger for HTML4 compatibility
			 * @param {object} data
			 * @param {string} title
			 * @param {string} url
			 * @return {true}
			 */
			History.replaceState = function(data,title,url,queue){
				//History.debug('History.replaceState: called', arguments);

				// Check the State
				if ( History.getHashByUrl(url) && History.emulated.pushState ) {
					throw new Error('History.js does not support states with fragement-identifiers (hashes/anchors).');
				}

				// Handle Queueing
				if ( queue !== false && History.busy() ) {
					// Wait + Push to Queue
					//History.debug('History.replaceState: we must wait', arguments);
					History.pushQueue({
						scope: History,
						callback: History.replaceState,
						args: arguments,
						queue: queue
					});
					return false;
				}

				// Make Busy + Continue
				History.busy(true);

				// Create the newState
				var newState = History.createStateObject(data,title,url);

				// Check it
				if ( History.isLastSavedState(newState) ) {
					// Won't be a change
					History.busy(false);
				}
				else {
					// Store the newState
					History.storeState(newState);
					History.expectedStateId = newState.id;

					// Push the newState
					history.replaceState(newState.id,newState.title,newState.url);

					// Fire HTML5 Event
					History.Adapter.trigger(window,'popstate');
				}

				// End replaceState closure
				return true;
			};

		} // !History.emulated.pushState


		// ====================================================================
		// Initialise

		/**
		 * Load the Store
		 */
		if ( sessionStorage ) {
			// Fetch
			try {
				History.store = JSON.parse(sessionStorage.getItem('History.store'))||{};
			}
			catch ( err ) {
				History.store = {};
			}

			// Normalize
			History.normalizeStore();
		}
		else {
			// Default Load
			History.store = {};
			History.normalizeStore();
		}

		/**
		 * Clear Intervals on exit to prevent memory leaks
		 */
		History.Adapter.bind(window,"unload",History.clearAllIntervals);

		/**
		 * Create the initial State
		 */
		History.saveState(History.storeState(History.extractState(History.getLocationHref(),true)));

		/**
		 * Bind for Saving Store
		 */
		if ( sessionStorage ) {
			// When the page is closed
			History.onUnload = function(){
				// Prepare
				var	currentStore, item, currentStoreString;

				// Fetch
				try {
					currentStore = JSON.parse(sessionStorage.getItem('History.store'))||{};
				}
				catch ( err ) {
					currentStore = {};
				}

				// Ensure
				currentStore.idToState = currentStore.idToState || {};
				currentStore.urlToId = currentStore.urlToId || {};
				currentStore.stateToId = currentStore.stateToId || {};

				// Sync
				for ( item in History.idToState ) {
					if ( !History.idToState.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.idToState[item] = History.idToState[item];
				}
				for ( item in History.urlToId ) {
					if ( !History.urlToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.urlToId[item] = History.urlToId[item];
				}
				for ( item in History.stateToId ) {
					if ( !History.stateToId.hasOwnProperty(item) ) {
						continue;
					}
					currentStore.stateToId[item] = History.stateToId[item];
				}

				// Update
				History.store = currentStore;
				History.normalizeStore();

				// In Safari, going into Private Browsing mode causes the
				// Session Storage object to still exist but if you try and use
				// or set any property/function of it it throws the exception
				// "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to
				// add something to storage that exceeded the quota." infinitely
				// every second.
				currentStoreString = JSON.stringify(currentStore);
				try {
					// Store
					sessionStorage.setItem('History.store', currentStoreString);
				}
				catch (e) {
					if (e.code === DOMException.QUOTA_EXCEEDED_ERR) {
						if (sessionStorage.length) {
							// Workaround for a bug seen on iPads. Sometimes the quota exceeded error comes up and simply
							// removing/resetting the storage can work.
							sessionStorage.removeItem('History.store');
							sessionStorage.setItem('History.store', currentStoreString);
						} else {
							// Otherwise, we're probably private browsing in Safari, so we'll ignore the exception.
						}
					} else {
						throw e;
					}
				}
			};

			// For Internet Explorer
			History.intervalList.push(setInterval(History.onUnload,History.options.storeInterval));

			// For Other Browsers
			History.Adapter.bind(window,'beforeunload',History.onUnload);
			History.Adapter.bind(window,'unload',History.onUnload);

			// Both are enabled for consistency
		}

		// Non-Native pushState Implementation
		if ( !History.emulated.pushState ) {
			// Be aware, the following is only for native pushState implementations
			// If you are wanting to include something for all browsers
			// Then include it above this if block

			/**
			 * Setup Safari Fix
			 */
			if ( History.bugs.safariPoll ) {
				History.intervalList.push(setInterval(History.safariStatePoll, History.options.safariPollInterval));
			}

			/**
			 * Ensure Cross Browser Compatibility
			 */
			if ( navigator.vendor === 'Apple Computer, Inc.' || (navigator.appCodeName||'') === 'Mozilla' ) {
				/**
				 * Fix Safari HashChange Issue
				 */

				// Setup Alias
				History.Adapter.bind(window,'hashchange',function(){
					History.Adapter.trigger(window,'popstate');
				});

				// Initialise Alias
				if ( History.getHash() ) {
					History.Adapter.onDomLoad(function(){
						History.Adapter.trigger(window,'hashchange');
					});
				}
			}

		} // !History.emulated.pushState


	}; // History.initCore

	// Try to Initialise History
	if (!History.options || !History.options.delayInit) {
		History.init();
	}

})(window);

define("history", function(){});

(function(a){function b(){if(this.isDisposed)throw new Error(P)}function c(a){var b=typeof a;return a&&("function"==b||"object"==b)||!1}function d(a){var b=[];if(!c(a))return b;kb.nonEnumArgs&&a.length&&h(a)&&(a=mb.call(a));var d=kb.enumPrototypes&&"function"==typeof a,e=kb.enumErrorProps&&(a===eb||a instanceof Error);for(var f in a)d&&"prototype"==f||e&&("message"==f||"name"==f)||b.push(f);if(kb.nonEnumShadows&&a!==fb){var g=a.constructor,i=-1,j=ib.length;if(a===(g&&g.prototype))var k=a===stringProto?ab:a===eb?X:bb.call(a),l=jb[k];for(;++i<j;)f=ib[i],l&&l[f]||!cb.call(a,f)||b.push(f)}return b}function e(a,b,c){for(var d=-1,e=c(a),f=e.length;++d<f;){var g=e[d];if(b(a[g],g,a)===!1)break}return a}function f(a,b){return e(a,b,d)}function g(a){return"function"!=typeof a.toString&&"string"==typeof(a+"")}function h(a){return a&&"object"==typeof a?bb.call(a)==T:!1}function i(a,b,c,d){if(a===b)return 0!==a||1/a==1/b;var e=typeof a,j=typeof b;if(a===a&&(null==a||null==b||"function"!=e&&"object"!=e&&"function"!=j&&"object"!=j))return!1;var k=bb.call(a),l=bb.call(b);if(k==T&&(k=$),l==T&&(l=$),k!=l)return!1;switch(k){case V:case W:return+a==+b;case Z:return a!=+a?b!=+b:0==a?1/a==1/b:a==+b;case _:case ab:return a==String(b)}var m=k==U;if(!m){if(k!=$||!kb.nodeClass&&(g(a)||g(b)))return!1;var n=!kb.argsObject&&h(a)?Object:a.constructor,o=!kb.argsObject&&h(b)?Object:b.constructor;if(!(n==o||cb.call(a,"constructor")&&cb.call(b,"constructor")||N(n)&&n instanceof n&&N(o)&&o instanceof o||!("constructor"in a&&"constructor"in b)))return!1}c||(c=[]),d||(d=[]);for(var p=c.length;p--;)if(c[p]==a)return d[p]==b;var q=0;if(result=!0,c.push(a),d.push(b),m){if(p=a.length,q=b.length,result=q==p)for(;q--;){var r=b[q];if(!(result=i(a[q],r,c,d)))break}}else f(b,function(b,e,f){return cb.call(f,e)?(q++,result=cb.call(a,e)&&i(a[e],b,c,d)):void 0}),result&&f(a,function(a,b,c){return cb.call(c,b)?result=--q>-1:void 0});return c.pop(),d.pop(),result}function j(a,b){return 1===a.length&&Array.isArray(a[b])?a[b]:mb.call(a)}function k(a,b){for(var c=new Array(a),d=0;a>d;d++)c[d]=b();return c}function l(a,b){this.id=a,this.value=b}function m(a,b){this.scheduler=a,this.disposable=b,this.isDisposed=!1}function n(a){return"number"==typeof a&&z.isFinite(a)}function o(b){return b[Q]!==a}function p(a){var b=+a;return 0===b?b:isNaN(b)?b:0>b?-1:1}function q(a){var b=+a.length;return isNaN(b)?0:0!==b&&n(b)?(b=p(b)*Math.floor(Math.abs(b)),0>=b?0:b>dc?dc:b):b}function r(a){return"[object Function]"===Object.prototype.toString.call(a)&&"function"==typeof a}function s(a,b){return new nc(function(c){var d=new xb,e=new yb;return e.setDisposable(d),d.setDisposable(a.subscribe(c.onNext.bind(c),function(a){var d,f;try{f=b(a)}catch(g){return void c.onError(g)}M(f)&&(f=ac(f)),d=new xb,e.setDisposable(d),d.setDisposable(f.subscribe(c))},c.onCompleted.bind(c))),e})}function t(a,b){var c=this;return new nc(function(d){var e=0,f=a.length;return c.subscribe(function(c){if(f>e){var g,h=a[e++];try{g=b(c,h)}catch(i){return void d.onError(i)}d.onNext(g)}else d.onCompleted()},d.onError.bind(d),d.onCompleted.bind(d))})}function u(a,b,c){return a.map(function(a,d){var e=b.call(c,a,d);return M(e)?ac(e):e}).concatAll()}function v(a,b,c){for(var d=0,e=a.length;e>d;d++)if(c(a[d],b))return d;return-1}function w(a){this.comparer=a,this.set=[]}function x(a,b,c){return a.map(function(a,d){var e=b.call(c,a,d);return M(e)?ac(e):e}).mergeObservable()}var y={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1},z=y[typeof window]&&window||this,A=y[typeof exports]&&exports&&!exports.nodeType&&exports,B=y[typeof module]&&module&&!module.nodeType&&module,C=B&&B.exports===A&&A,D=y[typeof global]&&global;!D||D.global!==D&&D.window!==D||(z=D);var E={internals:{},config:{Promise:z.Promise},helpers:{}},F=E.helpers.noop=function(){},G=(E.helpers.notDefined=function(a){return"undefined"==typeof a},E.helpers.isScheduler=function(a){return a instanceof E.Scheduler}),H=E.helpers.identity=function(a){return a},I=(E.helpers.pluck=function(a){return function(b){return b[a]}},E.helpers.just=function(a){return function(){return a}},E.helpers.defaultNow=Date.now),J=E.helpers.defaultComparer=function(a,b){return lb(a,b)},K=E.helpers.defaultSubComparer=function(a,b){return a>b?1:b>a?-1:0},L=(E.helpers.defaultKeySerializer=function(a){return a.toString()},E.helpers.defaultError=function(a){throw a}),M=E.helpers.isPromise=function(a){return!!a&&"function"==typeof a.then},N=(E.helpers.asArray=function(){return Array.prototype.slice.call(arguments)},E.helpers.not=function(a){return!a},E.helpers.isFunction=function(){var a=function(a){return"function"==typeof a||!1};return a(/x/)&&(a=function(a){return"function"==typeof a&&"[object Function]"==bb.call(a)}),a}()),O="Argument out of range",P="Object has been disposed",Q="function"==typeof Symbol&&Symbol.iterator||"_es6shim_iterator_";z.Set&&"function"==typeof(new z.Set)["@@iterator"]&&(Q="@@iterator");var R,S={done:!0,value:a},T="[object Arguments]",U="[object Array]",V="[object Boolean]",W="[object Date]",X="[object Error]",Y="[object Function]",Z="[object Number]",$="[object Object]",_="[object RegExp]",ab="[object String]",bb=Object.prototype.toString,cb=Object.prototype.hasOwnProperty,db=bb.call(arguments)==T,eb=Error.prototype,fb=Object.prototype,gb=fb.propertyIsEnumerable;try{R=!(bb.call(document)==$&&!({toString:0}+""))}catch(hb){R=!0}var ib=["constructor","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","toString","valueOf"],jb={};jb[U]=jb[W]=jb[Z]={constructor:!0,toLocaleString:!0,toString:!0,valueOf:!0},jb[V]=jb[ab]={constructor:!0,toString:!0,valueOf:!0},jb[X]=jb[Y]=jb[_]={constructor:!0,toString:!0},jb[$]={constructor:!0};var kb={};!function(){var a=function(){this.x=1},b=[];a.prototype={valueOf:1,y:1};for(var c in new a)b.push(c);for(c in arguments);kb.enumErrorProps=gb.call(eb,"message")||gb.call(eb,"name"),kb.enumPrototypes=gb.call(a,"prototype"),kb.nonEnumArgs=0!=c,kb.nonEnumShadows=!/valueOf/.test(b)}(1),db||(h=function(a){return a&&"object"==typeof a?cb.call(a,"callee"):!1});var lb=E.internals.isEqual=function(a,b){return i(a,b,[],[])},mb=Array.prototype.slice,nb=({}.hasOwnProperty,this.inherits=E.internals.inherits=function(a,b){function c(){this.constructor=a}c.prototype=b.prototype,a.prototype=new c}),ob=E.internals.addProperties=function(a){for(var b=mb.call(arguments,1),c=0,d=b.length;d>c;c++){var e=b[c];for(var f in e)a[f]=e[f]}},pb=E.internals.addRef=function(a,b){return new nc(function(c){return new sb(b.getDisposable(),a.subscribe(c))})};l.prototype.compareTo=function(a){var b=this.value.compareTo(a.value);return 0===b&&(b=this.id-a.id),b};var qb=E.internals.PriorityQueue=function(a){this.items=new Array(a),this.length=0},rb=qb.prototype;rb.isHigherPriority=function(a,b){return this.items[a].compareTo(this.items[b])<0},rb.percolate=function(a){if(!(a>=this.length||0>a)){var b=a-1>>1;if(!(0>b||b===a)&&this.isHigherPriority(a,b)){var c=this.items[a];this.items[a]=this.items[b],this.items[b]=c,this.percolate(b)}}},rb.heapify=function(a){if(+a||(a=0),!(a>=this.length||0>a)){var b=2*a+1,c=2*a+2,d=a;if(b<this.length&&this.isHigherPriority(b,d)&&(d=b),c<this.length&&this.isHigherPriority(c,d)&&(d=c),d!==a){var e=this.items[a];this.items[a]=this.items[d],this.items[d]=e,this.heapify(d)}}},rb.peek=function(){return this.items[0].value},rb.removeAt=function(a){this.items[a]=this.items[--this.length],delete this.items[this.length],this.heapify()},rb.dequeue=function(){var a=this.peek();return this.removeAt(0),a},rb.enqueue=function(a){var b=this.length++;this.items[b]=new l(qb.count++,a),this.percolate(b)},rb.remove=function(a){for(var b=0;b<this.length;b++)if(this.items[b].value===a)return this.removeAt(b),!0;return!1},qb.count=0;var sb=E.CompositeDisposable=function(){this.disposables=j(arguments,0),this.isDisposed=!1,this.length=this.disposables.length},tb=sb.prototype;tb.add=function(a){this.isDisposed?a.dispose():(this.disposables.push(a),this.length++)},tb.remove=function(a){var b=!1;if(!this.isDisposed){var c=this.disposables.indexOf(a);-1!==c&&(b=!0,this.disposables.splice(c,1),this.length--,a.dispose())}return b},tb.dispose=function(){if(!this.isDisposed){this.isDisposed=!0;var a=this.disposables.slice(0);this.disposables=[],this.length=0;for(var b=0,c=a.length;c>b;b++)a[b].dispose()}},tb.toArray=function(){return this.disposables.slice(0)};var ub=E.Disposable=function(a){this.isDisposed=!1,this.action=a||F};ub.prototype.dispose=function(){this.isDisposed||(this.action(),this.isDisposed=!0)};var vb=ub.create=function(a){return new ub(a)},wb=ub.empty={dispose:F},xb=E.SingleAssignmentDisposable=function(){function a(){this.isDisposed=!1,this.current=null}var b=a.prototype;return b.getDisposable=function(){return this.current},b.setDisposable=function(a){var b,c=this.isDisposed;c||(b=this.current,this.current=a),b&&b.dispose(),c&&a&&a.dispose()},b.dispose=function(){var a;this.isDisposed||(this.isDisposed=!0,a=this.current,this.current=null),a&&a.dispose()},a}(),yb=E.SerialDisposable=xb,zb=E.RefCountDisposable=function(){function a(a){this.disposable=a,this.disposable.count++,this.isInnerDisposed=!1}function b(a){this.underlyingDisposable=a,this.isDisposed=!1,this.isPrimaryDisposed=!1,this.count=0}return a.prototype.dispose=function(){this.disposable.isDisposed||this.isInnerDisposed||(this.isInnerDisposed=!0,this.disposable.count--,0===this.disposable.count&&this.disposable.isPrimaryDisposed&&(this.disposable.isDisposed=!0,this.disposable.underlyingDisposable.dispose()))},b.prototype.dispose=function(){this.isDisposed||this.isPrimaryDisposed||(this.isPrimaryDisposed=!0,0===this.count&&(this.isDisposed=!0,this.underlyingDisposable.dispose()))},b.prototype.getDisposable=function(){return this.isDisposed?wb:new a(this)},b}();m.prototype.dispose=function(){var a=this;this.scheduler.schedule(function(){a.isDisposed||(a.isDisposed=!0,a.disposable.dispose())})};var Ab=E.internals.ScheduledItem=function(a,b,c,d,e){this.scheduler=a,this.state=b,this.action=c,this.dueTime=d,this.comparer=e||K,this.disposable=new xb};Ab.prototype.invoke=function(){this.disposable.setDisposable(this.invokeCore())},Ab.prototype.compareTo=function(a){return this.comparer(this.dueTime,a.dueTime)},Ab.prototype.isCancelled=function(){return this.disposable.isDisposed},Ab.prototype.invokeCore=function(){return this.action(this.scheduler,this.state)};var Bb=E.Scheduler=function(){function a(a,b,c,d){this.now=a,this._schedule=b,this._scheduleRelative=c,this._scheduleAbsolute=d}function b(a,b){return b(),wb}var c=a.prototype;return c.schedule=function(a){return this._schedule(a,b)},c.scheduleWithState=function(a,b){return this._schedule(a,b)},c.scheduleWithRelative=function(a,c){return this._scheduleRelative(c,a,b)},c.scheduleWithRelativeAndState=function(a,b,c){return this._scheduleRelative(a,b,c)},c.scheduleWithAbsolute=function(a,c){return this._scheduleAbsolute(c,a,b)},c.scheduleWithAbsoluteAndState=function(a,b,c){return this._scheduleAbsolute(a,b,c)},a.now=I,a.normalize=function(a){return 0>a&&(a=0),a},a}(),Cb=Bb.normalize;!function(a){function b(a,b){var c=b.first,d=b.second,e=new sb,f=function(b){d(b,function(b){var c=!1,d=!1,g=a.scheduleWithState(b,function(a,b){return c?e.remove(g):d=!0,f(b),wb});d||(e.add(g),c=!0)})};return f(c),e}function c(a,b,c){var d=b.first,e=b.second,f=new sb,g=function(b){e(b,function(b,d){var e=!1,h=!1,i=a[c].call(a,b,d,function(a,b){return e?f.remove(i):h=!0,g(b),wb});h||(f.add(i),e=!0)})};return g(d),f}function d(a,b){a(function(c){b(a,c)})}a.scheduleRecursive=function(a){return this.scheduleRecursiveWithState(a,function(a,b){a(function(){b(a)})})},a.scheduleRecursiveWithState=function(a,c){return this.scheduleWithState({first:a,second:c},b)},a.scheduleRecursiveWithRelative=function(a,b){return this.scheduleRecursiveWithRelativeAndState(b,a,d)},a.scheduleRecursiveWithRelativeAndState=function(a,b,d){return this._scheduleRelative({first:a,second:d},b,function(a,b){return c(a,b,"scheduleWithRelativeAndState")})},a.scheduleRecursiveWithAbsolute=function(a,b){return this.scheduleRecursiveWithAbsoluteAndState(b,a,d)},a.scheduleRecursiveWithAbsoluteAndState=function(a,b,d){return this._scheduleAbsolute({first:a,second:d},b,function(a,b){return c(a,b,"scheduleWithAbsoluteAndState")})}}(Bb.prototype),function(){Bb.prototype.schedulePeriodic=function(a,b){return this.schedulePeriodicWithState(null,a,b)},Bb.prototype.schedulePeriodicWithState=function(a,b,c){if("undefined"==typeof z.setInterval)throw new Error("Periodic scheduling not supported.");var d=a,e=z.setInterval(function(){d=c(d)},b);return vb(function(){z.clearInterval(e)})}}(Bb.prototype),function(a){a.catchError=a["catch"]=function(a){return new Kb(this,a)}}(Bb.prototype);var Db,Eb=(E.internals.SchedulePeriodicRecursive=function(){function a(a,b){b(0,this._period);try{this._state=this._action(this._state)}catch(c){throw this._cancel.dispose(),c}}function b(a,b,c,d){this._scheduler=a,this._state=b,this._period=c,this._action=d}return b.prototype.start=function(){var b=new xb;return this._cancel=b,b.setDisposable(this._scheduler.scheduleRecursiveWithRelativeAndState(0,this._period,a.bind(this))),b},b}(),Bb.immediate=function(){function a(a,b){return b(this,a)}function b(a,b,c){for(var d=Cb(d);d-this.now()>0;);return c(this,a)}function c(a,b,c){return this.scheduleWithRelativeAndState(a,b-this.now(),c)}return new Bb(I,a,b,c)}()),Fb=Bb.currentThread=function(){function a(a){for(var b;a.length>0;)if(b=a.dequeue(),!b.isCancelled()){for(;b.dueTime-Bb.now()>0;);b.isCancelled()||b.invoke()}}function b(a,b){return this.scheduleWithRelativeAndState(a,0,b)}function c(b,c,d){var f=this.now()+Bb.normalize(c),g=new Ab(this,b,d,f);if(e)e.enqueue(g);else{e=new qb(4),e.enqueue(g);try{a(e)}catch(h){throw h}finally{e=null}}return g.disposable}function d(a,b,c){return this.scheduleWithRelativeAndState(a,b-this.now(),c)}var e,f=new Bb(I,b,c,d);return f.scheduleRequired=function(){return!e},f.ensureTrampoline=function(a){e?a():this.schedule(a)},f}(),Gb=F,Hb=function(){var a,b=F;if("WScript"in this)a=function(a,b){WScript.Sleep(b),a()};else{if(!z.setTimeout)throw new Error("No concurrency detected!");a=z.setTimeout,b=z.clearTimeout}return{setTimeout:a,clearTimeout:b}}(),Ib=Hb.setTimeout,Jb=Hb.clearTimeout;!function(){function a(){if(!z.postMessage||z.importScripts)return!1;var a=!1,b=z.onmessage;return z.onmessage=function(){a=!0},z.postMessage("","*"),z.onmessage=b,a}function b(a){if("string"==typeof a.data&&a.data.substring(0,f.length)===f){var b=a.data.substring(f.length),c=g[b];c(),delete g[b]}}var c=RegExp("^"+String(bb).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$"),d="function"==typeof(d=D&&C&&D.setImmediate)&&!c.test(d)&&d,e="function"==typeof(e=D&&C&&D.clearImmediate)&&!c.test(e)&&e;if("undefined"!=typeof process&&"[object process]"==={}.toString.call(process))Db=process.nextTick;else if("function"==typeof d)Db=d,Gb=e;else if(a()){var f="ms.rx.schedule"+Math.random(),g={},h=0;z.addEventListener?z.addEventListener("message",b,!1):z.attachEvent("onmessage",b,!1),Db=function(a){var b=h++;g[b]=a,z.postMessage(f+b,"*")}}else if(z.MessageChannel){var i=new z.MessageChannel,j={},k=0;i.port1.onmessage=function(a){var b=a.data,c=j[b];c(),delete j[b]},Db=function(a){var b=k++;j[b]=a,i.port2.postMessage(b)}}else"document"in z&&"onreadystatechange"in z.document.createElement("script")?Db=function(a){var b=z.document.createElement("script");b.onreadystatechange=function(){a(),b.onreadystatechange=null,b.parentNode.removeChild(b),b=null},z.document.documentElement.appendChild(b)}:(Db=function(a){return Ib(a,0)},Gb=Jb)}();var Kb=(Bb.timeout=function(){function a(a,b){var c=this,d=new xb,e=Db(function(){d.isDisposed||d.setDisposable(b(c,a))});return new sb(d,vb(function(){Gb(e)}))}function b(a,b,c){var d=this,e=Bb.normalize(b);if(0===e)return d.scheduleWithState(a,c);var f=new xb,g=Ib(function(){f.isDisposed||f.setDisposable(c(d,a))},e);return new sb(f,vb(function(){Jb(g)}))}function c(a,b,c){return this.scheduleWithRelativeAndState(a,b-this.now(),c)}return new Bb(I,a,b,c)}(),function(a){function b(){return this._scheduler.now()}function c(a,b){return this._scheduler.scheduleWithState(a,this._wrap(b))}function d(a,b,c){return this._scheduler.scheduleWithRelativeAndState(a,b,this._wrap(c))}function e(a,b,c){return this._scheduler.scheduleWithAbsoluteAndState(a,b,this._wrap(c))}function f(f,g){this._scheduler=f,this._handler=g,this._recursiveOriginal=null,this._recursiveWrapper=null,a.call(this,b,c,d,e)}return nb(f,a),f.prototype._clone=function(a){return new f(a,this._handler)},f.prototype._wrap=function(a){var b=this;return function(c,d){try{return a(b._getRecursiveWrapper(c),d)}catch(e){if(!b._handler(e))throw e;return wb}}},f.prototype._getRecursiveWrapper=function(a){if(this._recursiveOriginal!==a){this._recursiveOriginal=a;var b=this._clone(a);b._recursiveOriginal=a,b._recursiveWrapper=b,this._recursiveWrapper=b}return this._recursiveWrapper},f.prototype.schedulePeriodicWithState=function(a,b,c){var d=this,e=!1,f=new xb;return f.setDisposable(this._scheduler.schedulePeriodicWithState(a,b,function(a){if(e)return null;try{return c(a)}catch(b){if(e=!0,!d._handler(b))throw b;return f.dispose(),null}})),f},f}(Bb)),Lb=E.Notification=function(){function a(a,b){this.hasValue=null==b?!1:b,this.kind=a}return a.prototype.accept=function(a,b,c){return a&&"object"==typeof a?this._acceptObservable(a):this._accept(a,b,c)},a.prototype.toObservable=function(a){var b=this;return G(a)||(a=Eb),new nc(function(c){return a.schedule(function(){b._acceptObservable(c),"N"===b.kind&&c.onCompleted()})})},a}(),Mb=Lb.createOnNext=function(){function a(a){return a(this.value)}function b(a){return a.onNext(this.value)}function c(){return"OnNext("+this.value+")"}return function(d){var e=new Lb("N",!0);return e.value=d,e._accept=a,e._acceptObservable=b,e.toString=c,e}}(),Nb=Lb.createOnError=function(){function a(a,b){return b(this.exception)}function b(a){return a.onError(this.exception)}function c(){return"OnError("+this.exception+")"}return function(d){var e=new Lb("E");return e.exception=d,e._accept=a,e._acceptObservable=b,e.toString=c,e}}(),Ob=Lb.createOnCompleted=function(){function a(a,b,c){return c()}function b(a){return a.onCompleted()}function c(){return"OnCompleted()"}return function(){var d=new Lb("C");return d._accept=a,d._acceptObservable=b,d.toString=c,d}}(),Pb=E.internals.Enumerator=function(a){this._next=a};Pb.prototype.next=function(){return this._next()},Pb.prototype[Q]=function(){return this};var Qb=E.internals.Enumerable=function(a){this._iterator=a};Qb.prototype[Q]=function(){return this._iterator()},Qb.prototype.concat=function(){var a=this;return new nc(function(b){var c;try{c=a[Q]()}catch(d){return void b.onError()}var e,f=new yb,g=Eb.scheduleRecursive(function(a){var d;if(!e){try{d=c.next()}catch(g){return void b.onError(g)}if(d.done)return void b.onCompleted();var h=d.value;M(h)&&(h=ac(h));var i=new xb;f.setDisposable(i),i.setDisposable(h.subscribe(b.onNext.bind(b),b.onError.bind(b),function(){a()}))}});return new sb(f,g,vb(function(){e=!0}))})},Qb.prototype.catchException=function(){var a=this;return new nc(function(b){var c;try{c=a[Q]()}catch(d){return void b.onError()}var e,f,g=new yb,h=Eb.scheduleRecursive(function(a){if(!e){var d;try{d=c.next()}catch(h){return void b.onError(h)}if(d.done)return void(f?b.onError(f):b.onCompleted());var i=d.value;M(i)&&(i=ac(i));var j=new xb;g.setDisposable(j),j.setDisposable(i.subscribe(b.onNext.bind(b),function(b){f=b,a()},b.onCompleted.bind(b)))}});return new sb(g,h,vb(function(){e=!0}))})};var Rb=Qb.repeat=function(a,b){return null==b&&(b=-1),new Qb(function(){var c=b;return new Pb(function(){return 0===c?S:(c>0&&c--,{done:!1,value:a})})})},Sb=Qb.forEach=function(a,b,c){return b||(b=H),new Qb(function(){var d=-1;return new Pb(function(){return++d<a.length?{done:!1,value:b.call(c,a[d],d,a)}:S})})},Tb=E.Observer=function(){};Tb.prototype.toNotifier=function(){var a=this;return function(b){return b.accept(a)}},Tb.prototype.asObserver=function(){return new Xb(this.onNext.bind(this),this.onError.bind(this),this.onCompleted.bind(this))},Tb.prototype.checked=function(){return new Yb(this)};var Ub=Tb.create=function(a,b,c){return a||(a=F),b||(b=L),c||(c=F),new Xb(a,b,c)};Tb.fromNotifier=function(a){return new Xb(function(b){return a(Mb(b))},function(b){return a(Nb(b))},function(){return a(Ob())})},Tb.notifyOn=function(a){return new $b(a,this)};var Vb,Wb=E.internals.AbstractObserver=function(a){function b(){this.isStopped=!1,a.call(this)}return nb(b,a),b.prototype.onNext=function(a){this.isStopped||this.next(a)},b.prototype.onError=function(a){this.isStopped||(this.isStopped=!0,this.error(a))},b.prototype.onCompleted=function(){this.isStopped||(this.isStopped=!0,this.completed())},b.prototype.dispose=function(){this.isStopped=!0},b.prototype.fail=function(a){return this.isStopped?!1:(this.isStopped=!0,this.error(a),!0)},b}(Tb),Xb=E.AnonymousObserver=function(a){function b(b,c,d){a.call(this),this._onNext=b,this._onError=c,this._onCompleted=d}return nb(b,a),b.prototype.next=function(a){this._onNext(a)},b.prototype.error=function(a){this._onError(a)},b.prototype.completed=function(){this._onCompleted()},b}(Wb),Yb=function(a){function b(b){a.call(this),this._observer=b,this._state=0}nb(b,a);var c=b.prototype;return c.onNext=function(a){this.checkAccess();try{this._observer.onNext(a)}catch(b){throw b}finally{this._state=0}},c.onError=function(a){this.checkAccess();try{this._observer.onError(a)}catch(b){throw b}finally{this._state=2}},c.onCompleted=function(){this.checkAccess();try{this._observer.onCompleted()}catch(a){throw a}finally{this._state=2}},c.checkAccess=function(){if(1===this._state)throw new Error("Re-entrancy detected");if(2===this._state)throw new Error("Observer completed");0===this._state&&(this._state=1)},b}(Tb),Zb=E.internals.ScheduledObserver=function(a){function b(b,c){a.call(this),this.scheduler=b,this.observer=c,this.isAcquired=!1,this.hasFaulted=!1,this.queue=[],this.disposable=new yb}return nb(b,a),b.prototype.next=function(a){var b=this;this.queue.push(function(){b.observer.onNext(a)})},b.prototype.error=function(a){var b=this;this.queue.push(function(){b.observer.onError(a)})},b.prototype.completed=function(){var a=this;this.queue.push(function(){a.observer.onCompleted()})},b.prototype.ensureActive=function(){var a=!1,b=this;!this.hasFaulted&&this.queue.length>0&&(a=!this.isAcquired,this.isAcquired=!0),a&&this.disposable.setDisposable(this.scheduler.scheduleRecursive(function(a){var c;if(!(b.queue.length>0))return void(b.isAcquired=!1);c=b.queue.shift();try{c()}catch(d){throw b.queue=[],b.hasFaulted=!0,d}a()}))},b.prototype.dispose=function(){a.prototype.dispose.call(this),this.disposable.dispose()},b}(Wb),$b=function(a){function b(){a.apply(this,arguments)}return nb(b,a),b.prototype.next=function(b){a.prototype.next.call(this,b),this.ensureActive()},b.prototype.error=function(b){a.prototype.error.call(this,b),this.ensureActive()},b.prototype.completed=function(){a.prototype.completed.call(this),this.ensureActive()},b}(Zb),_b=E.Observable=function(){function a(a){this._subscribe=a}return Vb=a.prototype,Vb.subscribe=Vb.forEach=function(a,b,c){var d="object"==typeof a?a:Ub(a,b,c);return this._subscribe(d)},a}();Vb.observeOn=function(a){var b=this;return new nc(function(c){return b.subscribe(new $b(a,c))})},Vb.subscribeOn=function(a){var b=this;return new nc(function(c){var d=new xb,e=new yb;return e.setDisposable(d),d.setDisposable(a.schedule(function(){e.setDisposable(new m(a,b.subscribe(c)))})),e})};var ac=_b.fromPromise=function(a){return bc(function(){var b=new E.AsyncSubject;return a.then(function(a){b.isDisposed||(b.onNext(a),b.onCompleted())},b.onError.bind(b)),b})};Vb.toPromise=function(a){if(a||(a=E.config.Promise),!a)throw new TypeError("Promise type not provided nor in Rx.config.Promise");var b=this;return new a(function(a,c){var d,e=!1;b.subscribe(function(a){d=a,e=!0},c,function(){e&&a(d)})})},Vb.toArray=function(){var a=this;return new nc(function(b){var c=[];return a.subscribe(c.push.bind(c),b.onError.bind(b),function(){b.onNext(c),b.onCompleted()})})},_b.create=_b.createWithDisposable=function(a){return new nc(a)};var bc=_b.defer=function(a){return new nc(function(b){var c;try{c=a()}catch(d){return hc(d).subscribe(b)}return M(c)&&(c=ac(c)),c.subscribe(b)})},cc=_b.empty=function(a){return G(a)||(a=Eb),new nc(function(b){return a.schedule(function(){b.onCompleted()})})},dc=Math.pow(2,53)-1;_b.from=function(a,b,c,d){if(null==a)throw new Error("iterable cannot be null.");if(b&&!r(b))throw new Error("mapFn when provided must be a function");return G(d)||(d=Fb),new nc(function(e){var f=Object(a),g=o(f),h=g?0:q(f),i=g?f[Q]():null,j=0;return d.scheduleRecursive(function(a){if(h>j||g){var d;if(g){var k=i.next();if(k.done)return void e.onCompleted();d=k.value}else d=f[j];if(b&&r(b))try{d=c?b.call(c,d,j):b(d,j)}catch(l){return void e.onError(l)}e.onNext(d),j++,a()}else e.onCompleted()})})};var ec=_b.fromArray=function(a,b){return G(b)||(b=Fb),new nc(function(c){var d=0,e=a.length;return b.scheduleRecursive(function(b){e>d?(c.onNext(a[d++]),b()):c.onCompleted()})})};_b.generate=function(a,b,c,d,e){return G(e)||(e=Fb),new nc(function(f){var g=!0,h=a;return e.scheduleRecursive(function(a){var e,i;try{g?g=!1:h=c(h),e=b(h),e&&(i=d(h))}catch(j){return void f.onError(j)}e?(f.onNext(i),a()):f.onCompleted()})})};var fc=_b.never=function(){return new nc(function(){return wb})};_b.of=function(){for(var a=arguments.length,b=new Array(a),c=0;a>c;c++)b[c]=arguments[c];return ec(b)};_b.ofWithScheduler=function(a){for(var b=arguments.length-1,c=new Array(b),d=0;b>d;d++)c[d]=arguments[d+1];return ec(c,a)};_b.range=function(a,b,c){return G(c)||(c=Fb),new nc(function(d){return c.scheduleRecursiveWithState(0,function(c,e){b>c?(d.onNext(a+c),e(c+1)):d.onCompleted()})})},_b.repeat=function(a,b,c){return G(c)||(c=Fb),gc(a,c).repeat(null==b?-1:b)};var gc=_b["return"]=_b.returnValue=_b.just=function(a,b){return G(b)||(b=Eb),new nc(function(c){return b.schedule(function(){c.onNext(a),c.onCompleted()})})},hc=_b["throw"]=_b.throwException=_b.throwError=function(a,b){return G(b)||(b=Eb),new nc(function(c){return b.schedule(function(){c.onError(a)})})};_b.using=function(a,b){return new nc(function(c){var d,e,f=wb;try{d=a(),d&&(f=d),e=b(d)}catch(g){return new sb(hc(g).subscribe(c),f)}return new sb(e.subscribe(c),f)})},Vb.amb=function(a){var b=this;return new nc(function(c){function d(){f||(f=g,j.dispose())}function e(){f||(f=h,i.dispose())}var f,g="L",h="R",i=new xb,j=new xb;return M(a)&&(a=ac(a)),i.setDisposable(b.subscribe(function(a){d(),f===g&&c.onNext(a)},function(a){d(),f===g&&c.onError(a)},function(){d(),f===g&&c.onCompleted()})),j.setDisposable(a.subscribe(function(a){e(),f===h&&c.onNext(a)},function(a){e(),f===h&&c.onError(a)},function(){e(),f===h&&c.onCompleted()})),new sb(i,j)})},_b.amb=function(){function a(a,b){return a.amb(b)}for(var b=fc(),c=j(arguments,0),d=0,e=c.length;e>d;d++)b=a(b,c[d]);return b},Vb["catch"]=Vb.catchException=function(a){return"function"==typeof a?s(this,a):ic([this,a])};var ic=_b.catchException=_b["catch"]=function(){var a=j(arguments,0);return Sb(a).catchException()};Vb.combineLatest=function(){var a=mb.call(arguments);return Array.isArray(a[0])?a[0].unshift(this):a.unshift(this),jc.apply(this,a)};var jc=_b.combineLatest=function(){var a=mb.call(arguments),b=a.pop();return Array.isArray(a[0])&&(a=a[0]),new nc(function(c){function d(a){var d;if(h[a]=!0,i||(i=h.every(H))){try{d=b.apply(null,l)}catch(e){return void c.onError(e)}c.onNext(d)}else j.filter(function(b,c){return c!==a}).every(H)&&c.onCompleted()}function e(a){j[a]=!0,j.every(H)&&c.onCompleted()}for(var f=function(){return!1},g=a.length,h=k(g,f),i=!1,j=k(g,f),l=new Array(g),m=new Array(g),n=0;g>n;n++)!function(b){var f=a[b],g=new xb;M(f)&&(f=ac(f)),g.setDisposable(f.subscribe(function(a){l[b]=a,d(b)},c.onError.bind(c),function(){e(b)})),m[b]=g}(n);return new sb(m)})};Vb.concat=function(){var a=mb.call(arguments,0);return a.unshift(this),kc.apply(this,a)};var kc=_b.concat=function(){var a=j(arguments,0);return Sb(a).concat()};Vb.concatObservable=Vb.concatAll=function(){return this.merge(1)},Vb.merge=function(a){if("number"!=typeof a)return lc(this,a);var b=this;return new nc(function(c){function d(a){var b=new xb;f.add(b),M(a)&&(a=ac(a)),b.setDisposable(a.subscribe(c.onNext.bind(c),c.onError.bind(c),function(){f.remove(b),h.length>0?d(h.shift()):(e--,g&&0===e&&c.onCompleted())}))}var e=0,f=new sb,g=!1,h=[];return f.add(b.subscribe(function(b){a>e?(e++,d(b)):h.push(b)},c.onError.bind(c),function(){g=!0,0===e&&c.onCompleted()})),f})};var lc=_b.merge=function(){var a,b;return arguments[0]?arguments[0].now?(a=arguments[0],b=mb.call(arguments,1)):(a=Eb,b=mb.call(arguments,0)):(a=Eb,b=mb.call(arguments,1)),Array.isArray(b[0])&&(b=b[0]),ec(b,a).mergeObservable()};Vb.mergeObservable=Vb.mergeAll=function(){var a=this;return new nc(function(b){var c=new sb,d=!1,e=new xb;return c.add(e),e.setDisposable(a.subscribe(function(a){var e=new xb;c.add(e),M(a)&&(a=ac(a)),e.setDisposable(a.subscribe(b.onNext.bind(b),b.onError.bind(b),function(){c.remove(e),d&&1===c.length&&b.onCompleted()}))},b.onError.bind(b),function(){d=!0,1===c.length&&b.onCompleted()})),c})},Vb.onErrorResumeNext=function(a){if(!a)throw new Error("Second observable is required");return mc([this,a])};var mc=_b.onErrorResumeNext=function(){var a=j(arguments,0);return new nc(function(b){var c=0,d=new yb,e=Eb.scheduleRecursive(function(e){var f,g;c<a.length?(f=a[c++],M(f)&&(f=ac(f)),g=new xb,d.setDisposable(g),g.setDisposable(f.subscribe(b.onNext.bind(b),e,e))):b.onCompleted()});return new sb(d,e)})};Vb.skipUntil=function(a){var b=this;return new nc(function(c){var d=!1,e=new sb(b.subscribe(function(a){d&&c.onNext(a)},c.onError.bind(c),function(){d&&c.onCompleted()}));M(a)&&(a=ac(a));var f=new xb;return e.add(f),f.setDisposable(a.subscribe(function(){d=!0,f.dispose()},c.onError.bind(c),function(){f.dispose()})),e})},Vb["switch"]=Vb.switchLatest=function(){var a=this;return new nc(function(b){var c=!1,d=new yb,e=!1,f=0,g=a.subscribe(function(a){var g=new xb,h=++f;c=!0,d.setDisposable(g),M(a)&&(a=ac(a)),g.setDisposable(a.subscribe(function(a){f===h&&b.onNext(a)},function(a){f===h&&b.onError(a)},function(){f===h&&(c=!1,e&&b.onCompleted())}))},b.onError.bind(b),function(){e=!0,!c&&b.onCompleted()});return new sb(g,d)})},Vb.takeUntil=function(a){var b=this;return new nc(function(c){return M(a)&&(a=ac(a)),new sb(b.subscribe(c),a.subscribe(c.onCompleted.bind(c),c.onError.bind(c),F))})},Vb.zip=function(){if(Array.isArray(arguments[0]))return t.apply(this,arguments);var a=this,b=mb.call(arguments),c=b.pop();return b.unshift(a),new nc(function(d){function e(b){var e,f;if(h.every(function(a){return a.length>0})){try{f=h.map(function(a){return a.shift()}),e=c.apply(a,f)}catch(g){return void d.onError(g)}d.onNext(e)}else i.filter(function(a,c){return c!==b}).every(H)&&d.onCompleted()}function f(a){i[a]=!0,i.every(function(a){return a})&&d.onCompleted()}for(var g=b.length,h=k(g,function(){return[]}),i=k(g,function(){return!1}),j=new Array(g),l=0;g>l;l++)!function(a){var c=b[a],g=new xb;M(c)&&(c=ac(c)),g.setDisposable(c.subscribe(function(b){h[a].push(b),e(a)},d.onError.bind(d),function(){f(a)})),j[a]=g}(l);return new sb(j)})},_b.zip=function(){var a=mb.call(arguments,0),b=a.shift();return b.zip.apply(b,a)},_b.zipArray=function(){var a=j(arguments,0);return new nc(function(b){function c(a){if(f.every(function(a){return a.length>0})){var c=f.map(function(a){return a.shift()});b.onNext(c)}else if(g.filter(function(b,c){return c!==a}).every(H))return void b.onCompleted()}function d(a){return g[a]=!0,g.every(H)?void b.onCompleted():void 0}for(var e=a.length,f=k(e,function(){return[]}),g=k(e,function(){return!1}),h=new Array(e),i=0;e>i;i++)!function(e){h[e]=new xb,h[e].setDisposable(a[e].subscribe(function(a){f[e].push(a),c(e)
},b.onError.bind(b),function(){d(e)}))}(i);var j=new sb(h);return j.add(vb(function(){for(var a=0,b=f.length;b>a;a++)f[a]=[]})),j})},Vb.asObservable=function(){return new nc(this.subscribe.bind(this))},Vb.bufferWithCount=function(a,b){return"number"!=typeof b&&(b=a),this.windowWithCount(a,b).selectMany(function(a){return a.toArray()}).where(function(a){return a.length>0})},Vb.dematerialize=function(){var a=this;return new nc(function(b){return a.subscribe(function(a){return a.accept(b)},b.onError.bind(b),b.onCompleted.bind(b))})},Vb.distinctUntilChanged=function(a,b){var c=this;return a||(a=H),b||(b=J),new nc(function(d){var e,f=!1;return c.subscribe(function(c){var g,h=!1;try{g=a(c)}catch(i){return void d.onError(i)}if(f)try{h=b(e,g)}catch(i){return void d.onError(i)}f&&h||(f=!0,e=g,d.onNext(c))},d.onError.bind(d),d.onCompleted.bind(d))})},Vb["do"]=Vb.doAction=Vb.tap=function(a,b,c){var d,e=this;return"function"==typeof a?d=a:(d=a.onNext.bind(a),b=a.onError.bind(a),c=a.onCompleted.bind(a)),new nc(function(a){return e.subscribe(function(b){try{d(b)}catch(c){a.onError(c)}a.onNext(b)},function(c){if(b){try{b(c)}catch(d){a.onError(d)}a.onError(c)}else a.onError(c)},function(){if(c){try{c()}catch(b){a.onError(b)}a.onCompleted()}else a.onCompleted()})})},Vb["finally"]=Vb.finallyAction=function(a){var b=this;return new nc(function(c){var d;try{d=b.subscribe(c)}catch(e){throw a(),e}return vb(function(){try{d.dispose()}catch(b){throw b}finally{a()}})})},Vb.ignoreElements=function(){var a=this;return new nc(function(b){return a.subscribe(F,b.onError.bind(b),b.onCompleted.bind(b))})},Vb.materialize=function(){var a=this;return new nc(function(b){return a.subscribe(function(a){b.onNext(Mb(a))},function(a){b.onNext(Nb(a)),b.onCompleted()},function(){b.onNext(Ob()),b.onCompleted()})})},Vb.repeat=function(a){return Rb(this,a).concat()},Vb.retry=function(a){return Rb(this,a).catchException()},Vb.scan=function(){var a,b,c=!1,d=this;return 2===arguments.length?(c=!0,a=arguments[0],b=arguments[1]):b=arguments[0],new nc(function(e){var f,g,h;return d.subscribe(function(d){!h&&(h=!0);try{f?g=b(g,d):(g=c?b(a,d):d,f=!0)}catch(i){return void e.onError(i)}e.onNext(g)},e.onError.bind(e),function(){!h&&c&&e.onNext(a),e.onCompleted()})})},Vb.skipLast=function(a){var b=this;return new nc(function(c){var d=[];return b.subscribe(function(b){d.push(b),d.length>a&&c.onNext(d.shift())},c.onError.bind(c),c.onCompleted.bind(c))})},Vb.startWith=function(){var a,b,c=0;return arguments.length&&G(arguments[0])?(b=arguments[0],c=1):b=Eb,a=mb.call(arguments,c),Sb([ec(a,b),this]).concat()},Vb.takeLast=function(a){var b=this;return new nc(function(c){var d=[];return b.subscribe(function(b){d.push(b),d.length>a&&d.shift()},c.onError.bind(c),function(){for(;d.length>0;)c.onNext(d.shift());c.onCompleted()})})},Vb.takeLastBuffer=function(a){var b=this;return new nc(function(c){var d=[];return b.subscribe(function(b){d.push(b),d.length>a&&d.shift()},c.onError.bind(c),function(){c.onNext(d),c.onCompleted()})})},Vb.windowWithCount=function(a,b){var c=this;if(0>=a)throw new Error(O);if(1===arguments.length&&(b=a),0>=b)throw new Error(O);return new nc(function(d){var e=new xb,f=new zb(e),g=0,h=[],i=function(){var a=new qc;h.push(a),d.onNext(pb(a,f))};return i(),e.setDisposable(c.subscribe(function(c){for(var d,e=0,f=h.length;f>e;e++)h[e].onNext(c);var j=g-a+1;j>=0&&j%b===0&&(d=h.shift(),d.onCompleted()),g++,g%b===0&&i()},function(a){for(;h.length>0;)h.shift().onError(a);d.onError(a)},function(){for(;h.length>0;)h.shift().onCompleted();d.onCompleted()})),f})},Vb.selectConcat=Vb.concatMap=function(a,b,c){return b?this.concatMap(function(c,d){var e=a(c,d),f=M(e)?ac(e):e;return f.map(function(a){return b(c,a,d)})}):"function"==typeof a?u(this,a,c):u(this,function(){return a})},Vb.concatMapObserver=Vb.selectConcatObserver=function(a,b,c,d){var e=this;return new nc(function(f){var g=0;return e.subscribe(function(b){var c;try{c=a.call(d,b,g++)}catch(e){return void f.onError(e)}M(c)&&(c=ac(c)),f.onNext(c)},function(a){var c;try{c=b.call(d,a)}catch(e){return void f.onError(e)}M(c)&&(c=ac(c)),f.onNext(c),f.onCompleted()},function(){var a;try{a=c.call(d)}catch(b){return void f.onError(b)}M(a)&&(a=ac(a)),f.onNext(a),f.onCompleted()})}).concatAll()},Vb.defaultIfEmpty=function(b){var c=this;return b===a&&(b=null),new nc(function(a){var d=!1;return c.subscribe(function(b){d=!0,a.onNext(b)},a.onError.bind(a),function(){d||a.onNext(b),a.onCompleted()})})},w.prototype.push=function(a){var b=-1===v(this.set,a,this.comparer);return b&&this.set.push(a),b},Vb.distinct=function(a,b){var c=this;return b||(b=J),new nc(function(d){var e=new w(b);return c.subscribe(function(b){var c=b;if(a)try{c=a(b)}catch(f){return void d.onError(f)}e.push(c)&&d.onNext(b)},d.onError.bind(d),d.onCompleted.bind(d))})},Vb.select=Vb.map=function(a,b){var c=this;return new nc(function(d){var e=0;return c.subscribe(function(f){var g;try{g=a.call(b,f,e++,c)}catch(h){return void d.onError(h)}d.onNext(g)},d.onError.bind(d),d.onCompleted.bind(d))})},Vb.pluck=function(a){return this.map(function(b){return b[a]})},Vb.flatMapObserver=Vb.selectManyObserver=function(a,b,c,d){var e=this;return new nc(function(f){var g=0;return e.subscribe(function(b){var c;try{c=a.call(d,b,g++)}catch(e){return void f.onError(e)}M(c)&&(c=ac(c)),f.onNext(c)},function(a){var c;try{c=b.call(d,a)}catch(e){return void f.onError(e)}M(c)&&(c=ac(c)),f.onNext(c),f.onCompleted()},function(){var a;try{a=c.call(d)}catch(b){return void f.onError(b)}M(a)&&(a=ac(a)),f.onNext(a),f.onCompleted()})}).mergeAll()},Vb.selectMany=Vb.flatMap=function(a,b,c){return b?this.flatMap(function(c,d){var e=a(c,d),f=M(e)?ac(e):e;return f.map(function(a){return b(c,a,d)})},c):"function"==typeof a?x(this,a,c):x(this,function(){return a})},Vb.selectSwitch=Vb.flatMapLatest=Vb.switchMap=function(a,b){return this.select(a,b).switchLatest()},Vb.skip=function(a){if(0>a)throw new Error(O);var b=this;return new nc(function(c){var d=a;return b.subscribe(function(a){0>=d?c.onNext(a):d--},c.onError.bind(c),c.onCompleted.bind(c))})},Vb.skipWhile=function(a,b){var c=this;return new nc(function(d){var e=0,f=!1;return c.subscribe(function(g){if(!f)try{f=!a.call(b,g,e++,c)}catch(h){return void d.onError(h)}f&&d.onNext(g)},d.onError.bind(d),d.onCompleted.bind(d))})},Vb.take=function(a,b){if(0>a)throw new RangeError(O);if(0===a)return cc(b);var c=this;return new nc(function(b){var d=a;return c.subscribe(function(a){d-->0&&(b.onNext(a),0===d&&b.onCompleted())},b.onError.bind(b),b.onCompleted.bind(b))})},Vb.takeWhile=function(a,b){var c=this;return new nc(function(d){var e=0,f=!0;return c.subscribe(function(g){if(f){try{f=a.call(b,g,e++,c)}catch(h){return void d.onError(h)}f?d.onNext(g):d.onCompleted()}},d.onError.bind(d),d.onCompleted.bind(d))})},Vb.where=Vb.filter=function(a,b){var c=this;return new nc(function(d){var e=0;return c.subscribe(function(f){var g;try{g=a.call(b,f,e++,c)}catch(h){return void d.onError(h)}g&&d.onNext(f)},d.onError.bind(d),d.onCompleted.bind(d))})},Vb.exclusive=function(){var a=this;return new nc(function(b){var c=!1,d=!1,e=new xb,f=new sb;return f.add(e),e.setDisposable(a.subscribe(function(a){if(!c){c=!0,M(a)&&(a=ac(a));var e=new xb;f.add(e),e.setDisposable(a.subscribe(b.onNext.bind(b),b.onError.bind(b),function(){f.remove(e),c=!1,d&&1===f.length&&b.onCompleted()}))}},b.onError.bind(b),function(){d=!0,c||1!==f.length||b.onCompleted()})),f})},Vb.exclusiveMap=function(a,b){var c=this;return new nc(function(d){var e=0,f=!1,g=!0,h=new xb,i=new sb;return i.add(h),h.setDisposable(c.subscribe(function(c){f||(f=!0,innerSubscription=new xb,i.add(innerSubscription),M(c)&&(c=ac(c)),innerSubscription.setDisposable(c.subscribe(function(f){var g;try{g=a.call(b,f,e++,c)}catch(h){return void d.onError(h)}d.onNext(g)},d.onError.bind(d),function(){i.remove(innerSubscription),f=!1,g&&1===i.length&&d.onCompleted()})))},d.onError.bind(d),function(){g=!0,1!==i.length||f||d.onCompleted()})),i})};var nc=E.AnonymousObservable=function(a){function b(a){return a&&"function"==typeof a.dispose?a:"function"==typeof a?vb(a):wb}function c(d){function e(a){var c=function(){try{e.setDisposable(b(d(e)))}catch(a){if(!e.fail(a))throw a}},e=new oc(a);return Fb.scheduleRequired()?Fb.schedule(c):c(),e}return this instanceof c?void a.call(this,e):new c(d)}return nb(c,a),c}(_b),oc=function(a){function b(b){a.call(this),this.observer=b,this.m=new xb}nb(b,a);var c=b.prototype;return c.next=function(a){var b=!1;try{this.observer.onNext(a),b=!0}catch(c){throw c}finally{b||this.dispose()}},c.error=function(a){try{this.observer.onError(a)}catch(b){throw b}finally{this.dispose()}},c.completed=function(){try{this.observer.onCompleted()}catch(a){throw a}finally{this.dispose()}},c.setDisposable=function(a){this.m.setDisposable(a)},c.getDisposable=function(){return this.m.getDisposable()},c.disposable=function(a){return arguments.length?this.getDisposable():setDisposable(a)},c.dispose=function(){a.prototype.dispose.call(this),this.m.dispose()},b}(Wb),pc=function(a,b){this.subject=a,this.observer=b};pc.prototype.dispose=function(){if(!this.subject.isDisposed&&null!==this.observer){var a=this.subject.observers.indexOf(this.observer);this.subject.observers.splice(a,1),this.observer=null}};var qc=E.Subject=function(a){function c(a){return b.call(this),this.isStopped?this.exception?(a.onError(this.exception),wb):(a.onCompleted(),wb):(this.observers.push(a),new pc(this,a))}function d(){a.call(this,c),this.isDisposed=!1,this.isStopped=!1,this.observers=[]}return nb(d,a),ob(d.prototype,Tb,{hasObservers:function(){return this.observers.length>0},onCompleted:function(){if(b.call(this),!this.isStopped){var a=this.observers.slice(0);this.isStopped=!0;for(var c=0,d=a.length;d>c;c++)a[c].onCompleted();this.observers=[]}},onError:function(a){if(b.call(this),!this.isStopped){var c=this.observers.slice(0);this.isStopped=!0,this.exception=a;for(var d=0,e=c.length;e>d;d++)c[d].onError(a);this.observers=[]}},onNext:function(a){if(b.call(this),!this.isStopped)for(var c=this.observers.slice(0),d=0,e=c.length;e>d;d++)c[d].onNext(a)},dispose:function(){this.isDisposed=!0,this.observers=null}}),d.create=function(a,b){return new rc(a,b)},d}(_b),rc=(E.AsyncSubject=function(a){function c(a){if(b.call(this),!this.isStopped)return this.observers.push(a),new pc(this,a);var c=this.exception,d=this.hasValue,e=this.value;return c?a.onError(c):d?(a.onNext(e),a.onCompleted()):a.onCompleted(),wb}function d(){a.call(this,c),this.isDisposed=!1,this.isStopped=!1,this.value=null,this.hasValue=!1,this.observers=[],this.exception=null}return nb(d,a),ob(d.prototype,Tb,{hasObservers:function(){return b.call(this),this.observers.length>0},onCompleted:function(){var a,c,d;if(b.call(this),!this.isStopped){this.isStopped=!0;var e=this.observers.slice(0),f=this.value,g=this.hasValue;if(g)for(c=0,d=e.length;d>c;c++)a=e[c],a.onNext(f),a.onCompleted();else for(c=0,d=e.length;d>c;c++)e[c].onCompleted();this.observers=[]}},onError:function(a){if(b.call(this),!this.isStopped){var c=this.observers.slice(0);this.isStopped=!0,this.exception=a;for(var d=0,e=c.length;e>d;d++)c[d].onError(a);this.observers=[]}},onNext:function(a){b.call(this),this.isStopped||(this.value=a,this.hasValue=!0)},dispose:function(){this.isDisposed=!0,this.observers=null,this.exception=null,this.value=null}}),d}(_b),E.AnonymousSubject=function(a){function b(b,c){this.observer=b,this.observable=c,a.call(this,this.observable.subscribe.bind(this.observable))}return nb(b,a),ob(b.prototype,Tb,{onCompleted:function(){this.observer.onCompleted()},onError:function(a){this.observer.onError(a)},onNext:function(a){this.observer.onNext(a)}}),b}(_b));"function"==typeof define&&"object"==typeof define.amd&&define.amd?(z.Rx=E,define('rx',[],function(){return E})):A&&B?C?(B.exports=E).Rx=E:A.Rx=E:z.Rx=E}).call(this);
/*global define,window*/
define('scalejs.routing-historyjs/history',[
    'scalejs!core',
    'history',
    'rx'
], function (
    core,
    History,
    rx
) {
    

    function add(state) {
        return History.pushState(state.data, state.title, state.url);
    }

    function get() {
        return History.getState();
    }

    function replace(state) {
        return History.replaceState(state.data, state.title, state.url);
    }

    function observe() {
        var observable = rx.Observable,
            disposable = rx.Disposable;

        return observable.createWithDisposable(function (observer) {
            History.Adapter.bind(window, 'statechange', function () {
                observer.onNext(get());
            });

            return disposable.create(function () {
                window.onstatechange = null;
            });
        }).publishValue(get())
            .refCount();
    }

    return {
        add: add,
        get: get,
        replace: replace,
        observe: observe
    };
});


/*global define*/
define('scalejs.routing-historyjs/routeMapper',[
    'scalejs!core'
], function (
    core
) {
    

    var clone = core.object.clone;

    /*
     * Given a mapping /a/{id}
     *   fromUrl('/a/1?x=2&y=t') will return { id: 1, x: 1, y: 't'}
     *   toUrl({id : 1, x: 1, y: 't'}) will return '/a/1?x=2&y=t'
     */
    return function routeMapper(mapping) {
        var cleanedMapping,
            routeGroups = [],
            mappingRegex;

        function createMappingRegex() {
            var routeGroupsMatches,
                mappingRegexText;

            cleanedMapping = mapping.replace(/^\/*|[/?]*$/g, ''); // strip leading '/' and ending '/' and '?'

            routeGroupsMatches = cleanedMapping.match(/{([^}])*}/g);
            if (routeGroupsMatches) {
                routeGroups = routeGroupsMatches.map(function (m) {
                    return m.replace(/[{}]/g, '');
                });
            }

            mappingRegexText = '^[/]*' + cleanedMapping.replace(/{[^}]*}/g, '(.+?)') + '[?/]*$';

            mappingRegex = new RegExp(mappingRegexText);
        }

        function fromUrl(url) {
            var urlElements,
                path,
                query,
                matches,
                result = {};

            urlElements = url.split(/\/*\?/);
            path = urlElements[0];
            query = url.substring(path.length).replace(/^[?/]*/, '');

            matches = path.match(mappingRegex);

            if (matches === null) {
                return null;
            }

            matches.shift(); // get rid of 0th group that matches whole string
            matches.forEach(function (m, i) {
                result[routeGroups[i]] = m;
            });

            query.split('&').map(function (kv) {
                var parts = kv.split('='),
                    key = parts[0],
                    value = parts[1];

                if (key) {
                    result[key] = value;
                }
            });

            return result;
        }

        function toUrl(data) {
            data = data ? clone(data) : {};

            var path,
                query = {};

            path = routeGroups.reduce(function (path, g) {
                var p = path.replace('{' + g + '}', data[g]);
                delete data[g];
                return p;
            }, cleanedMapping);

            query = Object.keys(data)
                .map(function (key) {
                    return key + '=' + data[key];
                })
                .join('&');

            return '/' + path + (query ? '?' + query : '');
        }

        createMappingRegex();

        return {
            fromUrl: fromUrl,
            toUrl: toUrl
        };
    };
});
/*ignore jslint end*/
;
/*global define,window,document,console*/
/*jslint todo:true*/
define('scalejs.routing-historyjs/router',[
    //'scalejs!core',
    './routeMapper'
], function (
    //core,
    routeMapper
) {
    

    var routes = {},
        baseUrl = '';

    function addRoute(routeName, route) {
        var mapper = routeMapper(route);
        routes[routeName] = mapper;
    }

    function tryFromUrl(routeName, url) {
        var mapper,
            parsed;

        if (url.indexOf(baseUrl) < 0) { return; }

        url = url.substring(baseUrl.length);

        mapper = routes[routeName];
        if (mapper) {
            parsed = mapper.fromUrl(url);
            return parsed;
        }
    }

    function tryToUrl(routeName, data) {
        var mapper,
            url;

        mapper = routes[routeName];
        if (mapper) {
            url = mapper.toUrl(data);
            return baseUrl + url;
        }
    }

    function setBaseUrl(newBaseUrl) {
        baseUrl = newBaseUrl || '';
        baseUrl = baseUrl.replace(/\/*$/, '');
    }

    return {
        addRoute: addRoute,
        tryToUrl: tryToUrl,
        tryFromUrl: tryFromUrl,
        setBaseUrl: setBaseUrl
    };
});

//   Copyright 2011-2012 Jacob Beard, INFICON, and other SCION contributors
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

//UMD boilerplate - https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define('scion-ng',factory);
    } else {
        // Browser globals (root is window)
        root.scion = factory();
  }
}(this, function () {

    

    var STATE_TYPES = {
        BASIC: 0,
        COMPOSITE: 1,
        PARALLEL: 2,
        HISTORY: 3,
        INITIAL: 4,
        FINAL: 5
    };

    function initializeModel(rootState){
        var transitions = [], idToStateMap = {}, documentOrder = 0;


        //TODO: need to add fake ids to anyone that doesn't have them
        //FIXME: make this safer - break into multiple passes
        var idCount = {};

        function generateId(type){
            if(idCount[type] === undefined) idCount[type] = 0;

            var count = idCount[type]++;
            return '$generated-' + type + '-' + count; 
        }

        function wrapInFakeRootState(state){
            return {
                $deserializeDatamodel : state.$deserializeDatamodel || function(){},
                $serializeDatamodel : state.$serializeDatamodel || function(){ return null;},
                $idToStateMap : idToStateMap,   //keep this for handy deserialization of serialized configuration
                states : [
                    {
                        type : 'initial',
                        transitions : [{
                            target : state
                        }]
                    },
                    state
                ]
            };
        }

        function normalizeAction(stateOrTransition,actionProperty){
            var v = stateOrTransition[actionProperty];

            function normalize(o){
                if(typeof o === 'string'){
                    return eval(o);             //TODO: global eval
                }else if(typeof o === 'function'){
                    return o;
                }else{
                    throw new Error('Unrecognized type of object for actionProperty ' + actionProperty);
                }
            }

            if(v !== undefined) stateOrTransition[actionProperty] = Array.isArray(v) ?  v.map(normalize) : [normalize(v)];

        }

        function traverse(ancestors,state){

            //add to global transition and state id caches
            if(state.transitions) transitions.push.apply(transitions,state.transitions);

            //populate state id map
            if(state.id){
                if(idToStateMap[state.id]) throw new Error('Redefinition of state id ' + state.id);

                idToStateMap[state.id] = state;
            }

            //create a default type, just to normalize things
            //this way we can check for unsupported types below
            state.type = state.type || 'state';

            //add ancestors and depth properties
            state.ancestors = ancestors;
            state.depth = ancestors.length;
            state.parent = ancestors[0];

            //add some information to transitions
            state.transitions = state.transitions || [];
            state.transitions.forEach(function(transition){
                transition.documentOrder = documentOrder++; 
                transition.source = state;
            });

            var t2 = traverse.bind(null,[state].concat(ancestors));

            //recursive step
            if(state.states) state.states.forEach(t2);

            //setup fast state type
            switch(state.type){
                case 'parallel':
                    state.typeEnum = STATE_TYPES.PARALLEL;
                    break;
                case 'initial' : 
                    state.typeEnum = STATE_TYPES.INITIAL;
                    break;
                case 'history' :
                    state.typeEnum = STATE_TYPES.HISTORY;
                    break;
                case 'final' : 
                    state.typeEnum = STATE_TYPES.FINAL;
                    break;
                case 'state' : 
                case 'scxml' :
                    if(state.states && state.states.length){
                        state.typeEnum = STATE_TYPES.COMPOSITE;
                    }else{
                        state.typeEnum = STATE_TYPES.BASIC;
                    }
                    break;
                default :
                    throw new Error('Unknown state type: ' + state.type);
            }

            //descendants property on states will now be populated. add descendants to this state
            if(state.states){
                state.descendants = state.states.concat(state.states.map(function(s){return s.descendants;}).reduce(function(a,b){return a.concat(b);},[]));
            }else{
                state.descendants = [];
            }

            var initialChildren;
            if(state.typeEnum === STATE_TYPES.COMPOSITE){
                //set up initial state
                
                if(typeof state.initial === 'string'){
                    //dereference him from his 
                    initialChildren = state.states.filter(function(child){
                        return child.id === state.initial;
                    });
                    if(initialChildren.length){
                        state.initialRef = initialChildren[0];
                    } 
                }else{
                    //take the first child that has initial type, or first child
                    initialChildren = state.states.filter(function(child){
                        return child.type === 'initial';
                    });

                    state.initialRef = initialChildren.length ? initialChildren[0] : state.states[0];
                }

                if(!state.initialRef) throw new Error('Unable to locate initial state for composite state: ' + state.id);
            }

            //hook up history
            if(state.typeEnum === STATE_TYPES.COMPOSITE ||
                    state.typeEnum === STATE_TYPES.PARALLEL){

                var historyChildren = state.states.filter(function(s){
                    return s.type === 'history';
                }); 

               state.historyRef = historyChildren[0];
            }

            //now it's safe to fill in fake state ids
            if(!state.id){
                state.id = generateId(state.type);
                idToStateMap[state.id] = state;
            }

            //normalize onEntry/onExit, which can be single fn or array
            ['onEntry','onExit'].forEach(normalizeAction.bind(this,state));
        }

        //TODO: convert events to regular expressions in advance

        function connectTransitionGraph(){
            //normalize as with onEntry/onExit
            transitions.forEach(function(t){
               normalizeAction(t,'onTransition');
            });

            transitions.forEach(function(t){
                //normalize "event" attribute into "events" attribute
                if(t.event){
                    t.events = t.event.trim().split(/ +/);
                }
            });

            //hook up targets
            transitions.forEach(function(t){
                if(t.targets || (typeof t.target === 'undefined')) return;   //targets have already been set up

                if(typeof t.target === 'string'){
                    //console.log('here1');
                    var target = idToStateMap[t.target];
                    if(!target) throw new Error('Unable to find target state with id ' + t.target);
                    t.target = target;
                    t.targets = [t.target];
                }else if(Array.isArray(t.target)){
                    //console.log('here2');
                    t.targets = t.target.map(function(target){
                        if(typeof target === 'string'){
                            target = idToStateMap[target];
                            if(!target) throw new Error('Unable to find target state with id ' + t.target);
                            return target;
                        }else{
                            return target;
                        } 
                    }); 
                }else if(typeof t.target === 'object'){
                    t.targets = [t.target];
                }else{
                    throw new Error('Transition target has unknown type: ' + t.target);
                }
            });

            //hook up LCA - optimization
            transitions.forEach(function(t){
                if(t.targets) t.lcca = getLCCA(t.source,t.targets[0]);    //FIXME: we technically do not need to hang onto the lcca. only the scope is used by the algorithm

                t.scope = getScope(t);
                //console.log('scope',t.source.id,t.scope.id,t.targets);
            });
        }

        function getScope(transition){
            //Transition scope is normally the least common compound ancestor (lcca).
            //Internal transitions have a scope equal to the source state.

            var transitionIsReallyInternal = 
                    transition.type === 'internal' &&
                        transition.source.parent &&    //root state won't have parent
                            transition.targets && //does it target its descendants
                                transition.targets.every(
                                    function(target){ return transition.source.descendants.indexOf(target) > -1;});

            if(!transition.targets){
                return transition.source; 
            }else if(transitionIsReallyInternal){
                return transition.source; 
            }else{
                return transition.lcca;
            }
        }

        function getLCCA(s1, s2) {
            //console.log('getLCCA',s1, s2);
            var commonAncestors = [];
            s1.ancestors.forEach(function(anc){
                //console.log('s1.id',s1.id,'anc',anc.id,'anc.typeEnum',anc.typeEnum,'s2.id',s2.id);
                if(anc.typeEnum === STATE_TYPES.COMPOSITE &&
                    anc.descendants.indexOf(s2) > -1){
                    commonAncestors.push(anc);
                }
            });
            //console.log('commonAncestors',s1.id,s2.id,commonAncestors.map(function(s){return s.id;}));
            if(!commonAncestors.length) throw new Error("Could not find LCA for states.");
            return commonAncestors[0];
        }

        //main execution starts here
        //FIXME: only wrap in root state if it's not a compound state
        var fakeRootState = wrapInFakeRootState(rootState);  //I wish we had pointer semantics and could make this a C-style "out argument". Instead we return him
        traverse([],fakeRootState);
        connectTransitionGraph();

        return fakeRootState;
    }


    /* begin ArraySet */

    /** @constructor */
    function ArraySet(l) {
        l = l || [];
        this.o = [];
            
        l.forEach(function(x){
            this.add(x);
        },this);
    }

    ArraySet.prototype = {

        add : function(x) {
            if (!this.contains(x)) return this.o.push(x);
        },

        remove : function(x) {
            var i = this.o.indexOf(x);
            if(i === -1){
                return false;
            }else{
                this.o.splice(i, 1);
            }
            return true;
        },

        union : function(l) {
            l = l.iter ? l.iter() : l;
            l.forEach(function(x){
                this.add(x);
            },this);
            return this;
        },

        difference : function(l) {
            l = l.iter ? l.iter() : l;

            l.forEach(function(x){
                this.remove(x);
            },this);
            return this;
        },

        contains : function(x) {
            return this.o.indexOf(x) > -1;
        },

        iter : function() {
            return this.o;
        },

        isEmpty : function() {
            return !this.o.length;
        },

        equals : function(s2) {
            var l2 = s2.iter();
            var l1 = this.o;

            return l1.every(function(x){
                return l2.indexOf(x) > -1;
            }) && l2.every(function(x){
                return l1.indexOf(x) > -1;
            });
        },

        toString : function() {
            return "Set(" + this.o.toString() + ")";
        }
    };

    var scxmlPrefixTransitionSelector = (function(){

        var eventNameReCache = {};

        function eventNameToRe(name) {
            return new RegExp("^" + (name.replace(/\./g, "\\.")) + "(\\.[0-9a-zA-Z]+)*$");
        }

        function retrieveEventRe(name) {
            return eventNameReCache[name] ? eventNameReCache[name] : eventNameReCache[name] = eventNameToRe(name);
        }

        function nameMatch(t, event) {
            return event && event.name &&
                        (t.events.indexOf("*") > -1 ? 
                            true : 
                                t.events.filter(function(tEvent){
                                    return retrieveEventRe(tEvent).test(event.name);
                                }).length);

        }

        return function(state, event, evaluator) {
            return state.transitions.filter(function(t){
                return (!t.events || nameMatch(t,event)) && (!t.cond || evaluator(t.cond));
            });
        };
    })();

    //model accessor functions
    var query = {
        getAncestors: function(s, root) {
            var ancestors, index, state;
            index = s.ancestors.indexOf(root);
            if (index > -1) {
                return s.ancestors.slice(0, index);
            } else {
                return s.ancestors;
            }
        },
        /** @this {model} */
        getAncestorsOrSelf: function(s, root) {
            return [s].concat(this.getAncestors(s, root));
        },
        getDescendantsOrSelf: function(s) {
            return [s].concat(s.descendants);
        },
        /** @this {model} */
        isOrthogonalTo: function(s1, s2) {
            //Two control states are orthogonal if they are not ancestrally
            //related, and their smallest, mutual parent is a Concurrent-state.
            return !this.isAncestrallyRelatedTo(s1, s2) && this.getLCA(s1, s2).typeEnum === STATE_TYPES.PARALLEL;
        },
        /** @this {model} */
        isAncestrallyRelatedTo: function(s1, s2) {
            //Two control states are ancestrally related if one is child/grandchild of another.
            return this.getAncestorsOrSelf(s2).indexOf(s1) > -1 || this.getAncestorsOrSelf(s1).indexOf(s2) > -1;
        },
        /** @this {model} */
        getLCA: function(s1, s2) {
            var commonAncestors = this.getAncestors(s1).filter(function(a){
                return a.descendants.indexOf(s2) > -1;
            },this);
            return commonAncestors[0];
        }
    };
    
    //priority comparison functions
    function getTransitionWithHigherSourceChildPriority(_arg) {
        var t1 = _arg[0], t2 = _arg[1];
        //compare transitions based first on depth, then based on document order
        if (t1.source.depth < t2.source.depth) {
            return t2;
        } else if (t2.source.depth < t1.source.depth) {
            return t1;
        } else {
            if (t1.documentOrder < t2.documentOrder) {
                return t1;
            } else {
                return t2;
            }
        }
    }

    function initializeModelGeneratorFn(modelFn, opts, interpreter){

         opts.x =  opts.x || {};

        var args = ['x','sessionid','name','ioprocessors'].
                            map(function(name){ return opts.x['_' + name] = opts[name]; }).
                                concat(interpreter.isIn.bind(interpreter));

        //the "model" might be a function, so we lazy-init him here to get the root state
        return modelFn.apply(interpreter,args);
    }

    function deserializeSerializedConfiguration(serializedConfiguration,idToStateMap){
      return serializedConfiguration.map(function(id){
        var state = idToStateMap[id];
        if(!state) throw new Error('Error loading serialized configuration. Unable to locate state with id ' + id);
        return state;
      });
    }

    function deserializeHistory(serializedHistory,idToStateMap){
      var o = {};
      Object.keys(serializedHistory).forEach(function(sid){
        o[sid] = serializedHistory[sid].map(function(id){
          var state = idToStateMap[id];
          if(!state) throw new Error('Error loading serialized history. Unable to locate state with id ' + id);
          return state;
        });
      });
      return o;
    }
 
    /** @const */
    var printTrace = false;

    /** @constructor */
    function BaseInterpreter(modelOrFnGenerator, opts){

        this._scriptingContext = opts.interpreterScriptingContext || (opts.InterpreterScriptingContext ? new opts.InterpreterScriptingContext(this) : {}); 

        var model;
        if(typeof modelOrFnGenerator === 'function'){
            model = initializeModelGeneratorFn(modelOrFnGenerator, opts, this);
        }else if(typeof modelOrFnGenerator === 'string'){
            model = JSON.parse(modelOrFnGenerator);
        }else{
            model = modelOrFnGenerator;
        }

        this._model = initializeModel(model);

        //console.log(require('util').inspect(this._model,false,4));
       
        this.opts = opts || {};

        this.opts.console = opts.console || (typeof console === 'undefined' ? {log : function(){}} : console);   //rely on global console if this console is undefined
        this.opts.Set = this.opts.Set || ArraySet;
        this.opts.priorityComparisonFn = this.opts.priorityComparisonFn || getTransitionWithHigherSourceChildPriority;
        this.opts.transitionSelector = this.opts.transitionSelector || scxmlPrefixTransitionSelector;

        this._scriptingContext.log = this._scriptingContext.log || this.opts.console.log;   //set up default scripting context log function

        this._internalEventQueue = [];

        //check if we're loading from a previous snapshot
        if(opts.snapshot){
          this._configuration = new this.opts.Set(deserializeSerializedConfiguration(opts.snapshot[0], this._model.$idToStateMap));
          this._historyValue = deserializeHistory(opts.snapshot[1], this._model.$idToStateMap); 
          this._isInFinalState = opts.snapshot[2];
          this._model.$deserializeDatamodel(opts.snapshot[3]);   //load up the datamodel
        }else{
          this._configuration = new this.opts.Set();
          this._historyValue = {};
          this._isInFinalState = false;
        }

        //SCXML system variables:
        this._x = {
            _sessionId : opts.sessionId || null,
            _name : model.name || opts.name || null,
            _ioprocessors : opts.ioprocessors || null
        };

        this._listeners = [];
    }

    BaseInterpreter.prototype = {

        /** @expose */
        start : function() {
            //perform big step without events to take all default transitions and reach stable initial state
            if (printTrace) this.opts.console.log("performing initial big step");

            //We effectively need to figure out states to enter here to populate initial config. assuming root is compound state makes this simple.
            //but if we want it to be parallel, then this becomes more complex. so when initializing the model, we add a 'fake' root state, which
            //makes the following operation safe.
            this._configuration.add(this._model.initialRef);   

            this._performBigStep();
            return this.getConfiguration();
        },

        /** @expose */
        getConfiguration : function() {
            return this._configuration.iter().map(function(s){return s.id;});
        },

        /** @expose */
        getFullConfiguration : function() {
            return this._configuration.iter().
                    map(function(s){ return [s].concat(query.getAncestors(s));},this).
                    reduce(function(a,b){return a.concat(b);},[]).    //flatten
                    map(function(s){return s.id;}).
                    reduce(function(a,b){return a.indexOf(b) > -1 ? a : a.concat(b);},[]); //uniq
        },


        /** @expose */
        isIn : function(stateName) {
            return this.getFullConfiguration().indexOf(stateName) > -1;
        },

        /** @expose */
        isFinal : function(stateName) {
            return this._isInFinalState;
        },

        /** @private */
        _performBigStep : function(e) {
            if (e) this._internalEventQueue.push(e);
            var keepGoing = true;
            while (keepGoing) {
                var currentEvent = this._internalEventQueue.shift() || null;

                var selectedTransitions = this._performSmallStep(currentEvent);
                keepGoing = !selectedTransitions.isEmpty();
            }
            this._isInFinalState = this._configuration.iter().every(function(s){ return s.typeEnum === STATE_TYPES.FINAL; });
        },

        /** @private */
        _performSmallStep : function(currentEvent) {

            if (printTrace) this.opts.console.log("selecting transitions with currentEvent: ", currentEvent);

            var selectedTransitions = this._selectTransitions(currentEvent);

            if (printTrace) this.opts.console.log("selected transitions: ", selectedTransitions);

            if (!selectedTransitions.isEmpty()) {

                if (printTrace) this.opts.console.log("sorted transitions: ", selectedTransitions);

                //we only want to enter and exit states from transitions with targets
                //filter out targetless transitions here - we will only use these to execute transition actions
                var selectedTransitionsWithTargets = new this.opts.Set(selectedTransitions.iter().filter(function(t){return t.targets;}));

                var exitedTuple = this._getStatesExited(selectedTransitionsWithTargets), 
                    basicStatesExited = exitedTuple[0], 
                    statesExited = exitedTuple[1];

                var enteredTuple = this._getStatesEntered(selectedTransitionsWithTargets), 
                    basicStatesEntered = enteredTuple[0], 
                    statesEntered = enteredTuple[1];

                if (printTrace) this.opts.console.log("basicStatesExited ", basicStatesExited);
                if (printTrace) this.opts.console.log("basicStatesEntered ", basicStatesEntered);
                if (printTrace) this.opts.console.log("statesExited ", statesExited);
                if (printTrace) this.opts.console.log("statesEntered ", statesEntered);

                var eventsToAddToInnerQueue = new this.opts.Set();

                //update history states
                if (printTrace) this.opts.console.log("executing state exit actions");

                var evaluateAction = this._evaluateAction.bind(this, currentEvent);        //create helper fn that actions can call later on

                statesExited.forEach(function(state){

                    if (printTrace || this.opts.logStatesEnteredAndExited) this.opts.console.log("exiting ", state.id);

                    //invoke listeners
                    this._listeners.forEach(function(l){
                       if(l.onExit) l.onExit(state.id); 
                    });

                    if(state.onExit !== undefined) state.onExit.forEach(evaluateAction);

                    var f;
                    if (state.historyRef) {
                        if (state.historyRef.isDeep) {
                            f = function(s0) {
                                return s0.typeEnum === STATE_TYPES.BASIC && state.descendants.indexOf(s0) > -1;
                            };
                        } else {
                            f = function(s0) {
                                return s0.parent === state;
                            };
                        }
                        //update history
                        this._historyValue[state.historyRef.id] = statesExited.filter(f);
                    }
                },this);


                // -> Concurrency: Number of transitions: Multiple
                // -> Concurrency: Order of transitions: Explicitly defined
                var sortedTransitions = selectedTransitions.iter().sort(function(t1, t2) {
                    return t1.documentOrder - t2.documentOrder;
                });

                if (printTrace) this.opts.console.log("executing transitition actions");


                sortedTransitions.forEach(function(transition){

                    var targetIds = transition.targets && transition.targets.map(function(target){return target.id;});

                    this._listeners.forEach(function(l){
                       if(l.onTransition) l.onTransition(transition.source.id,targetIds); 
                    });

                    if(transition.onTransition !== undefined) transition.onTransition.forEach(evaluateAction);
                },this);
     
                if (printTrace) this.opts.console.log("executing state enter actions");

                statesEntered.forEach(function(state){

                    if (printTrace || this.opts.logStatesEnteredAndExited) this.opts.console.log("entering", state.id);

                    this._listeners.forEach(function(l){
                       if(l.onEntry) l.onEntry(state.id); 
                    });

                    if(state.onEntry !== undefined) state.onEntry.forEach(evaluateAction);
                },this);

                if (printTrace) this.opts.console.log("updating configuration ");
                if (printTrace) this.opts.console.log("old configuration ", this._configuration);

                //update configuration by removing basic states exited, and adding basic states entered
                this._configuration.difference(basicStatesExited);
                this._configuration.union(basicStatesEntered);


                if (printTrace) this.opts.console.log("new configuration ", this._configuration);
                
                //add set of generated events to the innerEventQueue -> Event Lifelines: Next small-step
                if (!eventsToAddToInnerQueue.isEmpty()) {
                    if (printTrace) this.opts.console.log("adding triggered events to inner queue ", eventsToAddToInnerQueue);
                    this._internalEventQueue.push(eventsToAddToInnerQueue);
                }

            }

            //if selectedTransitions is empty, we have reached a stable state, and the big-step will stop, otherwise will continue -> Maximality: Take-Many
            return selectedTransitions;
        },

        /** @private */
        _evaluateAction : function(currentEvent, actionRef) {
            return actionRef.call(this._scriptingContext, currentEvent);     //SCXML system variables
        },

        /** @private */
        _getStatesExited : function(transitions) {
            var statesExited = new this.opts.Set();
            var basicStatesExited = new this.opts.Set();

            //States exited are defined to be active states that are
            //descendants of the scope of each priority-enabled transition.
            //Here, we iterate through the transitions, and collect states
            //that match this condition. 
            transitions.iter().forEach(function(transition){
                var scope = transition.scope,
                    desc = scope.descendants;

                //For each state in the configuration
                //is that state a descendant of the transition scope?
                //Store ancestors of that state up to but not including the scope.
                this._configuration.iter().forEach(function(state){
                    if(desc.indexOf(state) > -1){
                        basicStatesExited.add(state);
                        statesExited.add(state);
                        query.getAncestors(state,scope).forEach(function(anc){
                            statesExited.add(anc);
                        });
                    }
                },this);
            },this);

            var sortedStatesExited = statesExited.iter().sort(function(s1, s2) {
                return s2.depth - s1.depth;
            });
            return [basicStatesExited, sortedStatesExited];
        },

        /** @private */
        _getStatesEntered : function(transitions) {

            var o = {
                statesToEnter : new this.opts.Set(),
                basicStatesToEnter : new this.opts.Set(),
                statesProcessed  : new this.opts.Set(),
                statesToProcess : []
            };

            //do the initial setup
            transitions.iter().forEach(function(transition){
                transition.targets.forEach(function(target){
                    this._addStateAndAncestors(target,transition.scope,o);
                },this);
            },this);

            //loop and add states until there are no more to add (we reach a stable state)
            var s;
            /*jsl:ignore*/
            while(s = o.statesToProcess.pop()){
                /*jsl:end*/
                this._addStateAndDescendants(s,o);
            }

            //sort based on depth
            var sortedStatesEntered = o.statesToEnter.iter().sort(function(s1, s2) {
                return s1.depth - s2.depth;
            });

            return [o.basicStatesToEnter, sortedStatesEntered];
        },

        /** @private */
        _addStateAndAncestors : function(target,scope,o){

            //process each target
            this._addStateAndDescendants(target,o);

            //and process ancestors of targets up to the scope, but according to special rules
            query.getAncestors(target,scope).forEach(function(s){

                if (s.typeEnum === STATE_TYPES.COMPOSITE) {
                    //just add him to statesToEnter, and declare him processed
                    //this is to prevent adding his initial state later on
                    o.statesToEnter.add(s);

                    o.statesProcessed.add(s);
                }else{
                    //everything else can just be passed through as normal
                    this._addStateAndDescendants(s,o);
                } 
            },this);
        },

        /** @private */
        _addStateAndDescendants : function(s,o){

            if(o.statesProcessed.contains(s)) return;

            if (s.typeEnum === STATE_TYPES.HISTORY) {
                if (s.id in this._historyValue) {
                    this._historyValue[s.id].forEach(function(stateFromHistory){
                        this._addStateAndAncestors(stateFromHistory,s.parent,o);
                    },this);
                } else {
                    o.statesToEnter.add(s);
                    o.basicStatesToEnter.add(s);
                }
            } else {
                o.statesToEnter.add(s);

                if (s.typeEnum === STATE_TYPES.PARALLEL) {
                    o.statesToProcess.push.apply(o.statesToProcess,
                        s.states.filter(function(s){return s.typeEnum !== STATE_TYPES.HISTORY;}));
                } else if (s.typeEnum === STATE_TYPES.COMPOSITE) {
                    o.statesToProcess.push(s.initialRef); 
                } else if (s.typeEnum === STATE_TYPES.INITIAL || s.typeEnum === STATE_TYPES.BASIC || s.typeEnum === STATE_TYPES.FINAL) {
                    o.basicStatesToEnter.add(s);
                }
            }

            o.statesProcessed.add(s); 
        },

        /** @private */
        _selectTransitions : function(currentEvent) {
            if (this.opts.onlySelectFromBasicStates) {
                var states = this._configuration.iter();
            } else {
                var statesAndParents = new this.opts.Set;

                //get full configuration, unordered
                //this means we may select transitions from parents before states
                
                this._configuration.iter().forEach(function(basicState){
                    statesAndParents.add(basicState);
                    query.getAncestors(basicState).forEach(function(ancestor){
                        statesAndParents.add(ancestor);
                    });
                },this);

                states = statesAndParents.iter();
            }

            

            var usePrefixMatchingAlgorithm = currentEvent && currentEvent.name && currentEvent.name.search(".");

            var transitionSelector = usePrefixMatchingAlgorithm ? scxmlPrefixTransitionSelector : this.opts.transitionSelector;
            var enabledTransitions = new this.opts.Set();

            var e = this._evaluateAction.bind(this,currentEvent);

            states.forEach(function(state){
                transitionSelector(state,currentEvent,e).forEach(function(t){
                    enabledTransitions.add(t);
                });
            });

            var priorityEnabledTransitions = this._selectPriorityEnabledTransitions(enabledTransitions);

            if (printTrace) this.opts.console.log("priorityEnabledTransitions", priorityEnabledTransitions);
            
            return priorityEnabledTransitions;
        },

        /** @private */
        _selectPriorityEnabledTransitions : function(enabledTransitions) {
            var priorityEnabledTransitions = new this.opts.Set();

            var tuple = this._getInconsistentTransitions(enabledTransitions), 
                consistentTransitions = tuple[0], 
                inconsistentTransitionsPairs = tuple[1];

            priorityEnabledTransitions.union(consistentTransitions);

            if (printTrace) this.opts.console.log("enabledTransitions", enabledTransitions);
            if (printTrace) this.opts.console.log("consistentTransitions", consistentTransitions);
            if (printTrace) this.opts.console.log("inconsistentTransitionsPairs", inconsistentTransitionsPairs);
            if (printTrace) this.opts.console.log("priorityEnabledTransitions", priorityEnabledTransitions);
            
            while (!inconsistentTransitionsPairs.isEmpty()) {
                enabledTransitions = new this.opts.Set(
                        inconsistentTransitionsPairs.iter().map(function(t){return this.opts.priorityComparisonFn(t);},this));

                tuple = this._getInconsistentTransitions(enabledTransitions);
                consistentTransitions = tuple[0]; 
                inconsistentTransitionsPairs = tuple[1];

                priorityEnabledTransitions.union(consistentTransitions);

                if (printTrace) this.opts.console.log("enabledTransitions", enabledTransitions);
                if (printTrace) this.opts.console.log("consistentTransitions", consistentTransitions);
                if (printTrace) this.opts.console.log("inconsistentTransitionsPairs", inconsistentTransitionsPairs);
                if (printTrace) this.opts.console.log("priorityEnabledTransitions", priorityEnabledTransitions);
                
            }
            return priorityEnabledTransitions;
        },

        /** @private */
        _getInconsistentTransitions : function(transitions) {
            var allInconsistentTransitions = new this.opts.Set();
            var inconsistentTransitionsPairs = new this.opts.Set();
            var transitionList = transitions.iter();

            if (printTrace) this.opts.console.log("transitions", transitionList);

            for(var i = 0; i < transitionList.length; i++){
                for(var j = i+1; j < transitionList.length; j++){
                    var t1 = transitionList[i];
                    var t2 = transitionList[j];
                    if (this._conflicts(t1, t2)) {
                        allInconsistentTransitions.add(t1);
                        allInconsistentTransitions.add(t2);
                        inconsistentTransitionsPairs.add([t1, t2]);
                    }
                }
            }

            var consistentTransitions = transitions.difference(allInconsistentTransitions);
            return [consistentTransitions, inconsistentTransitionsPairs];
        },

        /** @private */
        _conflicts : function(t1, t2) {
            return !this._isArenaOrthogonal(t1, t2);
        },

        /** @private */
        _isArenaOrthogonal : function(t1, t2) {

            if (printTrace) this.opts.console.log("transition scopes", t1.scope, t2.scope);

            var isOrthogonal = query.isOrthogonalTo(t1.scope, t2.scope);

            if (printTrace) this.opts.console.log("transition scopes are orthogonal?", isOrthogonal);

            return isOrthogonal;
        },


        /*
            registerListener provides a generic mechanism to subscribe to state change notifications.
            Can be used for logging and debugging. For example, can attache a logger that simply logs the state changes.
            Or can attach a network debugging client that sends state change notifications to a debugging server.
        
            listener is of the form:
            {
              onEntry : function(stateId){},
              onExit : function(stateId){},
              onTransition : function(sourceStateId,targetStatesIds[]){}
            }
        */
        //TODO: refactor this to be event emitter? 

        /** @expose */
        registerListener : function(listener){
            return this._listeners.push(listener);
        },

        /** @expose */
        unregisterListener : function(listener){
            return this._listeners.splice(this._listeners.indexOf(listener),1);
        },

        /** @expose */
        getAllTransitionEvents : function(){
            var events = {};
            function getEvents(state){

                if(state.transitions){
                    state.transitions.forEach(function(transition){
                        events[transition.event] = true;
                    });
                }

                if(state.states) state.states.forEach(getEvents);
            }
            getEvents(this._model);

            return Object.keys(events);
        },

        
        /** @expose */
        /**
          Three things capture the current snapshot of a running SCION interpreter:

          * basic configuration (the set of basic states the state machine is in)
          * history state values (the states the state machine was in last time it was in the parent of a history state)
          * the datamodel
          
          Note that this assumes that the method to serialize a scion.SCXML
          instance is not called when the interpreter is executing a big-step (e.g. after
          scion.SCXML.prototype.gen is called, and before the call to gen returns). If
          the serialization method is called during the execution of a big-step, then the
          inner event queue must also be saved. I do not expect this to be a common
          requirement however, and therefore I believe it would be better to only support
          serialization when the interpreter is not executing a big-step.
        */
        getSnapshot : function(){
          if(this._isStepping) throw new Error('getSnapshot cannot be called while interpreter is executing a big-step');


          return [
            this.getConfiguration(),
            this._serializeHistory(),
            this._isInFinalState,
            this._model.$serializeDatamodel()
          ];
        },

        _serializeHistory : function(){
          var o = {};
          Object.keys(this._historyValue).forEach(function(sid){
            o[sid] = this._historyValue[sid].map(function(state){return state.id});
          },this);
          return o;
        }
    };

    /**
     * @constructor
     * @extends BaseInterpreter
     */
    function Statechart(model, opts) {
        opts = opts || {};

        opts.InterpreterScriptingContext = opts.InterpreterScriptingContext || InterpreterScriptingContext;

        this._isStepping = false;
        this._externalEventQueue = [];

        BaseInterpreter.call(this,model,opts);     //call super constructor
    }

    function beget(o){
        function F(){}
        F.prototype = o;
        return new F();
    }

    //Statechart.prototype = Object.create(BaseInterpreter.prototype);
    //would like to use Object.create here, but not portable, but it's too complicated to use portably
    Statechart.prototype = beget(BaseInterpreter.prototype);    

    /** @expose */
    Statechart.prototype.gen = function(evtObjOrName,optionalData) {

        var e;
        switch(typeof evtObjOrName){
            case 'string':
                e = {name : evtObjOrName, data : optionalData};
                break;
            case 'object':
                if(typeof evtObjOrName.name === 'string'){
                    e = evtObjOrName;
                }else{
                    throw new Error('Event object must have "name" property of type string.');
                }
                break;
            default:
                throw new Error('First argument to gen must be a string or object.');
        }

        this._externalEventQueue.push(e);

        if(this._isStepping) return null;       //we're already looping, we can exit and we'll process this event when the next big-step completes

        //otherwise, kick him off
        this._isStepping = true;

        var currentEvent;
        /*jsl:ignore*/
        while(currentEvent = this._externalEventQueue.shift()){
        /*jsl:end*/
            this._performBigStep(currentEvent);
        }

        this._isStepping = false;
        return this.getConfiguration();
    };

    function InterpreterScriptingContext(interpreter){
        this._interpreter = interpreter;
        this._timeoutMap = {};
    }

    //TODO: consider whether this is the API we would like to expose
    InterpreterScriptingContext.prototype = {
        raise : function(event){
            this._interpreter._internalEventQueue.push(event); 
        },
        send : function(event, options){
            if(options.delay === undefined){
                this.gen(event);
            }else{
                if( typeof setTimeout === 'undefined' ) throw new Error('Default implementation of Statechart.prototype.send will not work unless setTimeout is defined globally.');

                if (printTrace) this._interpreter.opts.log("sending event", event.name, "with content", event.data, "after delay", options.delay);

                var timeoutId = setTimeout(this._interpreter.gen.bind(this._interpreter,event), options.delay || 0);

                if (options.sendid) this._timeoutMap[options.sendid] = timeoutId;
            }
        },
        cancel : function(sendid){

            if( typeof clearTimeout === 'undefined' ) throw new Error('Default implementation of Statechart.prototype.cancel will not work unless setTimeout is defined globally.');

            if (sendid in this._timeoutMap) {
                if (printTrace) this._interpreter.opts.log("cancelling ", sendid, " with timeout id ", this._timeoutMap[sendid]);
                clearTimeout(this._timeoutMap[sendid]);
            }
        }

    };

    return {
        /** @expose */
        BaseInterpreter: BaseInterpreter,
        /** @expose */
        Statechart: Statechart,
        /** @expose */
        ArraySet : ArraySet,
        /** @expose */
        STATE_TYPES : STATE_TYPES,
        /** @expose */
        initializeModel : initializeModel,
        /** @expose */
        InterpreterScriptingContext : InterpreterScriptingContext
    };
}));

define("scalejs.functional/functional",[],function(){function a(){var a=Array.prototype.slice.call(arguments,0).reverse();return function(){var b=a.reduce(function(a,b){return[b.apply(void 0,a)]},Array.prototype.slice.call(arguments));return b[0]}}function b(){var a=Array.prototype.slice.call(arguments,0);return function(){var b=a.reduce(function(a,b){return[b.apply(void 0,a)]},Array.prototype.slice.call(arguments,0));return b[0]}}function c(a,b){var c=Array.prototype.slice.call(arguments,2);return function(){return b.apply(a,c.concat(Array.prototype.slice.call(arguments,0)))}}function d(a,b){return function(){return a.apply(void 0,Array.prototype.slice.call(arguments,0,b))}}function e(){var a=Array.prototype.slice.call(arguments,0),b=a.reduce(function(a,b,c){return b===g?a.concat([c]):a},[]);return 0===b.length?a[0].apply(void 0,a.slice(1)):function(){var c;for(c=0;c<Math.min(b.length,arguments.length);c+=1)a[b[c]]=arguments[c];return e.apply(void 0,a)}}var f,g={};return f=function(a,b){if(1===arguments.length)return f(a,a.length);var c=Array.prototype.slice.call(arguments,2);return c.length>=b?a.apply(this,c):function(){var d=c.concat(Array.prototype.slice.call(arguments,0));return d.unshift(a,b),f.apply(this,d)}},{_:g,compose:a,sequence:b,bind:c,aritize:d,curry:f,partial:e}}),define("scalejs.functional/builder",[],function(){function a(a){var b,c,d,e;return d=function(a){if(!a||"$"!==a.kind)return a;if("function"==typeof a.expr)return a.expr.call(this);if("string"==typeof a.expr)return this[a.expr];throw new Error("Parameter in $(...) must be either a function or a string referencing a binding.")},e=function(a,e,f){function g(a){return"$return"===a||"$RETURN"===a||"$yield"===a||"$YIELD"===a}if("function"!=typeof c[a]&&"$then"!==a&&"$else"!==a)throw new Error("This control construct may only be used if the computation expression builder defines a `"+a+"` method.");var h,i=d(e);if(f.length>0&&"function"!=typeof c.combine)throw new Error("This control construct may only be used if the computation expression builder defines a `combine` method.");if(g(a)){if(0===f.length)return c[a](i);if("function"!=typeof c.delay)throw new Error("This control construct may only be used if the computation expression builder defines a `delay` method.");return c.combine(c[a](i),c.delay(function(){return b(f)}))}if("$for"===a)return c.combine(c.$for(e.items,function(a){var c=Array.prototype.slice.call(e.cexpr);return this[e.name]=a,b(c)}),b(f));if("$while"===a){if("function"!=typeof c.delay)throw new Error("This control construct may only be used if the computation expression builder defines a `delay` method.");return i=c.$while(e.condition.bind(this),c.delay(function(){var a=Array.prototype.slice.call(e.cexpr);return b(a)})),f.length>0?c.combine(i,b(f)):i}return"$then"===a||"$else"===a?(h=Array.prototype.slice.call(e.cexpr),c.combine(b(h),f)):c.combine(c[a](i),b(f))},a.missing||(a.missing=function(a){if(a.kind)throw new Error('Unknown operation "'+a.kind+'". Either define `missing` method on the builder or fix the spelling of the operation.');throw new Error("Expression "+JSON.stringify(a)+" cannot be processed. Either define `missing` method on the builder or convert expression to a function.")}),b=function(a){var f;if(a=Array.prototype.slice.call(a),0===a.length){if(c.zero)return c.zero();throw new Error("Computation expression builder must define `zero` method.")}if(f=a.shift(),"let"===f.kind)return this[f.name]=d(f.expr),b.call(this,a);if("do"===f.kind)return f.expr.call(this),b.call(this,a);if("letBind"===f.kind)return c.bind(f.expr.bind(this),function(c){return this[f.name]=c,b.call(this,a)}.bind(this));if("doBind"===f.kind||"$"===f.kind){if(a.length>0)return c.bind(f.expr.bind(this),function(){return b.call(this,a)}.bind(this));if("function"!=typeof c.$return)throw new Error("This control construct may only be used if the computation expression builder defines a `$return` method.");return c.bind(f.expr.bind(this),function(a){return c.$return(a)})}return"$return"===f.kind||"$RETURN"===f.kind||"$yield"===f.kind||"$YIELD"===f.kind?e(f.kind,f.expr,a):"$for"===f.kind||"$while"===f.kind?e(f.kind,f,a):"$if"===f.kind?f.condition.call(this)?e("$then",f.thenExpr,a):f.elseExpr?e("$else",f.elseExpr,a):e(b([]),a):"function"==typeof f&&c.call?(c.call(this),b.call(this,a)):"function"==typeof f?(f.call(this),b.call(this,a)):e("missing",f,a)},function(){function d(){var a={mixins:Array.prototype.slice.call(arguments,0)},b=f.bind(a);return b.mixin=function(){return Array.prototype.push.apply(a.mixins,arguments),b},b}var e=Array.prototype.slice.call(arguments),f=function(){var d,f,g,h=Array.prototype.slice.call(arguments,0);return c={},Object.keys(a).forEach(function(b){c[b]=a[b]}),this.mixins&&this.mixins.forEach(function(a){a.beforeBuild&&a.beforeBuild(h)}),g=function(){return b.call(this,h)},c.run||c.delay?(c.delay&&(f=g,g=function(){return c.delay(f)}),d=g(),c.run&&(d=c.run.apply(c,[d].concat(e)))):d=g(),this.mixins&&this.mixins.forEach(function(a){a.afterBuild&&(d=a.afterBuild(d))}),d};return f.mixin=d,f}}return a.$let=function(a,b){return{kind:"let",name:a,expr:b}},a.$LET=function(a,b){return{kind:"letBind",name:a,expr:b}},a.$do=function(a){return{kind:"do",expr:a}},a.$DO=function(a){return{kind:"doBind",expr:a}},a.$return=function(a){return{kind:"$return",expr:a}},a.$RETURN=function(a){return{kind:"$RETURN",expr:a}},a.$yield=function(a){return{kind:"$yield",expr:a}},a.$YIELD=function(a){return{kind:"$YIELD",expr:a}},a.$for=function(a,b){var c=Array.prototype.slice.call(arguments,2);return{kind:"$for",name:a,items:b,cexpr:c}},a.$while=function(a){if(arguments.length<2)throw new Error('Incomplete `while`. Expected "$while(<condition>, <expr>)".');var b=Array.prototype.slice.call(arguments,1);return{kind:"$while",condition:a,cexpr:b}},a.$if=function(a,b,c){if(arguments.length<2)throw new Error('Incomplete conditional. Expected "$if(<expr>, $then(expr))" or "$if(<expr>, $then(<expr>), $else(<expr>)"');if("function"!=typeof a)throw new Error("First argument must be a function that defines the condition of $if.");if("$then"!==b.kind)throw new Error('Unexpected "'+b.kind+'" in the place of "$then"');if(c&&"$else"!==c.kind)throw new Error('Unexpected "'+c.kind+'" in the place of "$else"');return{kind:"$if",condition:a,thenExpr:b,elseExpr:c}},a.$then=function(){var a=Array.prototype.slice.call(arguments,0);if(0===a.length)throw new Error("$then should contain at least one expression.");return{kind:"$then",cexpr:a}},a.$else=function(){var a=Array.prototype.slice.call(arguments,0);if(0===a.length)throw new Error("$else should contain at least one expression.");return{kind:"$else",cexpr:a}},a.$=function(a){return{kind:"$",expr:a}},a}),define("scalejs.functional/continuationBuilder",["./builder"],function(a){var b,c;return b=a({bind:function(a,b){return function(c,d){a(function(a){var e=b(a);return e(c,d)},d)}},$return:function(a){return function(b){b&&("function"==typeof a&&(a=a()),b(a))}},delay:function(a){return a},run:function(a){return function(b,c){var d=a.call(this);d.call(this,b,c)}}}),c=b().mixin({beforeBuild:function(b){b.forEach(function(c,d){"function"==typeof c&&(b[d]=a.$DO(c))})}})}),define("scalejs.functional",["scalejs!core","./scalejs.functional/functional","./scalejs.functional/builder","./scalejs.functional/continuationBuilder"],function(a,b,c,d){var e=a.object.merge;a.registerExtension({functional:e(b,{builder:c,builders:{continuation:d}})})});
/*--------------------------------------------------------------------------
 * linq.js - LINQ for JavaScript
 * ver 3.0.4-Beta5 (Jun. 20th, 2013)
 *
 * created and maintained by neuecc <ils@neue.cc>
 * licensed under MIT License
 * http://linqjs.codeplex.com/
 *------------------------------------------------------------------------*/

(function (root, undefined) {
    // ReadOnly Function
    var Functions = {
        Identity: function (x) { return x; },
        True: function () { return true; },
        Blank: function () { }
    };

    // const Type
    var Types = {
        Boolean: typeof true,
        Number: typeof 0,
        String: typeof "",
        Object: typeof {},
        Undefined: typeof undefined,
        Function: typeof function () { }
    };

    // createLambda cache
    var funcCache = { "": Functions.Identity };

    // private utility methods
    var Utils = {
        // Create anonymous function from lambda expression string
        createLambda: function (expression) {
            if (expression == null) return Functions.Identity;
            if (typeof expression === Types.String) {
                // get from cache
                var f = funcCache[expression];
                if (f != null) {
                    return f;
                }

                if (expression.indexOf("=>") === -1) {
                    var regexp = new RegExp("[$]+", "g");

                    var maxLength = 0;
                    var match;
                    while ((match = regexp.exec(expression)) != null) {
                        var paramNumber = match[0].length;
                        if (paramNumber > maxLength) {
                            maxLength = paramNumber;
                        }
                    }

                    var argArray = [];
                    for (var i = 1; i <= maxLength; i++) {
                        var dollar = "";
                        for (var j = 0; j < i; j++) {
                            dollar += "$";
                        }
                        argArray.push(dollar);
                    }

                    var args = Array.prototype.join.call(argArray, ",");

                    f = new Function(args, "return " + expression);
                    funcCache[expression] = f;
                    return f;
                }
                else {
                    var expr = expression.match(/^[(\s]*([^()]*?)[)\s]*=>(.*)/);
                    f = new Function(expr[1], "return " + expr[2]);
                    funcCache[expression] = f;
                    return f;
                }
            }
            return expression;
        },

        isIEnumerable: function (obj) {
            if (typeof Enumerator !== Types.Undefined) {
                try {
                    new Enumerator(obj); // check JScript(IE)'s Enumerator
                    return true;
                }
                catch (e) { }
            }

            return false;
        },

        // IE8's defineProperty is defined but cannot use, therefore check defineProperties
        defineProperty: (Object.defineProperties != null)
            ? function (target, methodName, value) {
                Object.defineProperty(target, methodName, {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value: value
                })
            }
            : function (target, methodName, value) {
                target[methodName] = value;
            },

        compare: function (a, b) {
            return (a === b) ? 0
                 : (a > b) ? 1
                 : -1;
        },

        dispose: function (obj) {
            if (obj != null) obj.dispose();
        }
    };

    // IEnumerator State
    var State = { Before: 0, Running: 1, After: 2 };

    // "Enumerator" is conflict JScript's "Enumerator"
    var IEnumerator = function (initialize, tryGetNext, dispose) {
        var yielder = new Yielder();
        var state = State.Before;

        this.current = yielder.current;

        this.moveNext = function () {
            try {
                switch (state) {
                    case State.Before:
                        state = State.Running;
                        initialize();
                        // fall through
                    case State.Running:
                        if (tryGetNext.apply(yielder)) {
                            return true;
                        }
                        else {
                            this.dispose();
                            return false;
                        }
                    case State.After:
                        return false;
                }
            }
            catch (e) {
                this.dispose();
                throw e;
            }
        };

        this.dispose = function () {
            if (state != State.Running) return;

            try {
                dispose();
            }
            finally {
                state = State.After;
            }
        };
    };

    // for tryGetNext
    var Yielder = function () {
        var current = null;
        this.current = function () { return current; };
        this.yieldReturn = function (value) {
            current = value;
            return true;
        };
        this.yieldBreak = function () {
            return false;
        };
    };

    // Enumerable constuctor
    var Enumerable = function (getEnumerator) {
        this.getEnumerator = getEnumerator;
    };

    // Utility

    Enumerable.Utils = {}; // container

    Enumerable.Utils.createLambda = function (expression) {
        return Utils.createLambda(expression);
    };

    Enumerable.Utils.createEnumerable = function (getEnumerator) {
        return new Enumerable(getEnumerator);
    };

    Enumerable.Utils.createEnumerator = function (initialize, tryGetNext, dispose) {
        return new IEnumerator(initialize, tryGetNext, dispose);
    };

    Enumerable.Utils.extendTo = function (type) {
        var typeProto = type.prototype;
        var enumerableProto;

        if (type === Array) {
            enumerableProto = ArrayEnumerable.prototype;
            Utils.defineProperty(typeProto, "getSource", function () {
                return this;
            });
        }
        else {
            enumerableProto = Enumerable.prototype;
            Utils.defineProperty(typeProto, "getEnumerator", function () {
                return Enumerable.from(this).getEnumerator();
            });
        }

        for (var methodName in enumerableProto) {
            var func = enumerableProto[methodName];

            // already extended
            if (typeProto[methodName] == func) continue;

            // already defined(example Array#reverse/join/forEach...)
            if (typeProto[methodName] != null) {
                methodName = methodName + "ByLinq";
                if (typeProto[methodName] == func) continue; // recheck
            }

            if (func instanceof Function) {
                Utils.defineProperty(typeProto, methodName, func);
            }
        }
    };

    // Generator

    Enumerable.choice = function () // variable argument
    {
        var args = arguments;

        return new Enumerable(function () {
            return new IEnumerator(
                function () {
                    args = (args[0] instanceof Array) ? args[0]
                        : (args[0].getEnumerator != null) ? args[0].toArray()
                        : args;
                },
                function () {
                    return this.yieldReturn(args[Math.floor(Math.random() * args.length)]);
                },
                Functions.Blank);
        });
    };

    Enumerable.cycle = function () // variable argument
    {
        var args = arguments;

        return new Enumerable(function () {
            var index = 0;
            return new IEnumerator(
                function () {
                    args = (args[0] instanceof Array) ? args[0]
                        : (args[0].getEnumerator != null) ? args[0].toArray()
                        : args;
                },
                function () {
                    if (index >= args.length) index = 0;
                    return this.yieldReturn(args[index++]);
                },
                Functions.Blank);
        });
    };

    Enumerable.empty = function () {
        return new Enumerable(function () {
            return new IEnumerator(
                Functions.Blank,
                function () { return false; },
                Functions.Blank);
        });
    };

    Enumerable.from = function (obj) {
        if (obj == null) {
            return Enumerable.empty();
        }
        if (obj instanceof Enumerable) {
            return obj;
        }
        if (typeof obj == Types.Number || typeof obj == Types.Boolean) {
            return Enumerable.repeat(obj, 1);
        }
        if (typeof obj == Types.String) {
            return new Enumerable(function () {
                var index = 0;
                return new IEnumerator(
                    Functions.Blank,
                    function () {
                        return (index < obj.length) ? this.yieldReturn(obj.charAt(index++)) : false;
                    },
                    Functions.Blank);
            });
        }
        if (typeof obj != Types.Function) {
            // array or array like object
            if (typeof obj.length == Types.Number) {
                return new ArrayEnumerable(obj);
            }

            // JScript's IEnumerable
            if (!(obj instanceof Object) && Utils.isIEnumerable(obj)) {
                return new Enumerable(function () {
                    var isFirst = true;
                    var enumerator;
                    return new IEnumerator(
                        function () { enumerator = new Enumerator(obj); },
                        function () {
                            if (isFirst) isFirst = false;
                            else enumerator.moveNext();

                            return (enumerator.atEnd()) ? false : this.yieldReturn(enumerator.item());
                        },
                        Functions.Blank);
                });
            }

            // WinMD IIterable<T>
            if (typeof Windows === Types.Object && typeof obj.first === Types.Function) {
                return new Enumerable(function () {
                    var isFirst = true;
                    var enumerator;
                    return new IEnumerator(
                        function () { enumerator = obj.first(); },
                        function () {
                            if (isFirst) isFirst = false;
                            else enumerator.moveNext();

                            return (enumerator.hasCurrent) ? this.yieldReturn(enumerator.current) : this.yieldBreak();
                        },
                        Functions.Blank);
                });
            }
        }

        // case function/object : Create keyValuePair[]
        return new Enumerable(function () {
            var array = [];
            var index = 0;

            return new IEnumerator(
                function () {
                    for (var key in obj) {
                        var value = obj[key];
                        if (!(value instanceof Function) && Object.prototype.hasOwnProperty.call(obj, key)) {
                            array.push({ key: key, value: value });
                        }
                    }
                },
                function () {
                    return (index < array.length)
                        ? this.yieldReturn(array[index++])
                        : false;
                },
                Functions.Blank);
        });
    },

    Enumerable.make = function (element) {
        return Enumerable.repeat(element, 1);
    };

    // Overload:function(input, pattern)
    // Overload:function(input, pattern, flags)
    Enumerable.matches = function (input, pattern, flags) {
        if (flags == null) flags = "";
        if (pattern instanceof RegExp) {
            flags += (pattern.ignoreCase) ? "i" : "";
            flags += (pattern.multiline) ? "m" : "";
            pattern = pattern.source;
        }
        if (flags.indexOf("g") === -1) flags += "g";

        return new Enumerable(function () {
            var regex;
            return new IEnumerator(
                function () { regex = new RegExp(pattern, flags); },
                function () {
                    var match = regex.exec(input);
                    return (match) ? this.yieldReturn(match) : false;
                },
                Functions.Blank);
        });
    };

    // Overload:function(start, count)
    // Overload:function(start, count, step)
    Enumerable.range = function (start, count, step) {
        if (step == null) step = 1;

        return new Enumerable(function () {
            var value;
            var index = 0;

            return new IEnumerator(
                function () { value = start - step; },
                function () {
                    return (index++ < count)
                        ? this.yieldReturn(value += step)
                        : this.yieldBreak();
                },
                Functions.Blank);
        });
    };

    // Overload:function(start, count)
    // Overload:function(start, count, step)
    Enumerable.rangeDown = function (start, count, step) {
        if (step == null) step = 1;

        return new Enumerable(function () {
            var value;
            var index = 0;

            return new IEnumerator(
                function () { value = start + step; },
                function () {
                    return (index++ < count)
                        ? this.yieldReturn(value -= step)
                        : this.yieldBreak();
                },
                Functions.Blank);
        });
    };

    // Overload:function(start, to)
    // Overload:function(start, to, step)
    Enumerable.rangeTo = function (start, to, step) {
        if (step == null) step = 1;

        if (start < to) {
            return new Enumerable(function () {
                var value;

                return new IEnumerator(
                function () { value = start - step; },
                function () {
                    var next = value += step;
                    return (next <= to)
                        ? this.yieldReturn(next)
                        : this.yieldBreak();
                },
                Functions.Blank);
            });
        }
        else {
            return new Enumerable(function () {
                var value;

                return new IEnumerator(
                function () { value = start + step; },
                function () {
                    var next = value -= step;
                    return (next >= to)
                        ? this.yieldReturn(next)
                        : this.yieldBreak();
                },
                Functions.Blank);
            });
        }
    };

    // Overload:function(element)
    // Overload:function(element, count)
    Enumerable.repeat = function (element, count) {
        if (count != null) return Enumerable.repeat(element).take(count);

        return new Enumerable(function () {
            return new IEnumerator(
                Functions.Blank,
                function () { return this.yieldReturn(element); },
                Functions.Blank);
        });
    };

    Enumerable.repeatWithFinalize = function (initializer, finalizer) {
        initializer = Utils.createLambda(initializer);
        finalizer = Utils.createLambda(finalizer);

        return new Enumerable(function () {
            var element;
            return new IEnumerator(
                function () { element = initializer(); },
                function () { return this.yieldReturn(element); },
                function () {
                    if (element != null) {
                        finalizer(element);
                        element = null;
                    }
                });
        });
    };

    // Overload:function(func)
    // Overload:function(func, count)
    Enumerable.generate = function (func, count) {
        if (count != null) return Enumerable.generate(func).take(count);
        func = Utils.createLambda(func);

        return new Enumerable(function () {
            return new IEnumerator(
                Functions.Blank,
                function () { return this.yieldReturn(func()); },
                Functions.Blank);
        });
    };

    // Overload:function()
    // Overload:function(start)
    // Overload:function(start, step)
    Enumerable.toInfinity = function (start, step) {
        if (start == null) start = 0;
        if (step == null) step = 1;

        return new Enumerable(function () {
            var value;
            return new IEnumerator(
                function () { value = start - step; },
                function () { return this.yieldReturn(value += step); },
                Functions.Blank);
        });
    };

    // Overload:function()
    // Overload:function(start)
    // Overload:function(start, step)
    Enumerable.toNegativeInfinity = function (start, step) {
        if (start == null) start = 0;
        if (step == null) step = 1;

        return new Enumerable(function () {
            var value;
            return new IEnumerator(
                function () { value = start + step; },
                function () { return this.yieldReturn(value -= step); },
                Functions.Blank);
        });
    };

    Enumerable.unfold = function (seed, func) {
        func = Utils.createLambda(func);

        return new Enumerable(function () {
            var isFirst = true;
            var value;
            return new IEnumerator(
                Functions.Blank,
                function () {
                    if (isFirst) {
                        isFirst = false;
                        value = seed;
                        return this.yieldReturn(value);
                    }
                    value = func(value);
                    return this.yieldReturn(value);
                },
                Functions.Blank);
        });
    };

    Enumerable.defer = function (enumerableFactory) {

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () { enumerator = Enumerable.from(enumerableFactory()).getEnumerator(); },
                function () {
                    return (enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : this.yieldBreak();
                },
                function () {
                    Utils.dispose(enumerator);
                });
        });
    };

    // Extension Methods

    /* Projection and Filtering Methods */

    // Overload:function(func)
    // Overload:function(func, resultSelector<element>)
    // Overload:function(func, resultSelector<element, nestLevel>)
    Enumerable.prototype.traverseBreadthFirst = function (func, resultSelector) {
        var source = this;
        func = Utils.createLambda(func);
        resultSelector = Utils.createLambda(resultSelector);

        return new Enumerable(function () {
            var enumerator;
            var nestLevel = 0;
            var buffer = [];

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    while (true) {
                        if (enumerator.moveNext()) {
                            buffer.push(enumerator.current());
                            return this.yieldReturn(resultSelector(enumerator.current(), nestLevel));
                        }

                        var next = Enumerable.from(buffer).selectMany(function (x) { return func(x); });
                        if (!next.any()) {
                            return false;
                        }
                        else {
                            nestLevel++;
                            buffer = [];
                            Utils.dispose(enumerator);
                            enumerator = next.getEnumerator();
                        }
                    }
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(func)
    // Overload:function(func, resultSelector<element>)
    // Overload:function(func, resultSelector<element, nestLevel>)
    Enumerable.prototype.traverseDepthFirst = function (func, resultSelector) {
        var source = this;
        func = Utils.createLambda(func);
        resultSelector = Utils.createLambda(resultSelector);

        return new Enumerable(function () {
            var enumeratorStack = [];
            var enumerator;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    while (true) {
                        if (enumerator.moveNext()) {
                            var value = resultSelector(enumerator.current(), enumeratorStack.length);
                            enumeratorStack.push(enumerator);
                            enumerator = Enumerable.from(func(enumerator.current())).getEnumerator();
                            return this.yieldReturn(value);
                        }

                        if (enumeratorStack.length <= 0) return false;
                        Utils.dispose(enumerator);
                        enumerator = enumeratorStack.pop();
                    }
                },
                function () {
                    try {
                        Utils.dispose(enumerator);
                    }
                    finally {
                        Enumerable.from(enumeratorStack).forEach(function (s) { s.dispose(); });
                    }
                });
        });
    };

    Enumerable.prototype.flatten = function () {
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var middleEnumerator = null;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    while (true) {
                        if (middleEnumerator != null) {
                            if (middleEnumerator.moveNext()) {
                                return this.yieldReturn(middleEnumerator.current());
                            }
                            else {
                                middleEnumerator = null;
                            }
                        }

                        if (enumerator.moveNext()) {
                            if (enumerator.current() instanceof Array) {
                                Utils.dispose(middleEnumerator);
                                middleEnumerator = Enumerable.from(enumerator.current())
                                    .selectMany(Functions.Identity)
                                    .flatten()
                                    .getEnumerator();
                                continue;
                            }
                            else {
                                return this.yieldReturn(enumerator.current());
                            }
                        }

                        return false;
                    }
                },
                function () {
                    try {
                        Utils.dispose(enumerator);
                    }
                    finally {
                        Utils.dispose(middleEnumerator);
                    }
                });
        });
    };

    Enumerable.prototype.pairwise = function (selector) {
        var source = this;
        selector = Utils.createLambda(selector);

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();
                    enumerator.moveNext();
                },
                function () {
                    var prev = enumerator.current();
                    return (enumerator.moveNext())
                        ? this.yieldReturn(selector(prev, enumerator.current()))
                        : false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(func)
    // Overload:function(seed,func<value,element>)
    Enumerable.prototype.scan = function (seed, func) {
        var isUseSeed;
        if (func == null) {
            func = Utils.createLambda(seed); // arguments[0]
            isUseSeed = false;
        } else {
            func = Utils.createLambda(func);
            isUseSeed = true;
        }
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var value;
            var isFirst = true;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    if (isFirst) {
                        isFirst = false;
                        if (!isUseSeed) {
                            if (enumerator.moveNext()) {
                                return this.yieldReturn(value = enumerator.current());
                            }
                        }
                        else {
                            return this.yieldReturn(value = seed);
                        }
                    }

                    return (enumerator.moveNext())
                        ? this.yieldReturn(value = func(value, enumerator.current()))
                        : false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(selector<element>)
    // Overload:function(selector<element,index>)
    Enumerable.prototype.select = function (selector) {
        selector = Utils.createLambda(selector);

        if (selector.length <= 1) {
            return new WhereSelectEnumerable(this, null, selector);
        }
        else {
            var source = this;

            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(
                    function () { enumerator = source.getEnumerator(); },
                    function () {
                        return (enumerator.moveNext())
                            ? this.yieldReturn(selector(enumerator.current(), index++))
                            : false;
                    },
                    function () { Utils.dispose(enumerator); });
            });
        }
    };

    // Overload:function(collectionSelector<element>)
    // Overload:function(collectionSelector<element,index>)
    // Overload:function(collectionSelector<element>,resultSelector)
    // Overload:function(collectionSelector<element,index>,resultSelector)
    Enumerable.prototype.selectMany = function (collectionSelector, resultSelector) {
        var source = this;
        collectionSelector = Utils.createLambda(collectionSelector);
        if (resultSelector == null) resultSelector = function (a, b) { return b; };
        resultSelector = Utils.createLambda(resultSelector);

        return new Enumerable(function () {
            var enumerator;
            var middleEnumerator = undefined;
            var index = 0;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    if (middleEnumerator === undefined) {
                        if (!enumerator.moveNext()) return false;
                    }
                    do {
                        if (middleEnumerator == null) {
                            var middleSeq = collectionSelector(enumerator.current(), index++);
                            middleEnumerator = Enumerable.from(middleSeq).getEnumerator();
                        }
                        if (middleEnumerator.moveNext()) {
                            return this.yieldReturn(resultSelector(enumerator.current(), middleEnumerator.current()));
                        }
                        Utils.dispose(middleEnumerator);
                        middleEnumerator = null;
                    } while (enumerator.moveNext());
                    return false;
                },
                function () {
                    try {
                        Utils.dispose(enumerator);
                    }
                    finally {
                        Utils.dispose(middleEnumerator);
                    }
                });
        });
    };

    // Overload:function(predicate<element>)
    // Overload:function(predicate<element,index>)
    Enumerable.prototype.where = function (predicate) {
        predicate = Utils.createLambda(predicate);

        if (predicate.length <= 1) {
            return new WhereEnumerable(this, predicate);
        }
        else {
            var source = this;

            return new Enumerable(function () {
                var enumerator;
                var index = 0;

                return new IEnumerator(
                    function () { enumerator = source.getEnumerator(); },
                    function () {
                        while (enumerator.moveNext()) {
                            if (predicate(enumerator.current(), index++)) {
                                return this.yieldReturn(enumerator.current());
                            }
                        }
                        return false;
                    },
                    function () { Utils.dispose(enumerator); });
            });
        }
    };


    // Overload:function(selector<element>)
    // Overload:function(selector<element,index>)
    Enumerable.prototype.choose = function (selector) {
        selector = Utils.createLambda(selector);
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var index = 0;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    while (enumerator.moveNext()) {
                        var result = selector(enumerator.current(), index++);
                        if (result != null) {
                            return this.yieldReturn(result);
                        }
                    }
                    return this.yieldBreak();
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    Enumerable.prototype.ofType = function (type) {
        var typeName;
        switch (type) {
            case Number:
                typeName = Types.Number;
                break;
            case String:
                typeName = Types.String;
                break;
            case Boolean:
                typeName = Types.Boolean;
                break;
            case Function:
                typeName = Types.Function;
                break;
            default:
                typeName = null;
                break;
        }
        return (typeName === null)
            ? this.where(function (x) { return x instanceof type; })
            : this.where(function (x) { return typeof x === typeName; });
    };

    // mutiple arguments, last one is selector, others are enumerable
    Enumerable.prototype.zip = function () {
        var args = arguments;
        var selector = Utils.createLambda(arguments[arguments.length - 1]);

        var source = this;
        // optimized case:argument is 2
        if (arguments.length == 2) {
            var second = arguments[0];

            return new Enumerable(function () {
                var firstEnumerator;
                var secondEnumerator;
                var index = 0;

                return new IEnumerator(
                function () {
                    firstEnumerator = source.getEnumerator();
                    secondEnumerator = Enumerable.from(second).getEnumerator();
                },
                function () {
                    if (firstEnumerator.moveNext() && secondEnumerator.moveNext()) {
                        return this.yieldReturn(selector(firstEnumerator.current(), secondEnumerator.current(), index++));
                    }
                    return false;
                },
                function () {
                    try {
                        Utils.dispose(firstEnumerator);
                    } finally {
                        Utils.dispose(secondEnumerator);
                    }
                });
            });
        }
        else {
            return new Enumerable(function () {
                var enumerators;
                var index = 0;

                return new IEnumerator(
                function () {
                    var array = Enumerable.make(source)
                        .concat(Enumerable.from(args).takeExceptLast().select(Enumerable.from))
                        .select(function (x) { return x.getEnumerator() })
                        .toArray();
                    enumerators = Enumerable.from(array);
                },
                function () {
                    if (enumerators.all(function (x) { return x.moveNext() })) {
                        var array = enumerators
                            .select(function (x) { return x.current() })
                            .toArray();
                        array.push(index++);
                        return this.yieldReturn(selector.apply(null, array));
                    }
                    else {
                        return this.yieldBreak();
                    }
                },
                function () {
                    Enumerable.from(enumerators).forEach(Utils.dispose);
                });
            });
        }
    };

    // mutiple arguments
    Enumerable.prototype.merge = function () {
        var args = arguments;
        var source = this;

        return new Enumerable(function () {
            var enumerators;
            var index = -1;

            return new IEnumerator(
                function () {
                    enumerators = Enumerable.make(source)
                        .concat(Enumerable.from(args).select(Enumerable.from))
                        .select(function (x) { return x.getEnumerator() })
                        .toArray();
                },
                function () {
                    while (enumerators.length > 0) {
                        index = (index >= enumerators.length - 1) ? 0 : index + 1;
                        var enumerator = enumerators[index];

                        if (enumerator.moveNext()) {
                            return this.yieldReturn(enumerator.current());
                        }
                        else {
                            enumerator.dispose();
                            enumerators.splice(index--, 1);
                        }
                    }
                    return this.yieldBreak();
                },
                function () {
                    Enumerable.from(enumerators).forEach(Utils.dispose);
                });
        });
    };

    /* Join Methods */

    // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector)
    // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector)
    Enumerable.prototype.join = function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector) {
        outerKeySelector = Utils.createLambda(outerKeySelector);
        innerKeySelector = Utils.createLambda(innerKeySelector);
        resultSelector = Utils.createLambda(resultSelector);
        compareSelector = Utils.createLambda(compareSelector);
        var source = this;

        return new Enumerable(function () {
            var outerEnumerator;
            var lookup;
            var innerElements = null;
            var innerCount = 0;

            return new IEnumerator(
                function () {
                    outerEnumerator = source.getEnumerator();
                    lookup = Enumerable.from(inner).toLookup(innerKeySelector, Functions.Identity, compareSelector);
                },
                function () {
                    while (true) {
                        if (innerElements != null) {
                            var innerElement = innerElements[innerCount++];
                            if (innerElement !== undefined) {
                                return this.yieldReturn(resultSelector(outerEnumerator.current(), innerElement));
                            }

                            innerElement = null;
                            innerCount = 0;
                        }

                        if (outerEnumerator.moveNext()) {
                            var key = outerKeySelector(outerEnumerator.current());
                            innerElements = lookup.get(key).toArray();
                        } else {
                            return false;
                        }
                    }
                },
                function () { Utils.dispose(outerEnumerator); });
        });
    };

    // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector)
    // Overload:function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector)
    Enumerable.prototype.groupJoin = function (inner, outerKeySelector, innerKeySelector, resultSelector, compareSelector) {
        outerKeySelector = Utils.createLambda(outerKeySelector);
        innerKeySelector = Utils.createLambda(innerKeySelector);
        resultSelector = Utils.createLambda(resultSelector);
        compareSelector = Utils.createLambda(compareSelector);
        var source = this;

        return new Enumerable(function () {
            var enumerator = source.getEnumerator();
            var lookup = null;

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();
                    lookup = Enumerable.from(inner).toLookup(innerKeySelector, Functions.Identity, compareSelector);
                },
                function () {
                    if (enumerator.moveNext()) {
                        var innerElement = lookup.get(outerKeySelector(enumerator.current()));
                        return this.yieldReturn(resultSelector(enumerator.current(), innerElement));
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    /* Set Methods */

    Enumerable.prototype.all = function (predicate) {
        predicate = Utils.createLambda(predicate);

        var result = true;
        this.forEach(function (x) {
            if (!predicate(x)) {
                result = false;
                return false; // break
            }
        });
        return result;
    };

    // Overload:function()
    // Overload:function(predicate)
    Enumerable.prototype.any = function (predicate) {
        predicate = Utils.createLambda(predicate);

        var enumerator = this.getEnumerator();
        try {
            if (arguments.length == 0) return enumerator.moveNext(); // case:function()

            while (enumerator.moveNext()) // case:function(predicate)
            {
                if (predicate(enumerator.current())) return true;
            }
            return false;
        }
        finally {
            Utils.dispose(enumerator);
        }
    };

    Enumerable.prototype.isEmpty = function () {
        return !this.any();
    };

    // multiple arguments
    Enumerable.prototype.concat = function () {
        var source = this;

        if (arguments.length == 1) {
            var second = arguments[0];

            return new Enumerable(function () {
                var firstEnumerator;
                var secondEnumerator;

                return new IEnumerator(
                function () { firstEnumerator = source.getEnumerator(); },
                function () {
                    if (secondEnumerator == null) {
                        if (firstEnumerator.moveNext()) return this.yieldReturn(firstEnumerator.current());
                        secondEnumerator = Enumerable.from(second).getEnumerator();
                    }
                    if (secondEnumerator.moveNext()) return this.yieldReturn(secondEnumerator.current());
                    return false;
                },
                function () {
                    try {
                        Utils.dispose(firstEnumerator);
                    }
                    finally {
                        Utils.dispose(secondEnumerator);
                    }
                });
            });
        }
        else {
            var args = arguments;

            return new Enumerable(function () {
                var enumerators;

                return new IEnumerator(
                    function () {
                        enumerators = Enumerable.make(source)
                            .concat(Enumerable.from(args).select(Enumerable.from))
                            .select(function (x) { return x.getEnumerator() })
                            .toArray();
                    },
                    function () {
                        while (enumerators.length > 0) {
                            var enumerator = enumerators[0];

                            if (enumerator.moveNext()) {
                                return this.yieldReturn(enumerator.current());
                            }
                            else {
                                enumerator.dispose();
                                enumerators.splice(0, 1);
                            }
                        }
                        return this.yieldBreak();
                    },
                    function () {
                        Enumerable.from(enumerators).forEach(Utils.dispose);
                    });
            });
        }
    };

    Enumerable.prototype.insert = function (index, second) {
        var source = this;

        return new Enumerable(function () {
            var firstEnumerator;
            var secondEnumerator;
            var count = 0;
            var isEnumerated = false;

            return new IEnumerator(
                function () {
                    firstEnumerator = source.getEnumerator();
                    secondEnumerator = Enumerable.from(second).getEnumerator();
                },
                function () {
                    if (count == index && secondEnumerator.moveNext()) {
                        isEnumerated = true;
                        return this.yieldReturn(secondEnumerator.current());
                    }
                    if (firstEnumerator.moveNext()) {
                        count++;
                        return this.yieldReturn(firstEnumerator.current());
                    }
                    if (!isEnumerated && secondEnumerator.moveNext()) {
                        return this.yieldReturn(secondEnumerator.current());
                    }
                    return false;
                },
                function () {
                    try {
                        Utils.dispose(firstEnumerator);
                    }
                    finally {
                        Utils.dispose(secondEnumerator);
                    }
                });
        });
    };

    Enumerable.prototype.alternate = function (alternateValueOrSequence) {
        var source = this;

        return new Enumerable(function () {
            var buffer;
            var enumerator;
            var alternateSequence;
            var alternateEnumerator;

            return new IEnumerator(
                function () {
                    if (alternateValueOrSequence instanceof Array || alternateValueOrSequence.getEnumerator != null) {
                        alternateSequence = Enumerable.from(Enumerable.from(alternateValueOrSequence).toArray()); // freeze
                    }
                    else {
                        alternateSequence = Enumerable.make(alternateValueOrSequence);
                    }
                    enumerator = source.getEnumerator();
                    if (enumerator.moveNext()) buffer = enumerator.current();
                },
                function () {
                    while (true) {
                        if (alternateEnumerator != null) {
                            if (alternateEnumerator.moveNext()) {
                                return this.yieldReturn(alternateEnumerator.current());
                            }
                            else {
                                alternateEnumerator = null;
                            }
                        }

                        if (buffer == null && enumerator.moveNext()) {
                            buffer = enumerator.current(); // hasNext
                            alternateEnumerator = alternateSequence.getEnumerator();
                            continue; // GOTO
                        }
                        else if (buffer != null) {
                            var retVal = buffer;
                            buffer = null;
                            return this.yieldReturn(retVal);
                        }

                        return this.yieldBreak();
                    }
                },
                function () {
                    try {
                        Utils.dispose(enumerator);
                    }
                    finally {
                        Utils.dispose(alternateEnumerator);
                    }
                });
        });
    };

    // Overload:function(value)
    // Overload:function(value, compareSelector)
    Enumerable.prototype.contains = function (value, compareSelector) {
        compareSelector = Utils.createLambda(compareSelector);
        var enumerator = this.getEnumerator();
        try {
            while (enumerator.moveNext()) {
                if (compareSelector(enumerator.current()) === value) return true;
            }
            return false;
        }
        finally {
            Utils.dispose(enumerator);
        }
    };

    Enumerable.prototype.defaultIfEmpty = function (defaultValue) {
        var source = this;
        if (defaultValue === undefined) defaultValue = null;

        return new Enumerable(function () {
            var enumerator;
            var isFirst = true;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    if (enumerator.moveNext()) {
                        isFirst = false;
                        return this.yieldReturn(enumerator.current());
                    }
                    else if (isFirst) {
                        isFirst = false;
                        return this.yieldReturn(defaultValue);
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function()
    // Overload:function(compareSelector)
    Enumerable.prototype.distinct = function (compareSelector) {
        return this.except(Enumerable.empty(), compareSelector);
    };

    Enumerable.prototype.distinctUntilChanged = function (compareSelector) {
        compareSelector = Utils.createLambda(compareSelector);
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var compareKey;
            var initial;

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();
                },
                function () {
                    while (enumerator.moveNext()) {
                        var key = compareSelector(enumerator.current());

                        if (initial) {
                            initial = false;
                            compareKey = key;
                            return this.yieldReturn(enumerator.current());
                        }

                        if (compareKey === key) {
                            continue;
                        }

                        compareKey = key;
                        return this.yieldReturn(enumerator.current());
                    }
                    return this.yieldBreak();
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(second)
    // Overload:function(second, compareSelector)
    Enumerable.prototype.except = function (second, compareSelector) {
        compareSelector = Utils.createLambda(compareSelector);
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var keys;

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();
                    keys = new Dictionary(compareSelector);
                    Enumerable.from(second).forEach(function (key) { keys.add(key); });
                },
                function () {
                    while (enumerator.moveNext()) {
                        var current = enumerator.current();
                        if (!keys.contains(current)) {
                            keys.add(current);
                            return this.yieldReturn(current);
                        }
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(second)
    // Overload:function(second, compareSelector)
    Enumerable.prototype.intersect = function (second, compareSelector) {
        compareSelector = Utils.createLambda(compareSelector);
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var keys;
            var outs;

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();

                    keys = new Dictionary(compareSelector);
                    Enumerable.from(second).forEach(function (key) { keys.add(key); });
                    outs = new Dictionary(compareSelector);
                },
                function () {
                    while (enumerator.moveNext()) {
                        var current = enumerator.current();
                        if (!outs.contains(current) && keys.contains(current)) {
                            outs.add(current);
                            return this.yieldReturn(current);
                        }
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(second)
    // Overload:function(second, compareSelector)
    Enumerable.prototype.sequenceEqual = function (second, compareSelector) {
        compareSelector = Utils.createLambda(compareSelector);

        var firstEnumerator = this.getEnumerator();
        try {
            var secondEnumerator = Enumerable.from(second).getEnumerator();
            try {
                while (firstEnumerator.moveNext()) {
                    if (!secondEnumerator.moveNext()
                    || compareSelector(firstEnumerator.current()) !== compareSelector(secondEnumerator.current())) {
                        return false;
                    }
                }

                if (secondEnumerator.moveNext()) return false;
                return true;
            }
            finally {
                Utils.dispose(secondEnumerator);
            }
        }
        finally {
            Utils.dispose(firstEnumerator);
        }
    };

    Enumerable.prototype.union = function (second, compareSelector) {
        compareSelector = Utils.createLambda(compareSelector);
        var source = this;

        return new Enumerable(function () {
            var firstEnumerator;
            var secondEnumerator;
            var keys;

            return new IEnumerator(
                function () {
                    firstEnumerator = source.getEnumerator();
                    keys = new Dictionary(compareSelector);
                },
                function () {
                    var current;
                    if (secondEnumerator === undefined) {
                        while (firstEnumerator.moveNext()) {
                            current = firstEnumerator.current();
                            if (!keys.contains(current)) {
                                keys.add(current);
                                return this.yieldReturn(current);
                            }
                        }
                        secondEnumerator = Enumerable.from(second).getEnumerator();
                    }
                    while (secondEnumerator.moveNext()) {
                        current = secondEnumerator.current();
                        if (!keys.contains(current)) {
                            keys.add(current);
                            return this.yieldReturn(current);
                        }
                    }
                    return false;
                },
                function () {
                    try {
                        Utils.dispose(firstEnumerator);
                    }
                    finally {
                        Utils.dispose(secondEnumerator);
                    }
                });
        });
    };

    /* Ordering Methods */

    Enumerable.prototype.orderBy = function (keySelector) {
        return new OrderedEnumerable(this, keySelector, false);
    };

    Enumerable.prototype.orderByDescending = function (keySelector) {
        return new OrderedEnumerable(this, keySelector, true);
    };

    Enumerable.prototype.reverse = function () {
        var source = this;

        return new Enumerable(function () {
            var buffer;
            var index;

            return new IEnumerator(
                function () {
                    buffer = source.toArray();
                    index = buffer.length;
                },
                function () {
                    return (index > 0)
                        ? this.yieldReturn(buffer[--index])
                        : false;
                },
                Functions.Blank);
        });
    };

    Enumerable.prototype.shuffle = function () {
        var source = this;

        return new Enumerable(function () {
            var buffer;

            return new IEnumerator(
                function () { buffer = source.toArray(); },
                function () {
                    if (buffer.length > 0) {
                        var i = Math.floor(Math.random() * buffer.length);
                        return this.yieldReturn(buffer.splice(i, 1)[0]);
                    }
                    return false;
                },
                Functions.Blank);
        });
    };

    Enumerable.prototype.weightedSample = function (weightSelector) {
        weightSelector = Utils.createLambda(weightSelector);
        var source = this;

        return new Enumerable(function () {
            var sortedByBound;
            var totalWeight = 0;

            return new IEnumerator(
                function () {
                    sortedByBound = source
                        .choose(function (x) {
                            var weight = weightSelector(x);
                            if (weight <= 0) return null; // ignore 0

                            totalWeight += weight;
                            return { value: x, bound: totalWeight };
                        })
                        .toArray();
                },
                function () {
                    if (sortedByBound.length > 0) {
                        var draw = Math.floor(Math.random() * totalWeight) + 1;

                        var lower = -1;
                        var upper = sortedByBound.length;
                        while (upper - lower > 1) {
                            var index = Math.floor((lower + upper) / 2);
                            if (sortedByBound[index].bound >= draw) {
                                upper = index;
                            }
                            else {
                                lower = index;
                            }
                        }

                        return this.yieldReturn(sortedByBound[upper].value);
                    }

                    return this.yieldBreak();
                },
                Functions.Blank);
        });
    };

    /* Grouping Methods */

    // Overload:function(keySelector)
    // Overload:function(keySelector,elementSelector)
    // Overload:function(keySelector,elementSelector,resultSelector)
    // Overload:function(keySelector,elementSelector,resultSelector,compareSelector)
    Enumerable.prototype.groupBy = function (keySelector, elementSelector, resultSelector, compareSelector) {
        var source = this;
        keySelector = Utils.createLambda(keySelector);
        elementSelector = Utils.createLambda(elementSelector);
        if (resultSelector != null) resultSelector = Utils.createLambda(resultSelector);
        compareSelector = Utils.createLambda(compareSelector);

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () {
                    enumerator = source.toLookup(keySelector, elementSelector, compareSelector)
                        .toEnumerable()
                        .getEnumerator();
                },
                function () {
                    while (enumerator.moveNext()) {
                        return (resultSelector == null)
                            ? this.yieldReturn(enumerator.current())
                            : this.yieldReturn(resultSelector(enumerator.current().key(), enumerator.current()));
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(keySelector)
    // Overload:function(keySelector,elementSelector)
    // Overload:function(keySelector,elementSelector,resultSelector)
    // Overload:function(keySelector,elementSelector,resultSelector,compareSelector)
    Enumerable.prototype.partitionBy = function (keySelector, elementSelector, resultSelector, compareSelector) {

        var source = this;
        keySelector = Utils.createLambda(keySelector);
        elementSelector = Utils.createLambda(elementSelector);
        compareSelector = Utils.createLambda(compareSelector);
        var hasResultSelector;
        if (resultSelector == null) {
            hasResultSelector = false;
            resultSelector = function (key, group) { return new Grouping(key, group); };
        }
        else {
            hasResultSelector = true;
            resultSelector = Utils.createLambda(resultSelector);
        }

        return new Enumerable(function () {
            var enumerator;
            var key;
            var compareKey;
            var group = [];

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();
                    if (enumerator.moveNext()) {
                        key = keySelector(enumerator.current());
                        compareKey = compareSelector(key);
                        group.push(elementSelector(enumerator.current()));
                    }
                },
                function () {
                    var hasNext;
                    while ((hasNext = enumerator.moveNext()) == true) {
                        if (compareKey === compareSelector(keySelector(enumerator.current()))) {
                            group.push(elementSelector(enumerator.current()));
                        }
                        else break;
                    }

                    if (group.length > 0) {
                        var result = (hasResultSelector)
                            ? resultSelector(key, Enumerable.from(group))
                            : resultSelector(key, group);
                        if (hasNext) {
                            key = keySelector(enumerator.current());
                            compareKey = compareSelector(key);
                            group = [elementSelector(enumerator.current())];
                        }
                        else group = [];

                        return this.yieldReturn(result);
                    }

                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    Enumerable.prototype.buffer = function (count) {
        var source = this;

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    var array = [];
                    var index = 0;
                    while (enumerator.moveNext()) {
                        array.push(enumerator.current());
                        if (++index >= count) return this.yieldReturn(array);
                    }
                    if (array.length > 0) return this.yieldReturn(array);
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    /* Aggregate Methods */

    // Overload:function(func)
    // Overload:function(seed,func)
    // Overload:function(seed,func,resultSelector)
    Enumerable.prototype.aggregate = function (seed, func, resultSelector) {
        resultSelector = Utils.createLambda(resultSelector);
        return resultSelector(this.scan(seed, func, resultSelector).last());
    };

    // Overload:function()
    // Overload:function(selector)
    Enumerable.prototype.average = function (selector) {
        selector = Utils.createLambda(selector);

        var sum = 0;
        var count = 0;
        this.forEach(function (x) {
            sum += selector(x);
            ++count;
        });

        return sum / count;
    };

    // Overload:function()
    // Overload:function(predicate)
    Enumerable.prototype.count = function (predicate) {
        predicate = (predicate == null) ? Functions.True : Utils.createLambda(predicate);

        var count = 0;
        this.forEach(function (x, i) {
            if (predicate(x, i))++count;
        });
        return count;
    };

    // Overload:function()
    // Overload:function(selector)
    Enumerable.prototype.max = function (selector) {
        if (selector == null) selector = Functions.Identity;
        return this.select(selector).aggregate(function (a, b) { return (a > b) ? a : b; });
    };

    // Overload:function()
    // Overload:function(selector)
    Enumerable.prototype.min = function (selector) {
        if (selector == null) selector = Functions.Identity;
        return this.select(selector).aggregate(function (a, b) { return (a < b) ? a : b; });
    };

    Enumerable.prototype.maxBy = function (keySelector) {
        keySelector = Utils.createLambda(keySelector);
        return this.aggregate(function (a, b) { return (keySelector(a) > keySelector(b)) ? a : b; });
    };

    Enumerable.prototype.minBy = function (keySelector) {
        keySelector = Utils.createLambda(keySelector);
        return this.aggregate(function (a, b) { return (keySelector(a) < keySelector(b)) ? a : b; });
    };

    // Overload:function()
    // Overload:function(selector)
    Enumerable.prototype.sum = function (selector) {
        if (selector == null) selector = Functions.Identity;
        return this.select(selector).aggregate(0, function (a, b) { return a + b; });
    };

    /* Paging Methods */

    Enumerable.prototype.elementAt = function (index) {
        var value;
        var found = false;
        this.forEach(function (x, i) {
            if (i == index) {
                value = x;
                found = true;
                return false;
            }
        });

        if (!found) throw new Error("index is less than 0 or greater than or equal to the number of elements in source.");
        return value;
    };

    Enumerable.prototype.elementAtOrDefault = function (index, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        var value;
        var found = false;
        this.forEach(function (x, i) {
            if (i == index) {
                value = x;
                found = true;
                return false;
            }
        });

        return (!found) ? defaultValue : value;
    };

    // Overload:function()
    // Overload:function(predicate)
    Enumerable.prototype.first = function (predicate) {
        if (predicate != null) return this.where(predicate).first();

        var value;
        var found = false;
        this.forEach(function (x) {
            value = x;
            found = true;
            return false;
        });

        if (!found) throw new Error("first:No element satisfies the condition.");
        return value;
    };

    Enumerable.prototype.firstOrDefault = function (predicate, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        if (predicate != null) return this.where(predicate).firstOrDefault(null, defaultValue);

        var value;
        var found = false;
        this.forEach(function (x) {
            value = x;
            found = true;
            return false;
        });
        return (!found) ? defaultValue : value;
    };

    // Overload:function()
    // Overload:function(predicate)
    Enumerable.prototype.last = function (predicate) {
        if (predicate != null) return this.where(predicate).last();

        var value;
        var found = false;
        this.forEach(function (x) {
            found = true;
            value = x;
        });

        if (!found) throw new Error("last:No element satisfies the condition.");
        return value;
    };

    // Overload:function(defaultValue)
    // Overload:function(defaultValue,predicate)
    Enumerable.prototype.lastOrDefault = function (predicate, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        if (predicate != null) return this.where(predicate).lastOrDefault(null, defaultValue);

        var value;
        var found = false;
        this.forEach(function (x) {
            found = true;
            value = x;
        });
        return (!found) ? defaultValue : value;
    };

    // Overload:function()
    // Overload:function(predicate)
    Enumerable.prototype.single = function (predicate) {
        if (predicate != null) return this.where(predicate).single();

        var value;
        var found = false;
        this.forEach(function (x) {
            if (!found) {
                found = true;
                value = x;
            } else throw new Error("single:sequence contains more than one element.");
        });

        if (!found) throw new Error("single:No element satisfies the condition.");
        return value;
    };

    // Overload:function(defaultValue)
    // Overload:function(defaultValue,predicate)
    Enumerable.prototype.singleOrDefault = function (predicate, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        if (predicate != null) return this.where(predicate).singleOrDefault(null, defaultValue);

        var value;
        var found = false;
        this.forEach(function (x) {
            if (!found) {
                found = true;
                value = x;
            } else throw new Error("single:sequence contains more than one element.");
        });

        return (!found) ? defaultValue : value;
    };

    Enumerable.prototype.skip = function (count) {
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var index = 0;

            return new IEnumerator(
                function () {
                    enumerator = source.getEnumerator();
                    while (index++ < count && enumerator.moveNext()) {
                    }
                    ;
                },
                function () {
                    return (enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(predicate<element>)
    // Overload:function(predicate<element,index>)
    Enumerable.prototype.skipWhile = function (predicate) {
        predicate = Utils.createLambda(predicate);
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var index = 0;
            var isSkipEnd = false;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    while (!isSkipEnd) {
                        if (enumerator.moveNext()) {
                            if (!predicate(enumerator.current(), index++)) {
                                isSkipEnd = true;
                                return this.yieldReturn(enumerator.current());
                            }
                            continue;
                        } else return false;
                    }

                    return (enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : false;

                },
                function () { Utils.dispose(enumerator); });
        });
    };

    Enumerable.prototype.take = function (count) {
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var index = 0;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    return (index++ < count && enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : false;
                },
                function () { Utils.dispose(enumerator); }
            );
        });
    };

    // Overload:function(predicate<element>)
    // Overload:function(predicate<element,index>)
    Enumerable.prototype.takeWhile = function (predicate) {
        predicate = Utils.createLambda(predicate);
        var source = this;

        return new Enumerable(function () {
            var enumerator;
            var index = 0;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    return (enumerator.moveNext() && predicate(enumerator.current(), index++))
                        ? this.yieldReturn(enumerator.current())
                        : false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function()
    // Overload:function(count)
    Enumerable.prototype.takeExceptLast = function (count) {
        if (count == null) count = 1;
        var source = this;

        return new Enumerable(function () {
            if (count <= 0) return source.getEnumerator(); // do nothing

            var enumerator;
            var q = [];

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    while (enumerator.moveNext()) {
                        if (q.length == count) {
                            q.push(enumerator.current());
                            return this.yieldReturn(q.shift());
                        }
                        q.push(enumerator.current());
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    Enumerable.prototype.takeFromLast = function (count) {
        if (count <= 0 || count == null) return Enumerable.empty();
        var source = this;

        return new Enumerable(function () {
            var sourceEnumerator;
            var enumerator;
            var q = [];

            return new IEnumerator(
                function () { sourceEnumerator = source.getEnumerator(); },
                function () {
                    while (sourceEnumerator.moveNext()) {
                        if (q.length == count) q.shift();
                        q.push(sourceEnumerator.current());
                    }
                    if (enumerator == null) {
                        enumerator = Enumerable.from(q).getEnumerator();
                    }
                    return (enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(item)
    // Overload:function(predicate)
    Enumerable.prototype.indexOf = function (item) {
        var found = null;

        // item as predicate
        if (typeof (item) === Types.Function) {
            this.forEach(function (x, i) {
                if (item(x, i)) {
                    found = i;
                    return false;
                }
            });
        }
        else {
            this.forEach(function (x, i) {
                if (x === item) {
                    found = i;
                    return false;
                }
            });
        }

        return (found !== null) ? found : -1;
    };

    // Overload:function(item)
    // Overload:function(predicate)
    Enumerable.prototype.lastIndexOf = function (item) {
        var result = -1;

        // item as predicate
        if (typeof (item) === Types.Function) {
            this.forEach(function (x, i) {
                if (item(x, i)) result = i;
            });
        }
        else {
            this.forEach(function (x, i) {
                if (x === item) result = i;
            });
        }

        return result;
    };

    /* Convert Methods */

    Enumerable.prototype.cast = function () {
        return this;
    };

    Enumerable.prototype.asEnumerable = function () {
        return Enumerable.from(this);
    };

    Enumerable.prototype.toArray = function () {
        var array = [];
        this.forEach(function (x) { array.push(x); });
        return array;
    };

    // Overload:function(keySelector)
    // Overload:function(keySelector, elementSelector)
    // Overload:function(keySelector, elementSelector, compareSelector)
    Enumerable.prototype.toLookup = function (keySelector, elementSelector, compareSelector) {
        keySelector = Utils.createLambda(keySelector);
        elementSelector = Utils.createLambda(elementSelector);
        compareSelector = Utils.createLambda(compareSelector);

        var dict = new Dictionary(compareSelector);
        this.forEach(function (x) {
            var key = keySelector(x);
            var element = elementSelector(x);

            var array = dict.get(key);
            if (array !== undefined) array.push(element);
            else dict.add(key, [element]);
        });
        return new Lookup(dict);
    };

    Enumerable.prototype.toObject = function (keySelector, elementSelector) {
        keySelector = Utils.createLambda(keySelector);
        elementSelector = Utils.createLambda(elementSelector);

        var obj = {};
        this.forEach(function (x) {
            obj[keySelector(x)] = elementSelector(x);
        });
        return obj;
    };

    // Overload:function(keySelector, elementSelector)
    // Overload:function(keySelector, elementSelector, compareSelector)
    Enumerable.prototype.toDictionary = function (keySelector, elementSelector, compareSelector) {
        keySelector = Utils.createLambda(keySelector);
        elementSelector = Utils.createLambda(elementSelector);
        compareSelector = Utils.createLambda(compareSelector);

        var dict = new Dictionary(compareSelector);
        this.forEach(function (x) {
            dict.add(keySelector(x), elementSelector(x));
        });
        return dict;
    };

    // Overload:function()
    // Overload:function(replacer)
    // Overload:function(replacer, space)
    Enumerable.prototype.toJSONString = function (replacer, space) {
        if (typeof JSON === Types.Undefined || JSON.stringify == null) {
            throw new Error("toJSONString can't find JSON.stringify. This works native JSON support Browser or include json2.js");
        }
        return JSON.stringify(this.toArray(), replacer, space);
    };

    // Overload:function()
    // Overload:function(separator)
    // Overload:function(separator,selector)
    Enumerable.prototype.toJoinedString = function (separator, selector) {
        if (separator == null) separator = "";
        if (selector == null) selector = Functions.Identity;

        return this.select(selector).toArray().join(separator);
    };


    /* Action Methods */

    // Overload:function(action<element>)
    // Overload:function(action<element,index>)
    Enumerable.prototype.doAction = function (action) {
        var source = this;
        action = Utils.createLambda(action);

        return new Enumerable(function () {
            var enumerator;
            var index = 0;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    if (enumerator.moveNext()) {
                        action(enumerator.current(), index++);
                        return this.yieldReturn(enumerator.current());
                    }
                    return false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    // Overload:function(action<element>)
    // Overload:function(action<element,index>)
    // Overload:function(func<element,bool>)
    // Overload:function(func<element,index,bool>)
    Enumerable.prototype.forEach = function (action) {
        action = Utils.createLambda(action);

        var index = 0;
        var enumerator = this.getEnumerator();
        try {
            while (enumerator.moveNext()) {
                if (action(enumerator.current(), index++) === false) break;
            }
        } finally {
            Utils.dispose(enumerator);
        }
    };

    // Overload:function()
    // Overload:function(separator)
    // Overload:function(separator,selector)
    Enumerable.prototype.write = function (separator, selector) {
        if (separator == null) separator = "";
        selector = Utils.createLambda(selector);

        var isFirst = true;
        this.forEach(function (item) {
            if (isFirst) isFirst = false;
            else document.write(separator);
            document.write(selector(item));
        });
    };

    // Overload:function()
    // Overload:function(selector)
    Enumerable.prototype.writeLine = function (selector) {
        selector = Utils.createLambda(selector);

        this.forEach(function (item) {
            document.writeln(selector(item) + "<br />");
        });
    };

    Enumerable.prototype.force = function () {
        var enumerator = this.getEnumerator();

        try {
            while (enumerator.moveNext()) {
            }
        }
        finally {
            Utils.dispose(enumerator);
        }
    };

    /* Functional Methods */

    Enumerable.prototype.letBind = function (func) {
        func = Utils.createLambda(func);
        var source = this;

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () {
                    enumerator = Enumerable.from(func(source)).getEnumerator();
                },
                function () {
                    return (enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : false;
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    Enumerable.prototype.share = function () {
        var source = this;
        var sharedEnumerator;
        var disposed = false;

        return new DisposableEnumerable(function () {
            return new IEnumerator(
                function () {
                    if (sharedEnumerator == null) {
                        sharedEnumerator = source.getEnumerator();
                    }
                },
                function () {
                    if (disposed) throw new Error("enumerator is disposed");

                    return (sharedEnumerator.moveNext())
                        ? this.yieldReturn(sharedEnumerator.current())
                        : false;
                },
                Functions.Blank
            );
        }, function () {
            disposed = true;
            Utils.dispose(sharedEnumerator);
        });
    };

    Enumerable.prototype.memoize = function () {
        var source = this;
        var cache;
        var enumerator;
        var disposed = false;

        return new DisposableEnumerable(function () {
            var index = -1;

            return new IEnumerator(
                function () {
                    if (enumerator == null) {
                        enumerator = source.getEnumerator();
                        cache = [];
                    }
                },
                function () {
                    if (disposed) throw new Error("enumerator is disposed");

                    index++;
                    if (cache.length <= index) {
                        return (enumerator.moveNext())
                            ? this.yieldReturn(cache[index] = enumerator.current())
                            : false;
                    }

                    return this.yieldReturn(cache[index]);
                },
                Functions.Blank
            );
        }, function () {
            disposed = true;
            Utils.dispose(enumerator);
            cache = null;
        });
    };

    /* Error Handling Methods */

    Enumerable.prototype.catchError = function (handler) {
        handler = Utils.createLambda(handler);
        var source = this;

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    try {
                        return (enumerator.moveNext())
                            ? this.yieldReturn(enumerator.current())
                            : false;
                    } catch (e) {
                        handler(e);
                        return false;
                    }
                },
                function () { Utils.dispose(enumerator); });
        });
    };

    Enumerable.prototype.finallyAction = function (finallyAction) {
        finallyAction = Utils.createLambda(finallyAction);
        var source = this;

        return new Enumerable(function () {
            var enumerator;

            return new IEnumerator(
                function () { enumerator = source.getEnumerator(); },
                function () {
                    return (enumerator.moveNext())
                        ? this.yieldReturn(enumerator.current())
                        : false;
                },
                function () {
                    try {
                        Utils.dispose(enumerator);
                    } finally {
                        finallyAction();
                    }
                });
        });
    };

    /* For Debug Methods */

    // Overload:function()
    // Overload:function(selector)
    Enumerable.prototype.log = function (selector) {
        selector = Utils.createLambda(selector);

        return this.doAction(function (item) {
            if (typeof console !== Types.Undefined) {
                console.log(selector(item));
            }
        });
    };

    // Overload:function()
    // Overload:function(message)
    // Overload:function(message,selector)
    Enumerable.prototype.trace = function (message, selector) {
        if (message == null) message = "Trace";
        selector = Utils.createLambda(selector);

        return this.doAction(function (item) {
            if (typeof console !== Types.Undefined) {
                console.log(message, selector(item));
            }
        });
    };

    // private

    var OrderedEnumerable = function (source, keySelector, descending, parent) {
        this.source = source;
        this.keySelector = Utils.createLambda(keySelector);
        this.descending = descending;
        this.parent = parent;
    };
    OrderedEnumerable.prototype = new Enumerable();

    OrderedEnumerable.prototype.createOrderedEnumerable = function (keySelector, descending) {
        return new OrderedEnumerable(this.source, keySelector, descending, this);
    };

    OrderedEnumerable.prototype.thenBy = function (keySelector) {
        return this.createOrderedEnumerable(keySelector, false);
    };

    OrderedEnumerable.prototype.thenByDescending = function (keySelector) {
        return this.createOrderedEnumerable(keySelector, true);
    };

    OrderedEnumerable.prototype.getEnumerator = function () {
        var self = this;
        var buffer;
        var indexes;
        var index = 0;

        return new IEnumerator(
            function () {
                buffer = [];
                indexes = [];
                self.source.forEach(function (item, index) {
                    buffer.push(item);
                    indexes.push(index);
                });
                var sortContext = SortContext.create(self, null);
                sortContext.GenerateKeys(buffer);

                indexes.sort(function (a, b) { return sortContext.compare(a, b); });
            },
            function () {
                return (index < indexes.length)
                    ? this.yieldReturn(buffer[indexes[index++]])
                    : false;
            },
            Functions.Blank
        );
    };

    var SortContext = function (keySelector, descending, child) {
        this.keySelector = keySelector;
        this.descending = descending;
        this.child = child;
        this.keys = null;
    };

    SortContext.create = function (orderedEnumerable, currentContext) {
        var context = new SortContext(orderedEnumerable.keySelector, orderedEnumerable.descending, currentContext);
        if (orderedEnumerable.parent != null) return SortContext.create(orderedEnumerable.parent, context);
        return context;
    };

    SortContext.prototype.GenerateKeys = function (source) {
        var len = source.length;
        var keySelector = this.keySelector;
        var keys = new Array(len);
        for (var i = 0; i < len; i++) keys[i] = keySelector(source[i]);
        this.keys = keys;

        if (this.child != null) this.child.GenerateKeys(source);
    };

    SortContext.prototype.compare = function (index1, index2) {
        var comparison = Utils.compare(this.keys[index1], this.keys[index2]);

        if (comparison == 0) {
            if (this.child != null) return this.child.compare(index1, index2);
            return Utils.compare(index1, index2);
        }

        return (this.descending) ? -comparison : comparison;
    };

    var DisposableEnumerable = function (getEnumerator, dispose) {
        this.dispose = dispose;
        Enumerable.call(this, getEnumerator);
    };
    DisposableEnumerable.prototype = new Enumerable();

    // optimize array or arraylike object

    var ArrayEnumerable = function (source) {
        this.getSource = function () { return source; };
    };
    ArrayEnumerable.prototype = new Enumerable();

    ArrayEnumerable.prototype.any = function (predicate) {
        return (predicate == null)
            ? (this.getSource().length > 0)
            : Enumerable.prototype.any.apply(this, arguments);
    };

    ArrayEnumerable.prototype.count = function (predicate) {
        return (predicate == null)
            ? this.getSource().length
            : Enumerable.prototype.count.apply(this, arguments);
    };

    ArrayEnumerable.prototype.elementAt = function (index) {
        var source = this.getSource();
        return (0 <= index && index < source.length)
            ? source[index]
            : Enumerable.prototype.elementAt.apply(this, arguments);
    };

    ArrayEnumerable.prototype.elementAtOrDefault = function (index, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        var source = this.getSource();
        return (0 <= index && index < source.length)
            ? source[index]
            : defaultValue;
    };

    ArrayEnumerable.prototype.first = function (predicate) {
        var source = this.getSource();
        return (predicate == null && source.length > 0)
            ? source[0]
            : Enumerable.prototype.first.apply(this, arguments);
    };

    ArrayEnumerable.prototype.firstOrDefault = function (predicate, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        if (predicate != null) {
            return Enumerable.prototype.firstOrDefault.apply(this, arguments);
        }

        var source = this.getSource();
        return source.length > 0 ? source[0] : defaultValue;
    };

    ArrayEnumerable.prototype.last = function (predicate) {
        var source = this.getSource();
        return (predicate == null && source.length > 0)
            ? source[source.length - 1]
            : Enumerable.prototype.last.apply(this, arguments);
    };

    ArrayEnumerable.prototype.lastOrDefault = function (predicate, defaultValue) {
        if (defaultValue === undefined) defaultValue = null;
        if (predicate != null) {
            return Enumerable.prototype.lastOrDefault.apply(this, arguments);
        }

        var source = this.getSource();
        return source.length > 0 ? source[source.length - 1] : defaultValue;
    };

    ArrayEnumerable.prototype.skip = function (count) {
        var source = this.getSource();

        return new Enumerable(function () {
            var index;

            return new IEnumerator(
                function () { index = (count < 0) ? 0 : count; },
                function () {
                    return (index < source.length)
                        ? this.yieldReturn(source[index++])
                        : false;
                },
                Functions.Blank);
        });
    };

    ArrayEnumerable.prototype.takeExceptLast = function (count) {
        if (count == null) count = 1;
        return this.take(this.getSource().length - count);
    };

    ArrayEnumerable.prototype.takeFromLast = function (count) {
        return this.skip(this.getSource().length - count);
    };

    ArrayEnumerable.prototype.reverse = function () {
        var source = this.getSource();

        return new Enumerable(function () {
            var index;

            return new IEnumerator(
                function () {
                    index = source.length;
                },
                function () {
                    return (index > 0)
                        ? this.yieldReturn(source[--index])
                        : false;
                },
                Functions.Blank);
        });
    };

    ArrayEnumerable.prototype.sequenceEqual = function (second, compareSelector) {
        if ((second instanceof ArrayEnumerable || second instanceof Array)
            && compareSelector == null
            && Enumerable.from(second).count() != this.count()) {
            return false;
        }

        return Enumerable.prototype.sequenceEqual.apply(this, arguments);
    };

    ArrayEnumerable.prototype.toJoinedString = function (separator, selector) {
        var source = this.getSource();
        if (selector != null || !(source instanceof Array)) {
            return Enumerable.prototype.toJoinedString.apply(this, arguments);
        }

        if (separator == null) separator = "";
        return source.join(separator);
    };

    ArrayEnumerable.prototype.getEnumerator = function () {
        var source = this.getSource();
        var index = -1;

        // fast and simple enumerator
        return {
            current: function () { return source[index]; },
            moveNext: function () {
                return ++index < source.length;
            },
            dispose: Functions.Blank
        };
    };

    // optimization for multiple where and multiple select and whereselect

    var WhereEnumerable = function (source, predicate) {
        this.prevSource = source;
        this.prevPredicate = predicate; // predicate.length always <= 1
    };
    WhereEnumerable.prototype = new Enumerable();

    WhereEnumerable.prototype.where = function (predicate) {
        predicate = Utils.createLambda(predicate);

        if (predicate.length <= 1) {
            var prevPredicate = this.prevPredicate;
            var composedPredicate = function (x) { return prevPredicate(x) && predicate(x); };
            return new WhereEnumerable(this.prevSource, composedPredicate);
        }
        else {
            // if predicate use index, can't compose
            return Enumerable.prototype.where.call(this, predicate);
        }
    };

    WhereEnumerable.prototype.select = function (selector) {
        selector = Utils.createLambda(selector);

        return (selector.length <= 1)
            ? new WhereSelectEnumerable(this.prevSource, this.prevPredicate, selector)
            : Enumerable.prototype.select.call(this, selector);
    };

    WhereEnumerable.prototype.getEnumerator = function () {
        var predicate = this.prevPredicate;
        var source = this.prevSource;
        var enumerator;

        return new IEnumerator(
            function () { enumerator = source.getEnumerator(); },
            function () {
                while (enumerator.moveNext()) {
                    if (predicate(enumerator.current())) {
                        return this.yieldReturn(enumerator.current());
                    }
                }
                return false;
            },
            function () { Utils.dispose(enumerator); });
    };

    var WhereSelectEnumerable = function (source, predicate, selector) {
        this.prevSource = source;
        this.prevPredicate = predicate; // predicate.length always <= 1 or null
        this.prevSelector = selector; // selector.length always <= 1
    };
    WhereSelectEnumerable.prototype = new Enumerable();

    WhereSelectEnumerable.prototype.where = function (predicate) {
        predicate = Utils.createLambda(predicate);

        return (predicate.length <= 1)
            ? new WhereEnumerable(this, predicate)
            : Enumerable.prototype.where.call(this, predicate);
    };

    WhereSelectEnumerable.prototype.select = function (selector) {
        selector = Utils.createLambda(selector);

        if (selector.length <= 1) {
            var prevSelector = this.prevSelector;
            var composedSelector = function (x) { return selector(prevSelector(x)); };
            return new WhereSelectEnumerable(this.prevSource, this.prevPredicate, composedSelector);
        }
        else {
            // if selector use index, can't compose
            return Enumerable.prototype.select.call(this, selector);
        }
    };

    WhereSelectEnumerable.prototype.getEnumerator = function () {
        var predicate = this.prevPredicate;
        var selector = this.prevSelector;
        var source = this.prevSource;
        var enumerator;

        return new IEnumerator(
            function () { enumerator = source.getEnumerator(); },
            function () {
                while (enumerator.moveNext()) {
                    if (predicate == null || predicate(enumerator.current())) {
                        return this.yieldReturn(selector(enumerator.current()));
                    }
                }
                return false;
            },
            function () { Utils.dispose(enumerator); });
    };

    // Collections

    var Dictionary = (function () {
        // static utility methods
        var callHasOwnProperty = function (target, key) {
            return Object.prototype.hasOwnProperty.call(target, key);
        };

        var computeHashCode = function (obj) {
            if (obj === null) return "null";
            if (obj === undefined) return "undefined";

            return (typeof obj.toString === Types.Function)
                ? obj.toString()
                : Object.prototype.toString.call(obj);
        };

        // LinkedList for Dictionary
        var HashEntry = function (key, value) {
            this.key = key;
            this.value = value;
            this.prev = null;
            this.next = null;
        };

        var EntryList = function () {
            this.first = null;
            this.last = null;
        };
        EntryList.prototype =
        {
            addLast: function (entry) {
                if (this.last != null) {
                    this.last.next = entry;
                    entry.prev = this.last;
                    this.last = entry;
                } else this.first = this.last = entry;
            },

            replace: function (entry, newEntry) {
                if (entry.prev != null) {
                    entry.prev.next = newEntry;
                    newEntry.prev = entry.prev;
                } else this.first = newEntry;

                if (entry.next != null) {
                    entry.next.prev = newEntry;
                    newEntry.next = entry.next;
                } else this.last = newEntry;

            },

            remove: function (entry) {
                if (entry.prev != null) entry.prev.next = entry.next;
                else this.first = entry.next;

                if (entry.next != null) entry.next.prev = entry.prev;
                else this.last = entry.prev;
            }
        };

        // Overload:function()
        // Overload:function(compareSelector)
        var Dictionary = function (compareSelector) {
            this.countField = 0;
            this.entryList = new EntryList();
            this.buckets = {}; // as Dictionary<string,List<object>>
            this.compareSelector = (compareSelector == null) ? Functions.Identity : compareSelector;
        };
        Dictionary.prototype =
        {
            add: function (key, value) {
                var compareKey = this.compareSelector(key);
                var hash = computeHashCode(compareKey);
                var entry = new HashEntry(key, value);
                if (callHasOwnProperty(this.buckets, hash)) {
                    var array = this.buckets[hash];
                    for (var i = 0; i < array.length; i++) {
                        if (this.compareSelector(array[i].key) === compareKey) {
                            this.entryList.replace(array[i], entry);
                            array[i] = entry;
                            return;
                        }
                    }
                    array.push(entry);
                } else {
                    this.buckets[hash] = [entry];
                }
                this.countField++;
                this.entryList.addLast(entry);
            },

            get: function (key) {
                var compareKey = this.compareSelector(key);
                var hash = computeHashCode(compareKey);
                if (!callHasOwnProperty(this.buckets, hash)) return undefined;

                var array = this.buckets[hash];
                for (var i = 0; i < array.length; i++) {
                    var entry = array[i];
                    if (this.compareSelector(entry.key) === compareKey) return entry.value;
                }
                return undefined;
            },

            set: function (key, value) {
                var compareKey = this.compareSelector(key);
                var hash = computeHashCode(compareKey);
                if (callHasOwnProperty(this.buckets, hash)) {
                    var array = this.buckets[hash];
                    for (var i = 0; i < array.length; i++) {
                        if (this.compareSelector(array[i].key) === compareKey) {
                            var newEntry = new HashEntry(key, value);
                            this.entryList.replace(array[i], newEntry);
                            array[i] = newEntry;
                            return true;
                        }
                    }
                }
                return false;
            },

            contains: function (key) {
                var compareKey = this.compareSelector(key);
                var hash = computeHashCode(compareKey);
                if (!callHasOwnProperty(this.buckets, hash)) return false;

                var array = this.buckets[hash];
                for (var i = 0; i < array.length; i++) {
                    if (this.compareSelector(array[i].key) === compareKey) return true;
                }
                return false;
            },

            clear: function () {
                this.countField = 0;
                this.buckets = {};
                this.entryList = new EntryList();
            },

            remove: function (key) {
                var compareKey = this.compareSelector(key);
                var hash = computeHashCode(compareKey);
                if (!callHasOwnProperty(this.buckets, hash)) return;

                var array = this.buckets[hash];
                for (var i = 0; i < array.length; i++) {
                    if (this.compareSelector(array[i].key) === compareKey) {
                        this.entryList.remove(array[i]);
                        array.splice(i, 1);
                        if (array.length == 0) delete this.buckets[hash];
                        this.countField--;
                        return;
                    }
                }
            },

            count: function () {
                return this.countField;
            },

            toEnumerable: function () {
                var self = this;
                return new Enumerable(function () {
                    var currentEntry;

                    return new IEnumerator(
                        function () { currentEntry = self.entryList.first; },
                        function () {
                            if (currentEntry != null) {
                                var result = { key: currentEntry.key, value: currentEntry.value };
                                currentEntry = currentEntry.next;
                                return this.yieldReturn(result);
                            }
                            return false;
                        },
                        Functions.Blank);
                });
            }
        };

        return Dictionary;
    })();

    // dictionary = Dictionary<TKey, TValue[]>
    var Lookup = function (dictionary) {
        this.count = function () {
            return dictionary.count();
        };
        this.get = function (key) {
            return Enumerable.from(dictionary.get(key));
        };
        this.contains = function (key) {
            return dictionary.contains(key);
        };
        this.toEnumerable = function () {
            return dictionary.toEnumerable().select(function (kvp) {
                return new Grouping(kvp.key, kvp.value);
            });
        };
    };

    var Grouping = function (groupKey, elements) {
        this.key = function () {
            return groupKey;
        };
        ArrayEnumerable.call(this, elements);
    };
    Grouping.prototype = new ArrayEnumerable();

    // module export
    if (typeof define === Types.Function && define.amd) { // AMD
        define("linqjs", [], function () { return Enumerable; });
    }
    else if (typeof module !== Types.Undefined && module.exports) { // Node
        module.exports = Enumerable;
    }
    else {
        root.Enumerable = Enumerable;
    }
})(this);
define("scalejs.linq-linqjs",["scalejs!core","linqjs"],function(a,b){b.Utils.extendTo(Array),a.registerExtension({linq:{enumerable:b}})});
define("scalejs.statechart-scion/state.builder",["scalejs!core","scion-ng"],function(a,b){return function(c){function d(a){return A(function(b){if(b.onEntry)throw new Error("Only one `onEntry` action is allowed.");if("function"!=typeof a)throw new Error("`onEntry` takes a function as a parameter.");return b.onEntry=a,b})}function e(a){return A(function(b){if(b.onExit)throw new Error("Only one `onExit` action is allowed.");if("function"!=typeof a)throw new Error("`onExit` takes a function as a parameter.");return b.onExit=a,b})}function f(a){return A(function(b){b.event=a})}function g(a){return A(function(b){b.cond=a})}function h(a,b,c){return A(function(d){return"state"===d.type||"parallel"===d.type?u(h(a,b,c))(d):(a&&(d.type="internal"),void("function"==typeof b?d.onTransition=b:(d.target=x(b,"array")?b:b.split(" "),c&&(d.onTransition=c))))})}function i(a,b){return h(!1,a,b)}function j(a,b){return h(!0,a,b)}function k(a){if("function"==typeof a)return A(function(b){b.onTransition=a});if("$yield"===a.kind)return a;throw new Error("Unsupported transition action",a)}function l(){var a,b=v.copy(arguments),c=b.pop();if(b.length>2)throw new Error("First (optional) argument should be event name, second (optional) argument should be a condition function");if("function"!=typeof c&&"$yield"!==c.kind)throw new Error("Last argument should be either `goto` or a function.");return a=b.map(function(a){if("string"==typeof a)return f(a);if("function"==typeof a)return g(a);throw new Error("Transition argument ",a," is not supported. First (optional) argument should be event name, second (optional) argument should be a condition function")}),A(u.apply(null,a.concat([k(c)])))}function m(){var a=v.copy(arguments),b=a.pop();if(a.forEach(function(a){if("string"!=typeof a)throw new Error("`whenInStates` accepts list of states and either `goto` or a function as the last argument.")}),"function"!=typeof b&&"$yield"!==b.kind)throw new Error("Last argument should be either `goto` or a function.");return A(u(g(function(b,c){return a.every(function(a){return c(a)})}),b))}function n(){var a=v.copy(arguments),b=a.pop();if(a.forEach(function(a){if("string"!=typeof a)throw new Error("`whenNotInStates` accepts list of states and either `goto` or a function as the last argument.")}),"function"!=typeof b&&"$yield"!==b.kind)throw new Error("Last argument should be either `goto` or a function.");return A(u(g(function(b,c){return a.every(function(a){return!c(a)})}),b))}function o(a){return A(function(b){return b.parallel?new Error("`initial` shouldn't be specified on parallel region."):void(b.initial=a)})}function p(c){return function(){var d,e,f;return d=s.apply(null,arguments),e=new b.Statechart(d,y({log:a.log.debug},c)),f=e._scriptingContext.raise,e._scriptingContext.raise=function(a){var b="string"==typeof a?{name:a}:a;f.call(e._scriptingContext,b)},e.send=function(a,b){return e._scriptingContext.send.call(e,a,b||{})},e}}var q,r,s,t,u,v=a.array,w=a.object.has,x=a.type.is,y=a.object.merge,z=a.functional.builder,A=z.$yield;return q=z({run:function(a,b){var c={};return c.type=w(b,"parallel")?"parallel":"state",a(c),c},delay:function(a){return a()},zero:function(){return function(){}},$yield:function(a){return a},combine:function(a,b){return function(c){a(c),b(c)}},missing:function(a){if("string"==typeof a)return function(b){if(b.id)throw new Error("Can't set state id to \""+a+'". state\'s id is already set to "'+b.id+'"');b.id=a};if("function"==typeof a)return a;if("state"===a.type||"parallel"===a.type)return function(b){b.states||(b.states=[]),b.states.push(a)};throw new Error("Missing builder for expression: "+JSON.stringify(a))}}),s=q(),t=q({parallel:!0}),r=z({run:function(a){return function(b){b.transitions||(b.transitions=[]);var c={};a(c),b.transitions.push(c)}},delay:function(a){return a()},zero:function(){return function(){}},$yield:function(a){return a},combine:function(a,b){return function(c){a(c),b(c)}},missing:function(a){if("function"==typeof a)return a;throw new Error('Unknown operation "'+a.kind+'" in transition expression',a)}}),u=r(),{builder:p,state:s,parallel:t,initial:o,onEntry:d,onExit:e,on:l,whenInStates:m,whenNotInStates:n,"goto":i,gotoInternally:j,statechart:p({logStatesEnteredAndExited:c.logStatesEnteredAndExited,log:a.log.debug})}}}),define("scalejs.statechart-scion/state",["scalejs!core","./state.builder","scion-ng","scalejs.functional","scalejs.linq-linqjs"],function(a,b,c){return function(d){function e(a){return t(a,"states")?q.make(a).concat(q.from(a.states).selectMany(e)):q.make(a)}function f(a,b){var c=e(a).firstOrDefault(function(a){return a.id===b});return c}function g(a,b){var c=e(a).firstOrDefault(function(a){return a.states&&a.states.some(function(a){return a.id===b})});return c}function h(){return v(function(a,b){var c,d;if(c=f(o,a),!c)throw new Error('Parent state "'+a+"\" doesn't exist");if(t(b,"id")&&(d=f(o,b.id)))throw new Error('State "'+b.id+'" already exists.');t(c,"states")||(c.states=[]),c.states.push(b)}).apply(null,arguments)}function i(b){if(a.isApplicationRunning())throw new Error("Can't register a state while application is running.");r(arguments,1).forEach(h(b))}function j(a,b){var c;if(c=f(o,a),!c)throw new Error('Parent state "'+a+"\" doesn't exist");b.expr(c)}function k(){if(a.isApplicationRunning())throw new Error("Can't unregister a state while application is running.");r(arguments).forEach(function(a){var b=g(o,a),c=q.from(b.states).first(function(b){return b.id===a});s(b.states,c)})}function l(a,b,c){var d;if(u(a,"string"))d={name:a};else{if(!t(a,"name"))throw new Error("event object should have `name` property.");d=a}!t(c)&&u(b,"number")?c=b:d.data=b,p.send(d,{delay:c})}function m(){return a.reactive.Observable.create(function(a){var b={onEntry:function(b,c){a.onNext({event:"entry",state:b,context:this,currentEvent:c})},onExit:function(b,c){a.onNext({event:"exit",state:b,currentEvent:c})},onTransition:function(b,c,d){a.onNext({event:"transition",source:b,targets:c,currentEvent:d})}};return p.registerListener(b),function(){p.unregisterListener(b)}})}function n(a){return function(b){m().where(function(b){return"entry"===b.event&&b.state===a}).take(1).subscribe(function(){b()})}}var o,p,q=a.linq.enumerable,r=a.array.toArray,s=a.array.removeOne,t=a.object.has,u=a.type.is,v=a.functional.curry,w=b(d),x=w.state,y=w.parallel;return o=x("scalejs-app",y("root")),a.onApplicationEvent(function(b){var e;switch(b){case"started":p=new c.Statechart(o,{logStatesEnteredAndExited:d.logStatesEnteredAndExited,log:a.log.debug}),e=p._scriptingContext.raise,p._scriptingContext.raise=function(a){var b="string"==typeof a?{name:a}:a;e.call(p._scriptingContext,b)},p.send=function(a,b){return p._scriptingContext.send.call(p,a,b||{})},p.start();break;case"stopped":}}),{registerStates:i,registerTransition:j,unregisterStates:k,raise:l,observe:m,onState:n,builder:w}}}),define("scalejs.statechart-scion",["scalejs!core","./scalejs.statechart-scion/state","module"],function(a,b,c){a.registerExtension({state:b(c.config())})});
/*global define,window,document*/
/*jslint todo:true*/
define('scalejs.routing-historyjs/routing',[
    'scalejs!core',
    './history',
    './router',
    'rx',
    'scalejs.statechart-scion'
], function (
    core,
    history,
    router,
    rx
) {
    

    var has = core.object.has,
        extend = core.object.extend,
        toArray = core.array.toArray,
        on = core.state.builder.on,
        gotoInternally = core.state.builder.gotoInternally,
        onEntry = core.state.builder.onEntry,
        state = core.state.builder.state,
        raise = core.state.raise,
        $yield = core.functional.builder.$yield,
        registerTransition = core.state.registerTransition,
        observeState = core.state.observe,
        // properties
        routerStateId,
        routerTransitions = [],
        disposable = new rx.CompositeDisposable(),
        firstNavigation = true;

    function navigate(url) {
        if (firstNavigation) {
            firstNavigation = false;
            history.replace({ url: url });
        } else {
            history.add({ url: url });
        }
    }

    function setupRouting() {
        var currentUrl;

        disposable.add(observeState().subscribe(function (e) {
            var url;

            // do routing on state entry
            if (e.event !== 'entry') { return; }

            // try map data to url with the router
            url = router.tryToUrl(e.state, e.currentEvent ? e.currentEvent.data : null);

            // if mapping succeded then navigate to url
            if (url) {
                navigate(url);
            }
        }));

        disposable.add(history.observe().subscribe(function (e) {
            var url = e.hash;

            if (currentUrl === url) { return; } //do not cause statechange if url is the same
            currentUrl = url;

            // needs a delay of 0 so that the transition is defined on the parent state
            raise('routed', { url: url }, 0);
        }));
    }

    function disposeRouting() {
        disposable.dispose();
        //routerTransitions = [];
    }

    function route(routeDef) {
        return $yield(function (s) {
            var transition;

            // add route for this state to router
            router.addRoute(s.id, routeDef);
            // create transition that would trigger on 'routed' event and will attempt to parse the url
            transition = on('routed', function (e) {
                // if path of the 'routed' event matches the route then transition is active
                var parsed = router.tryFromUrl(s.id, e.data.url);

                if (parsed) {
                    extend(e.data, parsed);
                    return true;
                }
            }, gotoInternally(s.id));

            // if router state is already added then register transition on that state
            // otherwise add transition to the list of transitions to be registered once
            // the router state gets registered
            if (routerStateId) {
                registerTransition(routerStateId, transition);
            } else {
                routerTransitions.push(transition);
            }
        });
    }

    function routerState(stateId, optsOrBuilders) {
        var builders,
            builtRouterState;

        routerStateId = stateId;

        if (has(optsOrBuilders, 'baseUrl')) {
            router.setBaseUrl(optsOrBuilders.baseUrl);
            builders = toArray(arguments).slice(2, arguments.length);
        } else {
            builders = toArray(arguments).slice(1, arguments.length);
        }

        builtRouterState = state.apply(null, [
            routerStateId,
            on('router.disposing', gotoInternally('router.disposed')),
            state('router.waiting', onEntry(setupRouting)),
            state('router.disposed', onEntry(disposeRouting))
        ].concat(routerTransitions)
            .concat(builders));

        return builtRouterState;
    }

    return {
        route: route,
        routerState: routerState
    };
});

/*global define*/
define('scalejs.routing-historyjs',[
    'scalejs!core',
    './scalejs.routing-historyjs/routing'
], function (
    core,
    routing
) {
    

    core.registerExtension({ routing: routing });
});


