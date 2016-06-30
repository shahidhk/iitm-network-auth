iitm-network-auth
-----------------
[![npm version](https://badge.fury.io/js/iitm-network-auth.svg)](https://badge.fury.io/js/iitm-network-auth)

npm module to authenticate against the IIT Madras campus network using openLDAP credentials


## Installation
```
npm install iitm-network-auth --save
```

## Usage

### Import the module  
```js
var IITMNetworkAuth = require('iitm-network-auth');

```

### Create an instance
- Initialise with username, password and mode of login  
    Modes that are availabe: 
    - `nfw`: For the new firewall login (through `https://nfw.iitm.ac.in`)
    - TODO: `netaccess`: For the existing netaccess login (through `https://netaccess.iitm.ac.in`)
```js
var auth = new IITMNetworkAuth('<username>', '<password>', '<mode>');
```

### Login
```js
auth.login();
```

### Logout
```js
auth.logout();
```
### Keep the session alive
The module can keep an authentication session alive by sending request to keepalive url.  
The current inteval is set to `9 minutes` as the firewall keeps a session for 10 minutes.
```js
auth.start_refresh();
```

### Stop refreshing the session
```js
auth.stop_refresh();
```

### Refresh the session manually  
```js
auth.refresh()
```

### Get login status
```js
var logged_in = auth.is_logged_in();
```
### Event listeners
The module emits events to denote certain actions as they happen. Any client code can subscribe to these events and take necessary actions  
- Get the event emitter  
```
var emitter = auth.get_emitter();
```
- Add event listeners
```js
// do something when an error happens
emitter.on('error', function (e) {
    console.log(e.data); // log error details to the console
});

// do something when a login happens
emitter.on('log_in', function (e) {
    console.log(e.data); // log details to the console
});

// do something when a logout happens
emitter.on('log_out', function (e) {
    console.log(e.data); // log details to the console
});

// do something when a session is refreshed
emitter.on('session_refresh', function (e) {
    console.log(e.data); // log details to the console
});

// do something when a refresh timer is started/stopped
emitter.on('refresh_timer', function (e) {
    console.log(e.data.running); // log status to the consle (true/false)
});
```

### Set new credentials
```js
auth.set_credentials('<username>', '<password>');
```

## TODO:
- Implement `netaccess` mode
- Improve documentation

## Contributing
Pull requests are welcome
