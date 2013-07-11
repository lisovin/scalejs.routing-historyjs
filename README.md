sclaejs.routing-historyjs <br/> v0.2.2, July 11 2013
==================
Add routing capabilities to your [Scalable JavaScript client side application](https://github.com/lisovin/scalejs)

This is an extension for a [scalejs](https://github.com/lisovin/scalejs) app which works with the HTML5 History API.
It uses [history.js](https://github.com/browserstate/history.js) as its base library. The base library allows routing
to be cross-browser compatible for modern browsers which support HTML5 History API. It has not been tested in HTML4 browsers.
The extension is meant to work in conjunction with the [statechart](https://github.com/lisovin/scalejs.statechart-scion) 
extension to allow one to give certain states urls that will appear when the state is entered, as well as navigating
the user to the state when the url for a state is supplied.

## Prerequesites & Dependencies  

- [Scalejs](https://github.com/lisovin/scalejs) and all of its prerequisites 
- [Reactive Extension](https://github.com/lisovin/scalejs.reactive) 
- [Statechart Extension](https://github.com/lisovin/scalejs.statechart-scion) 

## Installation

To add the extension to your Scalejs app, right-click on the solution file for your project and select "Manage Nuget Packages"
Search for scalejs.routing-historyjs and click install. It's that simple!

### Adding Routing capabilities to your App

This extension adds a new state to your app, called `'router'`, which listens for navigation and statechart changes and handles them appropriately.
The following is needed in order for this to work:

- Router state must be a child of your `'app'` state (which may be a parallel state)
- All states which require routing capabilities should be non-parallel children to a single state (lets call it `'main'`)
- `'main'` must be a child of the `'router'` state

The following code adds the router state to your app:

``` javascript
var registerStates = sandbox.state.registerStates,
    state = sandbox.state.builder.state,
    parallel = sandbox.state.builder.parallel,
    onEntry = sandbox.state.builder.onEntry,
    routerState = sandbox.routing.routerState,

registerStates('root', parallel('app', routerState())); 

registerStates('router',
    state('main',
        onEntry(function () {
				//do stuff here...
			})));
```

### Adding simple routing capability to state

Now that you have created your router, states which require routing will need some set up.

- Routing a state is as simple as adding `sandbox.routing.route` to the state.

``` javascript
var registerStates = sandbox.state.registerStates,
    state = sandbox.state.builder.state,
    route = sandbox.routing.route,

registerStates('main',
    state('dashboard',
        route('dashboard')));
```

This will create a url for the `dashboard` state that looks like this
www.mysite.com/?dashboard

### Routing to the root

For the 'root' of your site to be routed to directly, add the following to the state which you want to be the root.

`route('/')`

### Routing with queries

To route to a page qith a query, something like the following should be done


``` javascript
state('item',
    onEntry(function (e) {
        this.itemId = e.data.id;
    }),
    route('item', function () {
        return { id: this.itemId };
    }));
```

the link will then appear like this:

www.mysite.com/?item?id=1


## Exposed API

All functions can be found under the 'routing' namespace.

- `observe()` <br/> Creates an observable for navigation events which you can subscribe to.
- `navigate(location, query)` <br/> Adds new state to your browser. `location` must be a string and `query` must be an object.
- `removeHash` <br/> Removes anything after a hash in the url, replaces (not adds) to your history state.
- `back(steps)` <br/> Goes back in history by a number of steps. `steps` is optional and by default is -1.
- `route(location, queryFunc`' <br/> adds a route transition to the router state. `queryFunc` is optional but if provided must return an object like in the example above.
- `routerState()` <br/> creates the `router` state for your app, should be used like in the example above.

