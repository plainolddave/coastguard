import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { MapContainer, LayersControl, TileLayer } from "react-leaflet"
import Control from "react-leaflet-custom-control"
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import * as dayjs from 'dayjs'
import * as axios from 'axios'

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
    ]),
    zIndex: new Map([
        ["QF2", 150],
        ["AVCG", 140],
        ["VMR", 130],
        ["QPS", 120],
        ["Other", 110],
    ])
}

const animatedComponents = makeAnimated();

function fitBounds(map, bounds) {
    if (map) {
        //Log("history fit bounds", bounds.toString());
        map.flyToBounds(bounds.box, settings.mapBoundsOptions);
        map.invalidateSize(true);
    }
}

function History({ isVisible, ...restProps }) {

    const [timeframe, setTimeframe] = useState(settings.timeframe[settings.defaultTimeframe]);
    const [bounds, setBounds] = useState(new PositionBounds(settings.mapBounds));
    const [org, setOrg] = useState(settings.fleets[settings.defaultFleet]);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [isLoading, setIsLoading] = useState(false);
    const [colors, setColors] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [map, setMap] = useState(null);
    const refreshTimer = useRef(null);
    const requestRef = useRef(axios.CancelToken.source());

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // only animate if the page is active
        Log("history visibility", isVisible);
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
                url += `&to=${dayjs().startOf("month").unix() - 1}`;
                break;
            case '2M':  // last 2 calendar months
                url += `?from=${dayjs().subtract(2, "month").startOf("month").unix()}`;
                url += `&to=${dayjs().startOf("month").unix() - 1}`;
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
                        vessel.info.zIndex = vessel.info.name;
                        newColors.set(vessel.info.name, { label: vessel.info.name, icon: vessel.info.icon, color: vessel.info.color });
                    } else {
                        vessel.info.icon = GetIcon(vessel.info.color);
                        vessel.info.color = GetColor(vessel.info.color);
                        vessel.info.zIndex = (settings.zIndex.has(vessel.info.org) ? settings.zIndex.get(vessel.info.org) : 100);
                        newColors.set(vessel.info.org, {
                            label: vessel.info.org,
                            icon: vessel.info.icon,
                            color: vessel.info.color,
                        });
                    }
                });

                // sort and store for ron
                //newTracks.forEach((vessel) => { Log("before",vessel.info.name)});
                newTracks = newTracks.sort((a, b) => (a.info.zIndex > b.info.zIndex) ? 1 : -1)
                //newTracks.forEach((vessel) => { Log("after", `name: ${vessel.info.name} index: ${vessel.info.zIndex}`)  });
                setTracks(newTracks);

                // sort and store for ron, as an array
                newColors = Array.from(newColors.values()).sort((a, b) => (a.label > b.label) ? 1 : -1)
                setColors(newColors);

                // save-the-date like charles from brooklyn99
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
            });
    }, [isVisible, org, timeframe]);

    // ----------------------------------------------------------------------------------------------------
    // soft start a timer to periodically refresh data
    useEffect(() => {
        setTimeout(() => {

            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            }

            refreshTimer.current = setInterval(function refresh() {
                onRefresh();
                return refresh;
            }(), settings.refreshMillis);

            return () => {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            };

        }, settings.startupMillis);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    // refresh track data when org or timeframes change
    useEffect(() => {
        //let data = { org: org, timeframe: timeframe };
        //Log("history refresh", JSON.stringify(data));
        onRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org, timeframe]);

    // refresh track data on startup
    useEffect(() => {
        onRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // automatically move the map boundaries when track data changes
    useEffect(() => {
        fitBounds(map, bounds);
    }, [map, bounds]);

    const handleBoundsChange = useCallback(() => {
        //Log("history onclick", JSON.stringify(bounds));
        fitBounds(map, bounds);
    }, [map, bounds]);

    const handleOrgChange = (selected) => {
        //Log("history org", JSON.stringify(selected))
        setOrg(selected);
    };

    const handleTimeChange = (selected) => {
        //Log("history time", JSON.stringify(selected))
        setTimeframe(selected);
    };

    // ----------------------------------------------------------------------------------------------------

    const sideBar = useMemo(
        () => (
            <div className="sidebar panel">
                <p className="sidebar-label left">Fleet:</p>
                <Select
                    className="select-btn left"
                    options={settings.fleets}
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    defaultValue={settings.fleets[settings.defaultFleet]}
                    onChange={handleOrgChange}
                />
                <p className="sidebar-label left">Timeframe:</p>
                <Select className="select-btn left"
                    options={settings.timeframe}
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    defaultValue={settings.timeframe[settings.defaultTimeframe]}
                    onChange={handleTimeChange}
                />
                <br />
                <br />
                <Legend className="center" colors={colors} fromDate={fromDate} toDate={toDate} />
                <br />
                <LocalIP classes="sidebar-ip" />
            </div>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [colors, fromDate, toDate]
    );

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
                        <Tracks
                            map={map}
                            tracks={tracks}
                            showMarkers={settings.showMarkers}
                        />
                        <LayersControl.Overlay name="Nav Marks">
                            <TileLayer
                                url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                            />
                        </LayersControl.Overlay>
                    </LayersControl>
                    <Control position="bottomleft">
                        <button className="reset-button" onClick={handleBoundsChange} >
                            <Next link="" icon="Resize" classes="next-button" styles={{ color: "#999", size: "30px" }} />
                        </button>
                        <Next link="/dashboard" icon="Globe" classes="next-button" styles={{ color: "#999", size: "30px" }} />
                    </Control>
                    <div className="leaflet-bottom leaflet-right">
                        <Coords />
                    </div>
                </MapContainer>
            </div>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [map, tracks, bounds]
    );

    return (
        <div className="page">
            <Loader isLoading={isLoading} />
            {displayMap}
            {map ? sideBar : null}
        </div>
    );
}

export default History;
