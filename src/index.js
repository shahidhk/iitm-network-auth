import NfwAuth from './nfw.js';
import NetaccessAuth from './netaccess.js';

class IITMNetworkAuth {

    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    login(mode) {
        if (mode == 'nfw') {
            this.authenticator = new NfwAuth(this.username, this.password);
        } else if (mode == 'netaccess') {
            this.authenticator = new NetAccessAuth(this.username, this.password); 
        }
        this.authenticator._login();
        // on success:
        this.logged_in = true;
    }

    refresh() {
        this.authenticator._refresh();
    }

    logout() {
        this.authenticator._logout();
    }


}

module.exports = IITMNetworkAuth;
module.exports.default = module.exports;
