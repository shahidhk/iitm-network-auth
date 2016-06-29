const rp = require('request-promise');
const https = require('https');
const ap = require('async-polling');

const agentOptions = {
    rejectUnauthorized: false
};

const agent = new https.Agent(agentOptions);

const CHECK_URL= "http://connectivitycheck.gstatic.com/generate_204";
const NFW_URL = "https://nfw.iitm.ac.in:1003";
const NFW_IP_URL = "https://10.25.0.9:1003";
const KEEPALIVE_URL = `${NFW_URL}/keepalive?` 
const LOGOUT_URL = `${NFW_URL}/logout?` 

const MAGIC_REGEX = /([0-9A-Fa-f]{16})/g;

const REFRESH_INTERVAL =  1000;

export default class NfwAuth {

    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.polling = ap(this._refresh, REFRESH_INTERVAL);
    }

    _get_magic(res) {
        let auth_url = res.headers['location'];
        if (auth_url === undefined || (auth_url.indexOf(NFW_URL) != 0 && auth_url.indexOf(NFW_IP_URL) != 0)) {
            return ({status: false, code: 303, message: `not connected, but unknown redirect: ${auth_url}`});
        }
        let magic = auth_url.split('?')[1];
        this.magic = magic;
        this.auth_url = auth_url;
        return ({status: true, magic: magic, auth_url: auth_url});
    }

    _should_connect() {
        const _should_connect_p = new Promise( (resolve, reject) => {
            let opts = {
                uri: CHECK_URL, 
                followRedirect: false, 
                resolveWithFullResponse: true, 
                simple: false
            };
            rp(opts)
                .then(res => {
                    if (res.statusCode == 204) {
                        return Promise.resolve({status: true, code: 204, message: 'connected, logout and reconnect'});
                    } else if (res.statusCode == 303) {
                        this.logged_in = false;
                        let resp = this._get_magic(res);
                        if (resp.status) {
                            return Promise.resolve({status: true, code: 303, message: `not connected, redirect to: ${resp.auth_url}`});
                        } else {
                            return Promise.reject(resp);
                        }
                    } else {
                        return Promise.reject({status: false, code: res.statusCode, message: 'unknown error', error: res});
                    }
                })
                .then(res => {resolve(res);})
                .catch(e => reject(e));
        });
        return _should_connect_p    
    }

    test() {
        this._should_connect()
            .then(res => {
                console.log('before check', res);
                if (res.code == 204) {
                    return this._logout()
                } else if (res.code == 303) {
                    return Promise.resolve(res.message);
                }
            })
            .then((res) => {console.log('after check', res); return this._login();})
            .then((res) => {console.log('after login', res); return this._refresh();})
            .then((res) => {console.log('after logout, resolve', res);})
            .catch(e => console.log('reject', e));
    }    

    _login() {
        const _login_p = new Promise( (resolve, reject) => {
            if (this.logged_in) {
                reject("Already logged in");
            }
            let opts = {
                uri: this.auth_url,
                agent: agent
            };
            rp(opts)
                .then(res => { 
                    let opts = {
                        method: 'POST',
                        uri: NFW_URL,
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
                        return Promise.reject("Incorrect credentials")
                    }
                    let magic = MAGIC_REGEX.exec(res)[0];
                    this.magic = magic;
                    return Promise.resolve(magic);
                })
                .then(magic => {
                    this.logged_in = true;
                    // TODO: start keepalive polling
                    this.polling.run();
                    resolve(magic);
                })
                .catch(e => reject(e)); 
        });
        return _login_p;
    }

    _refresh() {
        const _refresh_p = new Promise( (resolve, reject) => {
            if (!this.logged_in) {
                reject('Not logged in!');
            } 
            let refresh_url = `${KEEPALIVE_URL}${this.magic}`;
            let opts = {
                uri: refresh_url,
                agent: agent
            }
            rp(opts)
                .then(res => {
                    this.last_refreshed = Date.now();
                    console.log('Refreshed at ', this.last_refreshed, ' using ', this.magic);
                    return Promise.resolve(this.magic);
                })
                .then(magic => resolve(magic))
                .catch(e => reject(e));
        });
        return _refresh_p;
    }

    _auto_refresh() {
        setTimeout(this._refresh(), REFRESH_INTERVAL);
    }

    _logout() {
        const _logout_p = new Promise( (resolve, reject) => {
            let opts = {
                uri: LOGOUT_URL,
                agent: agent,
                followRedirect: false, 
                resolveWithFullResponse: true, 
                simple: false
            }
            rp(opts)
                .then(res => {
                    let resp = this._get_magic(res);
                    if (resp.status) {
                        this.logged_in = false;
                        this.magic = res.magic,
                        this.auth_url = res.auth_url;
                        if(this.last_refreshed) {
                            // TODO: stop keepalive polling
                            this.polling.stop();
                            this.last_refreshed = undefined;

                        }
                        return Promise.resolve(resp);
                    } else {
                        return Promise.reject(resp);
                    }
                })
                .then(res => resolve(res))
                .catch(e => reject(e));    
        });
        return _logout_p;
    }

}
