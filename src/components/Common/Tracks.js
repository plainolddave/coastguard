import React, { useState, useRef, useEffect, useMemo } from "react";
import { LayerGroup, Polyline, Marker, Popup, Tooltip, CircleMarker } from "react-leaflet";
import axios from "axios";
import * as dayjs from 'dayjs'
import { Log } from "./Utils"
import { GetIcon, GetColor } from "./../MapPanel/TrackIcon"

const settings = {
    defaultStartupMillis: 1000,             // (mutable) soft start timer
    defaultRefreshMillis: 1000 * 60 * 5,    // (mutable) updates every n minutes 
    defaultTimeframe: '12H',                // (mutable) use a window of track info from this time behind now() 
    defaultOrg: "QF2",                      // (mutable) default organisation - QF2, SAR, ALL 
    defaultMinimumSOG: 0.2,                 // (mutable) minimum speed over ground
    defaultMinuteBins: "auto",              // (mutable) group positions into bins of n minutes
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    track: {
        weight: 5,
        opacity: 0.3
    },
    circle: {
        radius: 4,
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

function Tracks({
    map = null,
    showIcon = true,
    startupMillis = settings.defaultStartupMillis,
    refreshMillis = settings.defaultRefreshMillis,
    timeframe = settings.defaultTimeframe,
    org = settings.defaultOrg,
    sog = settings.defaultMinimumSOG,
    mins = settings.defaultMinuteBins,
    ...restProps }) {

    const startupTimer = useRef(null);
    const refreshTimer = useRef(null);
    const requestRef = useRef(axios.CancelToken.source());
    const [tracks, setTracks] = useState([]);

    function refresh() {

        // from
        let url = settings.url;

        // timeframes use fixed intervals & bins 
        let minVal = 1;
        switch (timeframe) {
            case '7D':  // last 7 days
                url += `?from=${dayjs().subtract(7, "day").unix()}`;
                minVal = 1;
                break;
            case '30D': // last 30 days
                url += `?from=${dayjs().subtract(30, "day").unix()}`;
                minVal = 2;
                break;
            case '0M':  // this month
                url += `?from=${dayjs().startOf("month").unix()}`;
                minVal = 2;
                break;
            case '1M':  // last calendar month
                url += `?from=${dayjs().subtract(1, "month").startOf("month").unix()}`;
                url += `?to=${dayjs().startOf("month").unix()}`;
                minVal = 2;
                break;
            case '2M':  // last 2 calendar months
                url += `?from=${dayjs().subtract(2, "month").startOf("month").unix()}`;
                url += `?to=${dayjs().startOf("month").unix()}`;
                minVal = 2;
                break;
            case 'All': // all time
                minVal = 5;
                break;
            default:    // last 12 hours
                url += `?from=${dayjs().subtract(12, 'hour').unix()}`;
                minVal = 1;
                break;
        }
        url += `?&mins=${ mins === "auto" ? minVal : mins }`

        // sog
        if (sog !== 0) {
            url += `&sog=${sog}`;
        }
        // org
        url += `&org=${org}`;

        Log("tracks", `refresh org:${org} sog: ${sog} time: ${timeframe} mins: ${mins} url: ${url}`);
        requestRef.current.cancel();
        requestRef.current = axios.CancelToken.source();

        axios.get(url, {
            cancelToken: requestRef.current.token,
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
                setTracks(tracks);
                Log("track", "refresh ok");
            })
            .catch((err) => {
                Log("track refresh error", err);
            })
            .finally(() => {
                requestRef.current = axios.CancelToken.source()
            })
    };

    // run once on initial render, to initiate a soft start, then start 
    // a timer to fetch data periodically (i.e. after the soft start timer
    // gives a short delay to avoid hammering the server on initial render)
    useEffect(() => {
        //Log("tracks", "start");
        clearTimeout(startupTimer.current);
        startupTimer.current = setTimeout(() => {
            refresh();
            clearTimeout(refreshTimer.current);
            refreshTimer.current = setInterval(() => {
                refresh();
            }, refreshMillis);
            return () => {
                clearTimeout(refreshTimer.current);
            }
        }, startupMillis);
        return () => {
            clearTimeout(startupTimer.current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startupMillis, refreshMillis]);

    // refresh track data when org or timeframes change
    useEffect(() => {
        refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org, timeframe]);

    const displayTracks = useMemo(
        () => (
            <LayerGroup>
                {tracks.map((vessel, index) =>
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
        ),
        [tracks],
    );

    return (
        <div className="page">
            {displayTracks}
        </div>
    )
}

//{/*{displayMap}*/ }
//{/*{map ? <SideBar map={map} /> : null}*/ }

export default Tracks;
