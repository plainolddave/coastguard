import React, { Component } from 'react'

class LocalIP extends Component {

    constructor(props) {
        super(props);
        this.state = {
            ips: []
        };
    }

    componentDidMount() {
        this.refresh();
    }

    refresh = () => {

        this.getUserIP((ip) => {

            let newIps = this.state.ips
            newIps.push(String(ip));
            this.setState({
                ips: newIps
            });
        });
    };

    // -------------------------------------------------------------------------------

    // https://ourcodeworld.com/articles/read/257/how-to-get-the-client-ip-address-with-javascript-only
    getUserIP(onNewIP) {

        // compatibility for firefox and chrome
        var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
        var pc = new myPeerConnection({ iceServers: [] }),
            noop = function () { },
            localIPs = {},
            ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;

        function iterateIP(ip) {
            if (!localIPs[ip]) onNewIP(ip);
            localIPs[ip] = true;
        }

        //create a bogus data channel
        pc.createDataChannel("");

        // create offer and set local description
        pc.createOffer().then(function (sdp) {
            sdp.sdp.split('\n').forEach(function (line) {
                if (line.indexOf('candidate') < 0) return;
                line.match(ipRegex).forEach(iterateIP);
            });
            pc.setLocalDescription(sdp, noop, noop);
        }).catch(function (reason) {
            // An error occurred, so handle the failure to connect
        });

        //listen for candidate events
        pc.onicecandidate = function (ice) {
            if (!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex)) return;
            ice.candidate.candidate.match(ipRegex).forEach(iterateIP);
        };
    }

    // -------------------------------------------------------------------------------

    render = () => {
        return (
            <div className={this.props.classes}>
                {this.state.ips.map((ip, index) =>
                    <p key={`ip_${index}`}>{ip}</p>
                )}
            </div>
        )
    }
}

export default LocalIP
