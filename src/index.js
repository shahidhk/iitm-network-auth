import NfwAuth from './nfw.js';
import NetaccessAuth from './netaccess.js';

class IITMNetworkAuth {

    constructor(username, password, mode) {
        this.username = username;
        this.password = password;
        this.mode = mode;
        if (mode == 'nfw') {
            this.authenticator = new NfwAuth(this.username, this.password);
        } else if (mode == 'netaccess') {
            this.authenticator = new NetAccessAuth(this.username, this.password); 
        }
    }

    login(mode) {
        this.authenticator._login();
    }

    refresh() {
        this.authenticator._refresh();
    }

    start_refresh() {
        this.authenticator._start_auto_refresh();
    }

    stop_refresh() {
        this.authenticator._stop_auto_refresh();
    }

    logout() {
        this.authenticator._logout();
    }

    get_emitter() {
        return this.authenticator.emitter;
    }

    is_logged_in() {
        return this.authenticatir.loggen_in;
    }

}

module.exports = IITMNetworkAuth;
module.exports.default = module.exports;
