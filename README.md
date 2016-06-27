iitm-network-auth
-----------------
[![npm version](https://badge.fury.io/js/iitm-network-auth.svg)](https://badge.fury.io/js/iitm-network-auth)

npm module to authenticate against the IIT Madras campus network using openLDAP credentials

## Usage

- Import the module  
```js
var IITMNetworkAuth = require('iitm-network-auth');

```

- Initialise with username and password
```js
var auth = new IITMNetworkAuth('<username'>, '<password>');
```

- Login by specifying the method  
Methods that are availabe: 
    - `nfw`: For the new firewall login (through `https://nfw.iitm.ac.in`)
    - TODO: `netaccess`: For the existing netaccess login (through `https://netaccess.iitm.ac.in`)
```js
auth.login('<mode>');
```

- Refresh authentication  
```js
auth.refresh()
```

###TODO:
- Implement `netaccess` mode
- Implement `auto_refresh` so that the library itself will keep on refreshing authentication
- Improve error handling
- Make all methods `Promise`s
- Improve documentation

