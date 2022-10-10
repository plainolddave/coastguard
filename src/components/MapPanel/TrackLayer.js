import React, { Component } from 'react'
import { LayerGroup, Polyline, Marker, Popup, Tooltip } from "react-leaflet";
import * as L from "leaflet";
import { GetTimeOffset, Log } from "./../App/Helpers"
import axios from "axios";
import * as dayjs from 'dayjs'

const settings = {
    refreshMillis: 1000 * 60 * 2,   // updates every n minutes
    maxErrors: 5,                   // max errors before clearing tracks
    fromHours: -12,                 // use a window of track info behind now()
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    track: {
        color: 'blue',
        weight: 3,
        opacity: 0.1
    },
    markerOpacity: 0.8
}

// -------------------------------------------------------------------------------

const ChartIcon = L.Icon.extend({
    options: {
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }
});

var greenIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
});

var blueIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
});

var goldIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png'
});

var violetIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png'
});

var greyIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png'
});

//var redIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
//});

//var orangeIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
//});

//var blackIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png'
//});

// -------------------------------------------------------------------------------

class TrackLayer extends Component {

    constructor(props) {
        super(props);
        this.refreshTimer = null;
        this.refreshErrors = 0;
        this.state = {
            tracks: []
        };
    }

    componentDidMount() {
        this.refresh();
        this.refreshTimer = setInterval(
            () => this.refresh(),
            settings.refreshMillis
        );
    }

    componentWillUnmount() {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
    }

    // -------------------------------------------------------------------------------

    refresh = () => {

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        let url = `${settings.url}?from=${dtFrom}`;
        Log("track", url);

        axios.get(url)
            .then((response) => {

                // make sure the vessel positions are sorted by time, in reverse order
                let tracks = response.data.tracks;
                tracks.forEach((vessel) => {
                    let track = vessel.track.sort((a, b) => b.dt - a.dt);
                    let line = [];
                    track.forEach(t => {
                        let p = [t.lat, t.lon];
                        line.push(p);
                    });
                    vessel.line = line;
                    vessel.pos = track[0];
                });

                this.setState({
                    tracks: tracks
                });
                this.refreshErrors = 0;
                //console.log(`track url: ${url}`);// data: ${JSON.stringify(response.data)}`);
            })
            .catch((err) => {
                this.refreshErrors++;
                Log("track error", `count: ${this.refreshErrors} err: ${err}`);
                console.log();
                if (this.refreshErrors >= settings.maxErrors) {
                    Log("track error", "too many errors - clearing all tracks");
                    this.setState({
                        tracks: []
                    })
                }
            });
    };

    // -------------------------------------------------------------------------------

    // get the vessel name, or MMSI if name is blank
    getName = (vessel) => {
        if (vessel.vessel.length === 0) {
            let name = "*"; // add a star to indicate its not a vessel in the database
            name += vessel.name == null ? String(vessel.mmsi) : String(vessel.name);
            return name;
        } else {
            return vessel.vessel[0].name;
        }
    }

    // get the icon
    getIcon = (vessel) => {

        let org = "Other";
        if (vessel.vessel.length > 0) {
            org = vessel.vessel[0].org;
        }

        //greenIcon
        //blueIcon
        //goldIcon
        //violetIcon
        //greyIcon
        //redIcon
        //orangeIcon
        //blackIcon
        switch (org) {
            case "QF2":
                return goldIcon;
            case "QPS":
                return blueIcon
            case "AVCG":
                return greenIcon
            case "VMR":
                return violetIcon
            default:
                return greyIcon;
        }
    }

    render = () => {

        Log("track", "render");
        return (
            <>
                {this.state.tracks.map((vessel, index) =>
                    <LayerGroup key={`lg-${vessel.mmsi}`}>
                        <Polyline
                            key={`tk-${vessel.mmsi}`}
                            pathOptions={settings.track}
                            positions={vessel.line}
                        />
                        <Marker
                            key={`mk-${vessel.mmsi}`}
                            position={[vessel.pos.lat, vessel.pos.lon]}
                            icon={this.getIcon(vessel)}>
                            <Tooltip
                                key={`tt-${vessel.mmsi}`}
                                opacity={settings.markerOpacity}
                                permanent>
                                {this.getName(vessel)}
                            </Tooltip>
                            <Popup key={`pp-${vessel.mmsi}`}>
                                Name: {this.getName(vessel)}<br />
                                MMSI: {vessel.mmsi}<br />
                                Time: {dayjs.unix(vessel.pos.dt).format("HH:mm")}<br />
                                Course: {vessel.pos.cog}<br />
                                Speed: {vessel.pos.sog} kts<br />
                            </Popup>
                        </Marker>
                    </LayerGroup>
                )}
            </>
        )
    }
}

export default TrackLayer
