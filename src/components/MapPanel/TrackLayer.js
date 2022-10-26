import React, { Component } from 'react'
import { LayerGroup, Polyline, Marker, Popup, Tooltip, CircleMarker } from "react-leaflet";
import * as dayjs from 'dayjs'
import axios from "axios";
import { GetTimeOffset, Log } from "./../Common/Utils"
import { GetIcon, GetColor } from "./TrackIcon"

const settings = {
    startupMillis: 5000,            // soft start
    refreshMillis: 1000 * 60 * 2,   // updates every n minutes
    maxErrors: 5,                   // max errors before clearing tracks
    fromHours: -12,                 // use a window of track info behind now()
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    track: {
        weight: 4,
        opacity: 0.5
    },
    circle: {
        radius: 2,
        weight: 1,
        opacity: 0.5
    },
    tooltip: {
        opacity: 1.0,
        offset: [-14, -28],
        direction: "left"
    },
    marker: {
        opacity: 1.0
    }
}

// -------------------------------------------------------------------------------

class TrackLayer extends Component {

    constructor(props) {
        super(props);
        this.mounted = false;
        this.requestRef = axios.CancelToken.source();
        this.statupTimer = null;
        this.refreshTimer = null;
        this.refreshErrors = 0;
        this.state = {
            tracks: []
        };
    }

    componentDidMount() {
        if (this.mounted) {
            Log("tracks", "already mounted");
            return;
        }
        this.mounted = true;

        this.startupTimer = setTimeout(
            () => {
                // initial refresh
                this.requestRef = axios.CancelToken.source();
                this.refresh();

                // start the refresh timer 
                this.refreshTimer = setInterval(
                    () => this.refresh(),
                    settings.refreshMillis
                );
            },
            settings.startupMillis
        );
    }

    componentWillUnmount() {
        this.requestRef.cancel();
        clearInterval(this.startupTimer);
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
        this.mounted = false;
        //Log("tracks", "unmounted");
    }

    // -------------------------------------------------------------------------------

    refresh = () => {

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        let url = `${settings.url}?from=${dtFrom}`;
        Log("track", url);

        axios.get(url, {
            cancelToken: this.requestRef.token,
        })
            .then((response) => {

                // make sure the vessel positions are sorted by time, in reverse order
                let tracks = response.data.tracks;
                tracks.forEach((vessel) => {
                    vessel.track.sort((a, b) => b.dt - a.dt);
                    let line = [];
                    vessel.track.forEach(t => {
                        let p = [t.lat, t.lon];
                        line.push(p);
                    });
                    vessel.line = line;
                    vessel.pos = vessel.track[0];
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
            })
            .finally(() => {
                this.requestRef = axios.CancelToken.source()
            });
    };

    // -------------------------------------------------------------------------------

    render = () => {
        //Log("track", "render");
        return (
            <LayerGroup>
                {this.state.tracks.map((vessel, index) =>
                    <LayerGroup key={`lg_${vessel.mmsi}`}>
                        <Polyline
                            key={`tk_${vessel.mmsi}`}
                            pathOptions={{ weight: settings.track.weight, opacity: settings.track.opacity, color: GetColor(vessel.info.color) }}
                            positions={vessel.line}
                        />
                        {vessel.track.map((point, index) =>
                            <CircleMarker
                                key={`cm_${vessel.mmsi}_${point.dt}`}
                                center={point}
                                radius={settings.circle.radius}
                                pathOptions={{ weight: settings.circle.weight, opacity: settings.circle.opacity, color: GetColor(vessel.info.color) }}
                            >
                                <Popup key={`pu_${vessel.mmsi}`}>
                                    Name: {vessel.name}<br />
                                    MMSI: {vessel.mmsi}<br />
                                    Time: {dayjs.unix(point.dt).format("HH:mm")}<br />
                                    Course: {point.cog}<br />
                                    Speed: {point.sog} kts<br />
                                </Popup>
                            </CircleMarker>
                        )}
                        <Marker
                            key={`mk_${vessel.mmsi}`}
                            position={[vessel.pos.lat, vessel.pos.lon]}
                            icon={GetIcon(vessel.info.color)}
                            opacity={settings.marker.opacity}
                        >
                            <Tooltip
                                className="tooltip"
                                offset={settings.tooltip.offset}
                                key={`tt_${vessel.mmsi}`}
                                opacity={settings.tooltip.opacity}
                                direction={settings.tooltip.direction}
                                permanent>
                                {vessel.info.name}
                            </Tooltip>
                            <Popup key={`pp_${vessel.mmsi}`}>
                                Name: {vessel.info.name}<br />
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
