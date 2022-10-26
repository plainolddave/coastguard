import React, { useState, useRef, useEffect, useMemo } from "react";
import { LayerGroup, Polyline, Marker, Popup, Tooltip, CircleMarker } from "react-leaflet";
import axios from "axios";
import * as dayjs from 'dayjs'
import { Log, GetTimeOffset } from "./Utils"
import { GetIcon, GetColor } from "./../MapPanel/TrackIcon"

//const settings_old = {
//    position: [-27.33, 153.27],
//    zoom: 10.5,
//    useScrollWheel: true,
//    maxZoom: 20,
//    style: { height: "100%", width: "100%" },
//    attribution: false,
//    fleets: [
//        { value: 'QF2', label: 'QF2 Brisbane' },
//        { value: 'SAR', label: 'Marine Rescue' },
//        { value: 'All', label: 'All other vessels' }
//    ],
//    timeframes: [
//        { value: { from: '7D', to: '' }, label: '7 days' },
//        { value: { from: '30D', to: '' }, label: '30 days' },
//        { value: { from: '0M', to: '' }, label: 'This month' },
//        { value: { from: '1M', to: '0M' }, label: 'Last month' },
//        { value: { from: '2M', to: '' }, label: 'Last 2 months' }
//    ]
//}

// default props
const settings = {
    startupMillis: 2000,            // soft start (mutable) 
    refreshMillis: 1000 * 60 * 5,   // updates every n minutes (mutable) 
    maxErrors: 5,                   // max errors before clearing tracks
    fromHours: -12,                 // use a window of track info behind now() (mutable) 
    toHours: 0,                     // (mutable) 
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

/*
 * Org:
 *      QF2 (random colors)
 *      Marine Rescue (database colors)
 *      All (database colors)
 * Timeframe:
 *      7 days
 *      30 days
 *      this month
 *      last 2 months
 * */

function Tracks({
    map = null,
    showIcon = true,
    startupMillis = settings.startupMillis,
    refreshMillis = settings.refreshMillis,
    fromHours = settings.fromHours,
    toHours = settings.toHours,
    ...restProps }) {

    //const [map, setMap] = useState(null);
    //const mounted = useRef(false);
    const startupTimer = useRef(null);
    const refreshTimer = useRef(null);
    const requestRef = useRef(axios.CancelToken.source());
    const [tracks, setTracks] = useState([]);

    function refresh() {
        Log("tracks", "refresh");

        const fromTime = GetTimeOffset(fromHours);
        const fromDt = Math.floor(fromTime.getTime() / 1000);
        let url = `${settings.url}?from=${fromDt}`;
        Log("track", url);

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
            })
            .catch((err) => {
                Log("track error", err);
            })
            .finally(() => {
                requestRef.current = axios.CancelToken.source()
            })
    };

    // run once on initial render, to initiate a soft start
    // i.e. allow a short delay to avoid hammering the server
    useEffect(() => {
        //console.log("t2 start effect");
        Log("tracks", "start");
        clearTimeout(startupTimer.current);
        startupTimer.current = setTimeout(() => {

            //requestRef.current = axios.CancelToken.source();
            //if (!mounted.current) {
            //mounted.current = true;
            Log("tracks", "mounted!");

            refresh();
            // start a timer to fetch data periodically
            // (i.e.after soft start timer)
            clearTimeout(refreshTimer.current);
            refreshTimer.current = setInterval(() => {
                // requestRef.current = axios.CancelToken.source();
                refresh();
            }, refreshMillis);
            return () => {
                Log("tracks", "clear refresh");
                clearTimeout(refreshTimer.current);
            }
            //}
        }, startupMillis);
        return () => {
            Log("tracks", "clear startup");
            clearTimeout(startupTimer.current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // get the vessel name, or MMSI if name is blank
    //getName = (vessel) => {
    //    if (vessel.vessel.length === 0) {
    //        let name = "*"; // add a star to indicate its not a vessel in the database
    //        name += vessel.name == null ? String(vessel.mmsi) : String(vessel.name);
    //        return name;
    //    } else {
    //        return vessel.vessel[0].name;
    //    }
    //}

    //const getName = React.memo(function getName({ name }) {
    //    console.log("Skinny Jack")
    //    return (
    //        <div>{name}</div>
    //    )
    //})

    //const getName = useMemo(
    //    (vessel) => {
    //        let name = "";
    //        if (vessel.vessel.length === 0) {
    //            name = "*"; // add a star to indicate its not a vessel in the database
    //            name += vessel.name == null ? String(vessel.mmsi) : String(vessel.name);
    //            //return name;
    //        } else {
    //            name = vessel.vessel[0].name;
    //        }
    //        vesselName.current = name;
    //        return name;
    //    },
    //    [tracks],
    //);

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
