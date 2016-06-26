const rp = require('request-promise');

const agentOptions = {
    rejectUnauthorized: false
};

const agent = new https.Agent(agentOptions);

const CHECK_URL= "http://connectivitycheck.gstatic.com/generate_204";
const FORTIGATE_URL = "https://nfw.iitm.ac.in:1003";
const KEEPALIVE_URL = `${FORTIGATE_URL}/keepalive?` 
const LOGOUT_URL = `${FORTIGATE_URL}/logout?` 

const MAGIC_REGEX = /([0-9A-Fa-f]{16})/g;

export class IITMNetworkAuth {

    constructor(username, password, mode) {
        this.username = username;
        this.password = password;
        this.mode = mode;
    }

    _init_fortigate() {
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
                let magic = MAGIC_REGEX.exec(res)[0];
                console.log(magic);
                this.magic = magic;
                this.logged_in = true;
            })
            .catch(e => console.log('error', e));
    }

    _init_netaccess() {
        
    }

    init() {
        if (this.mode == 'fortigate') {
            this._init_fortigate();
        }
    }

    refresh() {
        if (this.mode == 'fortigate') {
            if (!this.logged_in) {
                console.log('Not logged in!');
                return
            } 
            let refresh_url = `${KEEPALIVE_URL}${this.magic}`;
            let opts = {
                uri: refresh_url,
                agent: agent
            }
            rp(opts)
                .then(res => {
                    let magic = MAGIC_REGEX.exec(res)[0];
                    this.magic = magic;
                    console.log('Refreshed!', magic);
                })
                .catch(e => console.log('error', e));
        }
    }

}
