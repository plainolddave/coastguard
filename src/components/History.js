import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { MapContainer, LayersControl, TileLayer } from "react-leaflet"
import Control from "react-leaflet-custom-control"
import { IconContext } from "react-icons"
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import * as dayjs from 'dayjs'
import * as axios from 'axios'

import Icon from "./Common/Icon"
import Next from "./Common/Next"
import Tracks from "./Common/Tracks"
import Legend from "./Common/Legend"
import Coords from "./Common/Coords"
import Loader from "./Common/Loader"
import LocalIP from "./Common/LocalIP"
import BaseLayers from "./MapPanel/BaseLayers"
import { Log, PositionBounds } from "./Common/Utils"
import { GetColor, GetIcon } from "./MapPanel/TrackIcon"

const settings = {
    //position: [-27.33, 153.27],
    //zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 15,
    mapBounds: [[-27.0, 153.0], [-27.6, 153.6]],
    mapBoundsOptions: {
        maxZoom: 15,
        padding: [0, 0],
        animate: true,
        duration: 1.0,
        easeLinearity: 0.1
    },
    style: { height: "100%", width: "100%" },
    attribution: false,
    startupMillis: 1000,             // soft start timer
    refreshMillis: 1000 * 60 * 10,   // updates every n minutes 
    minimumSOG: 0.2,                 // minimum speed over ground
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    defaultFleet: 0,
    defaultTimeframe: 2,
    showMarkers: false,
    fleets: [
        { value: 'QF2', label: 'QF2 Brisbane' },
        { value: 'SAR', label: 'Marine Rescue' },
        { value: 'ALL', label: 'All Vessels' }
    ],
    timeframe: [
        { value: '24H', mins: 1, line: true, label: '24 hours' },
        { value: '7D', mins: 1, line: true, label: '7 days' },
        { value: '30D', mins: 1, line: true, label: '30 days' },
        { value: '0M', mins: 1, line: true, label: 'This month' },
        { value: '1M', mins: 1, line: false, label: 'Last month' },
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

function History({ isVisible }) {

    const [timeframe, setTimeframe] = useState(settings.timeframe[settings.defaultTimeframe]);
    const [bounds, setBounds] = useState(new PositionBounds(settings.mapBounds));
    const [org, setOrg] = useState(settings.fleets[settings.defaultFleet]);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [colors, setColors] = useState(new Map());
    const [tracks, setTracks] = useState([]);
    const [map, setMap] = useState(null);

    const startupTimer = useRef(null);
    const refreshTimer = useRef(null);
    const requestRef = useRef(axios.CancelToken.source());

    function refresh() {

        // only animate if the page is active
        if (!isVisible) return;

        setIsLoading(true);
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
                url += `&to=${dayjs().startOf("month").unix()-1}`;
                break;
            case '2M':  // last 2 calendar months
                url += `?from=${dayjs().subtract(2, "month").startOf("month").unix()}`;
                url += `&to=${dayjs().startOf("month").unix()-1}`;
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

                let newTracks = response.data.tracks;
                let newColors = new Map();
                let newBounds = new PositionBounds();
                const defaultOrg = (settings.fleets[settings.defaultFleet]).value;

                // make sure the vessel positions are sorted by time, in reverse order
                newTracks.forEach((vessel) => {
                    vessel.track.sort((a, b) => b.dt - a.dt);
                    vessel.pos = vessel.track[0];

                    // check track, and if more than three missed transmissions break
                    // the track into individual segments to avoid large jumps in pos
                    let lines = [];
                    let segment = null;
                    let segmentDt = 0;
                    const segmentMax = 3 * timeframe.mins * 60;
                    vessel.track.forEach(t => {
                        if (timeframe.line) {
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
                        }
                        // keep track of the map bounds
                        newBounds.push(t.lat, t.lon);
                    });

                    // clean up
                    if (segment != null && segment.length > 1) {
                        lines.push(segment);
                    }
                    vessel.lines = lines;

                    // select color based on the org - if QF2 then
                    // use multicolors otherwise use default color
                    // thats been set from the database
                    if (org.value === defaultOrg) {
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
                setFromDate(new Date(response.data.from));
                setToDate(new Date(response.data.to));

                // set the map bounds
                if (newBounds.isSensible) {
                    setBounds(newBounds);
                }
                //Log("history", "refresh completed ok");
            })
            .catch((err) => {
                Log("history refresh error", err);
            })
            .finally(() => {
                requestRef.current = axios.CancelToken.source()
                setIsLoading(false);
            })
    };

    function fitBounds(map, bounds) {
        if (map) {
            //Log("history fit bounds", bounds.toString());
            map.flyToBounds(bounds.box, settings.mapBoundsOptions);
            map.invalidateSize(true);
        }
    }

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

    // automatically move the map boundaries when track data changes
    useEffect(() => {
        fitBounds(map, bounds);
    }, [map, bounds]);

    // ----------------------------------------------------------------------------------------------------

    function SideBar({ map, bounds }) {

        const onClick = useCallback(() => {
            fitBounds(map, bounds);
        }, [map, bounds])

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
                <br />
                <Legend className="center" colors={colors} fromDate={fromDate} toDate={toDate} />
                <button className="sidebar-reset" onClick={onClick}>
                    <IconContext.Provider value={{ color: "#999", size: "16px" }}>
                        <Icon name={"Undo"} />
                    </IconContext.Provider>
                </button>
                <br />
                <LocalIP classes="sidebar-ip" />
            </div>
        )
    }

    const displayMap = useMemo(
        () => (
            <div className="map panel">
                <MapContainer
                    ref={setMap}
                    bounds={bounds.box}
                    style={settings.style}
                    scrollWheelZoom={settings.useScrollWheel}
                    attributionControl={settings.attribution}
                    trackResize={true}
                    zoomSnap={0.5}
                    className="map-container"
                >
                    <LayersControl position="topright">
                        <BaseLayers isChecked="Simple" />
                        <LayersControl.Overlay name="Vessels" checked>
                            <Tracks
                                map={map}
                                tracks={tracks}
                                isVisible={isVisible}
                                showMarkers={settings.showMarkers}
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [map, tracks, isVisible],
    );

    return (
        <div className="page">
            <Loader isLoading={isLoading} />
            {displayMap}
            {map ? <SideBar map={map} bounds={bounds} /> : null}
        </div>
    )
}

export default History;
