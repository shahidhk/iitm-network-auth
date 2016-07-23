const rp = require('request-promise');
const https = require('https');
const Emitter = require('emmett');

const emitter = new Emitter();

const agentOptions = {
    rejectUnauthorized: false
};

const agent = new https.Agent(agentOptions);

const CHECK_URL= "http://connectivitycheck.gstatic.com/generate_204";
const FORTIGATE_URL = "https://nfw.iitm.ac.in:1003";
const KEEPALIVE_URL = `${FORTIGATE_URL}/keepalive?` 
const LOGOUT_URL = `${FORTIGATE_URL}/logout?` 

const MAGIC_REGEX = /([0-9A-Fa-f]{16})/g;
const REFRESH_INTERVAL = 9 * 60 * 1000;

export default class NfwAuth {

    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.emitter = emitter;
    }

    _set_credentials(username, password) {
        this.username = username;
        this.password = password;
    }

    _login() {
        let opts = {
            uri: CHECK_URL, 
            followRedirect: false, 
            resolveWithFullResponse: true, 
            simple: false
        };
        rp(opts)
            .then(res => {
                let auth_url = res.headers['location'];
                if (auth_url === undefined) {
                    return Promise.reject('Already logged in!');
                }
                if (auth_url.indexOf(FORTIGATE_URL) != 0) {
                    return Promise.reject('Authentication URL does not match with fortigate!');
                }
                let magic = auth_url.split('?')[1];
                this.magic = magic;
                this.auth_url = auth_url;
                let opts = {
                    uri: auth_url,
                    agent: agent
                };
                return rp(opts)
            })
            .then(res => { 
                let opts = {
                    method: 'POST',
                    uri: FORTIGATE_URL,
                    form: {
                        username: this.username,
                        password: this.password,
                        magic: this.magic,
                        '4Tredir': 'http://google.co.in'
                    },
                    headers: {
                        'Referer': this.auth_url
                    },
                    agent: agent
                }
                return rp(opts)
            })
            .then(res => { 
                if (res.indexOf('Authentication Failed') != -1) {
                    return Promise.reject("Incorrect credentials");
                }
                let magic = MAGIC_REGEX.exec(res)[0];
                this.magic = magic;
                this.logged_in = true;
                this.emitter.emit('log_in', {status: true, message: magic});
            })
            .catch(e => {
                this.emitter.emit('error', {error: e});
            });
    }

    _refresh(auth) {
        
        if (!auth.logged_in) {
            auth.emitter.emit('error', {error: "Not logged in"});
            return;
        } 
        let refresh_url = `${KEEPALIVE_URL}${auth.magic}`;
        let opts = {
            uri: refresh_url,
            agent: agent
        }
        rp(opts)
            .then(res => {
                let magic = auth.magic;
                auth.last_refreshed = Date.now();
                auth.emitter.emit('session_refresh', {status: true, message: {magic: magic, timestamp: auth.last_refreshed}});
            })
            .catch(e => {
                auth.emitter.emit('error', {error: e});
            });
    }

    _start_auto_refresh() {
        if (this.refresh_timer_running) {
            this.emitter.emit('error', {error: "Refresh timer already running"});
            return; 
        }
        this.refresh_timer = setInterval(this._refresh, REFRESH_INTERVAL, this); 
        this.refresh_timer_running = true;
        this.emitter.emit('refresh_timer', {running: this.refresh_timer_running});
    }

    _stop_auto_refresh() {
        if (!this.refresh_timer_running) {
            this.emitter.emit('error', {error: "Refresh timer is not running"});
            return;
        }
        clearInterval(this.refresh_timer);
        this.refresh_timer_running = false;
        this.emitter.emit('refresh_timer', {running: this.refresh_timer_running});
    }

    _logout() {
        let opts = {
            uri: LOGOUT_URL,
            agent: agent,
            followRedirect: false, 
            resolveWithFullResponse: true, 
            simple: false
        }
        rp(opts)
            .then(res => {
                if (res.statusCode == 303) {
                    this.last_refreshed = undefined;
                    this.logged_in = false;
                    if (this.refresh_timer_running) {
                        this._stop_auto_refresh();
                    }
                    this.emitter.emit('log_out', {status: true, message: this.magic});
                } else {
                    return Promise.reject(res);
                }
            })
            .catch(e => {
                this.emitter.emit('error', {error: e});
            });
    }

}
