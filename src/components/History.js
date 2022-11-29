import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { MapContainer, LayersControl, TileLayer } from "react-leaflet"
import Control from "react-leaflet-custom-control"
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import * as axios from 'axios'
import * as dayjs from 'dayjs'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Next from "./Common/Next"
import Tracks from "./Common/Tracks"
import Coords from "./Common/Coords"
import Loader from "./Common/Loader"
import LocalIP from "./Common/LocalIP"
import BaseLayers from "./MapPanel/BaseLayers"
import { Log, PositionBounds } from "./Common/Utils"
import { GetColor, GetIcon } from "./MapPanel/TrackIcon"

// ----------------------------------------------------------------------------------------------------

const PageState = {
    Loaded: 0,
    Loading: 1,
    Stale: 2
}

const Timeframe = {
    Today: 0,
    TwoDays: 1,
    OneWeek: 2,
    FourWeeks: 3,
    ThisMonth: 4,
    LastMonth: 5,
    LastTwoMonths: 6,
    Custom: 7,
}

const Timeframes = new Map([
    [Timeframe.Today, { value: Timeframe.Today, line: true, label: 'Today' }],
    [Timeframe.TwoDays, { value: Timeframe.TwoDays, line: true, label: 'Last 2 days' }],
    [Timeframe.OneWeek, { value: Timeframe.OneWeek, line: true, label: 'Last week' }],
    [Timeframe.FourWeeks, { value: Timeframe.FourWeeks, line: true, label: 'Last 4 weeks' }],
    [Timeframe.ThisMonth, { value: Timeframe.ThisMonth, line: true, label: 'This month' }],
    [Timeframe.LastMonth, { value: Timeframe.LastMonth, line: false, label: 'Previous month' }],
    [Timeframe.LastTwoMonths, { value: Timeframe.LastTwoMonths, line: false, label: 'Previous 2 months' }],
    [Timeframe.Custom, { value: Timeframe.Custom, line: false, label: 'Date range' }],
]);

const Resolution = {
    OneMinute: 1,
    TwoMinutes: 2,
    ThreeMinutes: 3,
}

const Resolutions = new Map([
    [Resolution.ThreeMinutes, { secs: 2678400, mins: 3 }],  // greater than 31 days is grouped in 3 min intervals 
    [Resolution.TwoMinutes, { secs: 1209600, mins: 2 }],    // greater than  7 days is grouped in 2 min intervals
    [Resolution.OneMinute, { secs: 0, mins: 1 }],           // up to 7 days is grouped in 1 min intervals
]);

// ----------------------------------------------------------------------------------------------------
// general settings for the component
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
    showMarkers: false,
}

const animatedComponents = makeAnimated();

// automatically move the map boundaries to fit the current track data
function fitBounds(map, bounds) {
    if (map) {
        map.flyToBounds(bounds.box, settings.mapBoundsOptions);
        map.invalidateSize(true);
    }
}

