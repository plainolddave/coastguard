import React, { Component } from 'react'
import { LayerGroup, Polyline, Marker, Popup, Tooltip, CircleMarker } from "react-leaflet";
import * as dayjs from 'dayjs'
import axios from "axios";
import { GetTimeOffset, Log } from "./../App/Helpers"
import { GetIcon, GetColor } from "./TrackIcon"

const settings = {
    refreshMillis: 1000 * 60 * 2,   // updates every n minutes
    maxErrors: 5,                   // max errors before clearing tracks
    fromHours: -24,                 // use a window of track info behind now()
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    track: {
        weight: 3,
        opacity: 0.2
    },
    mark: {
        radius: 3,
        weight: 1,
        opacity: 0.4
    },
    markerOpacity: 0.8
}

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

    render = () => {
        Log("track", "render");
        return (
            <LayerGroup>
                {this.state.tracks.map((vessel, index) =>
                    <LayerGroup key={`lg-${vessel.mmsi}`}>
                        <Polyline
                            key={`tk-${vessel.mmsi}`}
                            pathOptions={{ weight: settings.track.weight, opacity: settings.track.opacity, color: GetColor(vessel) }}
                            positions={vessel.line}
                        />
                        {vessel.line.map((point, index) =>
                            <CircleMarker
                                center={point}
                                radius={settings.mark.radius}
                                pathOptions={{ weight: settings.mark.weight, opacity: settings.mark.opacity, color: GetColor(vessel) }}
                            >
                                <Popup key={`pp-${vessel.mmsi}`}>
                                    Name: {this.getName(vessel)}<br />
                                    MMSI: {vessel.mmsi}<br />
                                </Popup>
                            </CircleMarker>
                        )}
                        <Marker
                            key={`mk-${vessel.mmsi}`}
                            position={[vessel.pos.lat, vessel.pos.lon]}
                            icon={GetIcon(vessel)}>
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
            </LayerGroup>
        )
    }
}

export default TrackLayer
