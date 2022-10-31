import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { MapContainer, LayersControl, TileLayer } from "react-leaflet";
import { usePageVisibility } from 'react-page-visibility';
import Control from "react-leaflet-custom-control";
import Select from 'react-select'
import makeAnimated from 'react-select/animated';
import { IconContext } from "react-icons";
import * as dayjs from 'dayjs'
import * as axios from 'axios'

import Icon from "./Common/Icon"
import Next from "./Common/Next"
import Tracks from "./Common/Tracks"
import Legend from "./Common/Legend"
import Coords from './Common/Coords';
import BaseLayers from "./MapPanel/BaseLayers";
import { Log } from "./Common/Utils"
import { GetColor, GetIcon } from "./MapPanel/TrackIcon"

const settings = {
    position: [-27.33, 153.27],
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20,
    style: { height: "100%", width: "100%" },
    attribution: false,
    startupMillis: 1000,             // soft start timer
    refreshMillis: 1000 * 60 * 10,   // updates every n minutes 
    minimumSOG: 0.2,                 // minimum speed over ground
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    defaultOrg: "QF2",
    fleets: [
        { value: 'QF2', label: 'QF2 Brisbane' },
        { value: 'SAR', label: 'Marine Rescue' },
        { value: 'ALL', label: 'All Vessels' }
    ],
    timeframe: [
        { value: '24H', mins: 1, line: true, label: '24 hours' },
        { value: '7D', mins: 1, line: true, label: '7 days' },
        { value: '30D', mins: 2, line: true, label: '30 days' },
        { value: '0M', mins: 2, line: false, label: 'This month' },
        { value: '1M', mins: 2, line: false, label: 'Last month' },
        { value: '2M', mins: 2, line: false, label: 'Last 2 months' },
        { value: 'All', mins: 3, line: false, label: 'All time' }
    ],
    colors: new Map([
        ["CG29", 'gold'],
        ["CG20", 'blue'],
        ["CG22", 'green'],
        ["CG23", 'violet'],
        ["CG24", 'red'],
        ["CG26", 'orange']
    ])
}

const animatedComponents = makeAnimated();