function History({ isVisible, ...restProps }) {

    const [timeframe, setTimeframe] = useState(Timeframes.get(Timeframe.OneWeek));
    const [bounds, setBounds] = useState(new PositionBounds(settings.mapBounds));
    const [pageState, setPageState] = useState(PageState.Loaded);
    const [fromDate, setFromDate] = useState(dayjs().subtract(7, "day").startOf("day"));
    const [toDate, setToDate] = useState(dayjs().endOf("day"));
    const [colors, setColors] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [orgOptions, setOrgOptions] = useState([{ value: 'QF2', label: 'Loading...' }]);
    const [org, setOrg] = useState(orgOptions[0]);
    const [map, setMap] = useState(null);
    const refreshTimer = useRef(null);
    const requestRef = useRef(axios.CancelToken.source());

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // only animate if the page is active
        //Log("history visibility", isVisible);
        if (!isVisible) return;

        setPageState(PageState.Loading);
        let url = settings.url;

        // from -> to
        const fromSecs = fromDate.unix();
        const toSecs = toDate.unix();
        url += `?from=${fromSecs}&to=${toSecs}`;

        //resolution
        const duration = toSecs - fromSecs;
        let resolutionMins = Resolutions.get(Resolution.OneMinute).mins;
        Array.from(Resolutions.values()).every((r) => {
            if (duration > r.secs) {
                resolutionMins = r.mins;
                return false;
            }
            return true;
        });
        url += `&mins=${resolutionMins}`;

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

                // make sure the vessel positions are sorted by time, in reverse order
                newTracks.forEach((vessel) => {
                    vessel.track.sort((a, b) => b.dt - a.dt);
                    vessel.pos = vessel.track[0];

                    // check track, and if more than three missed transmissions break
                    // the track into individual segments to avoid large jumps in pos
                    let lines = [];
                    let segment = null;
                    let segmentDt = 0;
                    const segmentMax = 3 * resolutionMins * 60;
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
                    if (org.value === "QF2") {
                        vessel.info.icon = GetIcon(vessel.info.style.vesselColor);
                        vessel.info.color = GetColor(vessel.info.style.vesselColor);
                        vessel.info.zIndex = vessel.info.style.zIndex;
                        newColors.set(vessel.info.name, {
                            label: vessel.info.name,
                            icon: vessel.info.icon,
                            color: vessel.info.color
                        });
                    } else {
                        vessel.info.icon = GetIcon(vessel.info.style.orgColor);
                        vessel.info.color = GetColor(vessel.info.style.orgColor);
                        vessel.info.zIndex = vessel.info.style.zindex;
                        newColors.set(vessel.info.org, {
                            label: vessel.info.org,
                            icon: vessel.info.icon,
                            color: vessel.info.color,
                        });
                    }
                });

                // sort and store for ron
                newTracks = newTracks.sort((a, b) => (a.info.zIndex > b.info.zIndex) ? 1 : -1)
                setTracks(newTracks);

                // sort and store for ron, as an array
                newColors = Array.from(newColors.values()).sort((a, b) => (a.label > b.label) ? 1 : -1)
                setColors(newColors);

                // save-the-date like charles from brooklyn99
                setFromDate(dayjs(response.data.from));
                setToDate(dayjs(response.data.to));

                //save the org
                if (response.data.org) {
                    setOrgOptions(response.data.org.options);
                    setOrg(response.data.org.options[response.data.org.value]);
                };

                // set the map bounds
                if (newBounds.isSensible) {
                    setBounds(newBounds);
                }
            })
            .catch((err) => {
                Log("history refresh error", err);
            })
            .finally(() => {
                requestRef.current = axios.CancelToken.source()
                setPageState(PageState.Loaded);
            });
    }, [isVisible, org, timeframe, fromDate, toDate]);

    // ----------------------------------------------------------------------------------------------------
    // soft start a timer to periodically refresh data
    useEffect(() => {
        setTimeout(() => {

            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            }

            refreshTimer.current = setInterval(function refresh() {

                // refresh if the page is loaded (not currently refreshing or stale)
                if (pageState === PageState.Loaded) {
                    onRefresh();
                }

                // function calls itself at startup
                return refresh;
            }(), settings.refreshMillis);

            return () => {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            };

        }, settings.startupMillis);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    // refresh track data on startup
    useEffect(() => {
        onRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // automatically move the map boundaries when track data changes
    useEffect(() => {
        fitBounds(map, bounds);
    }, [map, bounds]);

    // update the dates when timeframe changes
    useEffect(() => {
        switch (timeframe.value) {
            case Timeframe.Today:  // today
                setFromDate(dayjs().startOf("day"));
                setToDate(dayjs().endOf("day"));
                break;
            case Timeframe.TwoDays:  // last 2 days
                setFromDate(dayjs().subtract(1, "day").startOf("day"));
                setToDate(dayjs().endOf("day"));
                break;
            case Timeframe.OneWeek:  // last week
                setFromDate(dayjs().subtract(7, "day").startOf("day"));
                setToDate(dayjs().endOf("day"));
                break;
            case Timeframe.FourWeeks:  // last 4 weeks
                setFromDate(dayjs().subtract(28, "day").startOf("day"));
                setToDate(dayjs().endOf("day"));
                break;
            case Timeframe.ThisMonth:  // this month
                setFromDate(dayjs().startOf("month"));
                setToDate(dayjs().endOf("month"));
                break;
            case Timeframe.LastMonth:  // previous calendar month
                setFromDate(dayjs().subtract(1, "month").startOf("month"));
                setToDate(dayjs().subtract(1, "month").endOf("month"));
                break;
            case Timeframe.LastTwoMonths:  // previous 2 calendar months
                setFromDate(dayjs().subtract(2, "month").startOf("month"));
                setToDate(dayjs().subtract(1, "month").endOf("month"));
                break;
            case Timeframe.Custom: // custom date range
            default:
                break;
        }
    }, [timeframe]);

    // update the timeframe when dates change
    //const onDateChange = useCallback(() => {

    //    if (fromDate.isSame(dayjs().startOf("day"), 'second')
    //        && toDate.isSame(dayjs().endOf("day"), 'second')) {
    //        if (timeframe.value !== Timeframe.Today) {
    //            setTimeframe(Timeframes.get(Timeframe.Today));
    //        }
    //        return;
    //    }

    //    if (fromDate.isSame(dayjs().subtract(1, "day").startOf("day"), 'second')
    //        && toDate.isSame(dayjs().endOf("day"), 'second')) {
    //        if (timeframe.value !== Timeframe.TwoDays) {
    //            setTimeframe(Timeframes.get(Timeframe.TwoDays));
    //        }
    //        return;
    //    }

    //    if (fromDate.isSame(dayjs().subtract(7, "day").startOf("day"), 'second')
    //        && toDate.isSame(dayjs().endOf("day"), 'second')) {
    //        if (timeframe.value !== Timeframe.OneWeek) {
    //            setTimeframe(Timeframes.get(Timeframe.OneWeek));
    //        }
    //        return;
    //    }

    //    if (fromDate.isSame(dayjs().subtract(28, "day").startOf("day"), 'second')
    //        && toDate.isSame(dayjs().endOf("day"), 'second')) {
    //        if (timeframe.value !== Timeframe.FourWeeks) {
    //            setTimeframe(Timeframes.get(Timeframe.FourWeeks));
    //        }
    //        return;
    //    }

    //    if (fromDate.isSame(dayjs().startOf("month").toDate(), 'second')
    //        && toDate.isSame(dayjs().endOf("month").toDate(), 'second')) {
    //        if (timeframe.value !== Timeframe.ThisMonth) {
    //            setTimeframe(Timeframes.get(Timeframe.ThisMonth));
    //        }
    //        return;
    //    }

    //    if (fromDate.isSame(dayjs().subtract(1, "month").startOf("month"), 'second')
    //        && toDate.isSame(dayjs().subtract(1, "month").endOf("month"), 'second')) {
    //        if (timeframe.value !== Timeframe.LastMonth) {
    //            setTimeframe(Timeframes.get(Timeframe.LastMonth));
    //        }
    //        return;
    //    }

    //    if (fromDate.isSame(dayjs().subtract(2, "month").startOf("month"), 'second')
    //        && toDate.isSame(dayjs().subtract(1, "month").endOf("month"), 'second')) {
    //        if (timeframe.value !== Timeframe.LastTwoMonths) {
    //            setTimeframe(Timeframes.get(Timeframe.LastTwoMonths));
    //        }
    //        return;
    //    }

    //    if (timeframe.value !== Timeframe.Custom) {
    //        setTimeframe(Timeframes.get(Timeframe.Custom));
    //    }
    //}, [fromDate, toDate]);

    // ----------------------------------------------------------------------------------------------------

    const sideBar = useMemo(
        () => (
            <div className="sidebar panel">
                <div className="sidebar-label">Fleet:</div>
                <Select
                    className="sidebar-select"
                    options={orgOptions}
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    defaultValue={org}
                    value={org}
                    onChange={(value) => {
                        setOrg(value);
                        setPageState(PageState.Stale);
                    }}
                />
                <div className="sidebar-label">Timeframe:</div>
                <Select
                    className="sidebar-select"
                    options={Array.from(Timeframes.values())}
                    closeMenuOnSelect={true}
                    components={animatedComponents}
                    defaultValue={timeframe}
                    value={timeframe}
                    onChange={(value) => {
                        setTimeframe(value);
                        setPageState(PageState.Stale);
                    }}
                />
                <div className="sidebar-label">From:</div>
                <DatePicker
                    className="sidebar-date"
                    wrapperClassName="sidebar-date-picker"
                    selected={fromDate.toDate()}
                    onChange={(value) => {
                        setFromDate(dayjs(value));
                        setTimeframe(Timeframes.get(Timeframe.Custom));
                        setPageState(PageState.Stale);
                    }}
                />
                <div className="sidebar-label">To:</div>
                <DatePicker
                    className="sidebar-date"
                    wrapperClassName="sidebar-date-picker"
                    selected={toDate.toDate()}
                    minDate={fromDate.toDate()}
                    onChange={(value) => {
                        setToDate(dayjs(value));
                        setTimeframe(Timeframes.get(Timeframe.Custom));
                        setPageState(PageState.Stale);
                    }}
                />
                <div className="sidebar-label">Data:</div>
                <button
                    className={`sidebar-button ${pageState === PageState.Stale ? "enabled" : ""}`}
                    onClick={() => {
                        onRefresh();
                    }}
                >Refresh</button>
                <div className="sidebar-label">Vessels:</div>
                <div className="sidebar-content sidebar-box">
                    {colors.map((value, index) =>
                        <>
                            <img className="sidebar-icon" src={value.icon.url} alt="" />
                            <div className="sidebar-key">{value.label}</div>
                        </>
                    )}
                </div>
                <LocalIP classes="sidebar-ip" />
            </div>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [colors, fromDate, toDate, timeframe, org, orgOptions, pageState]
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
                        <button className="reset-button" onClick={() => { fitBounds(map, bounds); }} >
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
            <Loader isLoading={pageState === PageState.Loading} />
            {displayMap}
            {map ? sideBar : null}
        </div>
    );
}

export default History;