function History() {

    const isVisible = usePageVisibility();
    const [map, setMap] = useState(null);
    const [org, setOrg] = useState(settings.fleets[1]);
    const [timeframe, setTimeframe] = useState(settings.timeframe[0]);
    const [tracks, setTracks] = useState([]);
    const [colors, setColors] = useState(new Map());

    const startupTimer = useRef(null);
    const refreshTimer = useRef(null);
    const requestRef = useRef(axios.CancelToken.source());

    function refresh() {

        // only animate if the page is active
        if (!isVisible) return;

        // from
        let url = settings.url;

        // timeframes use fixed intervals & bins 
        switch (timeframe.value) {
            case '24H':  // last day
                url += `?from=${dayjs().subtract(24, "hour").unix()}`;
                break;
            case '7D':  // last 7 days
                url += `?from=${dayjs().subtract(7, "day").unix()}`;
                break;
            case '30D': // last 30 days
                url += `?from=${dayjs().subtract(30, "day").unix()}`;
                break;
            case '0M':  // this month
                url += `?from=${dayjs().startOf("month").unix()}`;
                break;
            case '1M':  // last calendar month
                url += `?from=${dayjs().subtract(1, "month").startOf("month").unix()}`;
                url += `&to=${dayjs().startOf("month").unix()}`;
                break;
            case '2M':  // last 2 calendar months
                url += `?from=${dayjs().subtract(2, "month").startOf("month").unix()}`;
                url += `&to=${dayjs().startOf("month").unix()}`;
                break;
            case 'All': // all time
                url += `?from=0`;
                break;
            default:    // last 12 hours
                url += `?from=${dayjs().subtract(12, 'hour').unix()}`;;
                break;
        }
        url += `&mins=${timeframe.mins}`;

        // sog
        url += `&sog=${settings.minimumSOG}`;

        // org
        url += `&org=${org.value}`;

        Log("history", `refresh org:${org.value} sog: ${settings.minimumSOG} time: ${timeframe.value} mins: ${timeframe.mins} url: ${url}`);
        requestRef.current.cancel();
        requestRef.current = axios.CancelToken.source();

        axios.get(url, {
            cancelToken: requestRef.current.token,
        })
            .then((response) => {

                // make sure the vessel positions are sorted by time, in reverse order
                let newTracks = response.data.tracks;
                let newColors = new Map();
                newTracks.forEach((vessel) => {
                    vessel.track.sort((a, b) => b.dt - a.dt);
                    vessel.pos = vessel.track[0];

                    // check track, and if more than three missed transmissions break
                    // the track into individual segments to avoid large jumps in pos

                    let lines = [];
                    if (timeframe.lines) {
                        let segment = null;
                        let segmentDt = 0;
                        const segmentMax = 3 * timeframe.mins * 60;
                        vessel.track.forEach(t => {

                            // start a new line segment
                            const interval = Math.abs(t.dt - segmentDt);
                            if (interval > segmentMax) {
                                if (segment != null && segment.length > 1) {
                                    lines.push(segment);
                                }
                                segment = [];
                            }

                            // push the point to a segment
                            let p = [t.lat, t.lon];
                            segmentDt = t.dt;
                            segment.push(p);
                        });

                        // clean up
                        if (segment != null && segment.length > 1) {
                            lines.push(segment);
                        }
                    }
                    vessel.lines = lines;

                    // select color based on the org - if QF2 then
                    // use multicolors otherwise use default color
                    // thats been set from the database
                    if (org.value === settings.defaultOrg) {
                        vessel.info.icon = GetIcon(settings.colors.get(vessel.info.name));
                        vessel.info.color = GetColor(settings.colors.get(vessel.info.name));
                        newColors.set(vessel.info.name, { label: vessel.info.name, icon: vessel.info.icon, color: vessel.info.color });
                    } else {
                        vessel.info.icon = GetIcon(vessel.info.color);
                        vessel.info.color = GetColor(vessel.info.color);
                        newColors.set(vessel.info.org, {
                            label: vessel.info.org,
                            icon: vessel.info.icon,
                            color: vessel.info.color,
                        });
                    }
                });

                // store for ron
                setTracks(newTracks);
                setColors(newColors);
                Log("history", "refresh ok");
            })
            .catch((err) => {
                Log("history refresh error", err);
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
            }, settings.refreshMillis);
            return () => {
                clearTimeout(refreshTimer.current);
            }
        }, settings.startupMillis);
        return () => {
            clearTimeout(startupTimer.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // refresh track data when org or timeframes change
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org, timeframe]);

    // ----------------------------------------------------------------------------------------------------

    function SideBar({ map }) {

        const onClick = useCallback(() => {
            map.setView(settings.position, settings.zoom)
        }, [map])

        const handleOrgChange = (selected) => {
            setOrg(selected);
        }

        const handleTimeChange = (selected) => {
            setTimeframe(selected);
        }

        return (
            <div className="sidebar panel">

                <p className="sidebar-label left">Fleet:</p>
                <Select
                    className="select-btn left"
                    options={settings.fleets}
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    defaultValue={org}
                    onChange={handleOrgChange}
                />
                <p className="sidebar-label left">Timeframe:</p>
                <Select className="select-btn left"
                    options={settings.timeframe}
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    defaultValue={timeframe}
                    onChange={handleTimeChange}
                />
                <br />
                <Legend className="center" colors={colors} />
                <button className="sidebar-reset" onClick={onClick}>
                    <IconContext.Provider value={{ color: "#999", size: "16px" }}>
                        <Icon name={"Undo"} />
                    </IconContext.Provider>
                </button>
            </div>
        )
    }

    const displayMap = useMemo(
        () => (
            <div className="map panel">
                <MapContainer
                    ref={setMap}
                    zoom={settings.zoom}
                    center={settings.position}
                    style={settings.style}
                    scrollWheelZoom={settings.useScrollWheel}
                    attributionControl={settings.attribution}
                >
                    <LayersControl position="topright">
                        <BaseLayers isChecked="Simple" />
                        <LayersControl.Overlay name="Vessels" checked>
                            <Tracks
                                map={map}
                                tracks={tracks}
                                isVisible={isVisible}
                            />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Nav Marks">
                            <TileLayer
                                url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                            />
                        </LayersControl.Overlay>
                    </LayersControl>
                    <Control position="bottomleft">
                        <Next key="btn-index" link="/dashboard" icon="Globe" classes="next-button" styles={{ color: "#999", size: "30px" }} />
                    </Control>
                    <div className="leaflet-bottom leaflet-right">
                        <Coords />
                    </div>
                </MapContainer>
            </div>
        ),
        [map, tracks, isVisible],
    );

    return (
        <div className="page">
            {displayMap}
            {map ? <SideBar map={map} /> : null}
        </div>
    )
}

export default History;
