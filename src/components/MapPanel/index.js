import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { MapContainer, LayersControl, TileLayer } from "react-leaflet";
import Control from "react-leaflet-custom-control";
import axios from "axios";
import Next from "./../Common/Next"
import Coords from "./../Common/Coords"
import BaseLayers from "./BaseLayers";
import Tracks from "./../Common/Tracks"
import Graticule from "./../Common/Graticule"
import { GetTimeOffset, Log, PositionBounds } from "./../Common/Utils"
import RainLayer from "./RainLayer"
import { GetColor, GetIcon } from "./TrackIcon"

const settings = {
    startupMillis: 2500,            // soft start msec
    refreshMillis: 1000 * 60 * 2,   // updates every n minutes
    fromHours: -12,                 // use a window of track info behind now()
    sog: 0.2,                       // minimum speed over ground
    url: "https://coastguard.netlify.app/.netlify/functions/fleet",
    showMarkers: true,
    format: {
        track: {
            weight: 6,
            opacity: 0.8
        },
        circle: {
            radius: 4,
            weight: 2,
            opacity: 1.0
        },
        tooltip: {
            opacity: 1.0,
            offset: [-14, -28],
            direction: "left"
        },
        marker: {
            opacity: 1.0
        }
    },
    mapPosition: { lat: -27.33, lng: 153.27 },
    mapZoom: 10.9,
    mapBounds: [[-27.1, 153.0], [-27.5, 153.5]],
    mapBoundsOptions: {
        maxZoom: 15,
        padding: [0, 0],
        animate: true,
        duration: 1.0,
        easeLinearity: 0.1
    },
    useScrollWheel: true,
    style: { height: "100%", width: "100%" },
    attribution: false,
    zoomSnap: 0.1,
    zIndex: new Map([
        ["QF2", 150],
        ["AVCG", 140],
        ["VMR", 130],
        ["QPS", 120],
        ["Other", 110],
    ])
}

// ----------------------------------------------------------------------------------------------------
// displays a map of vessel tracks
function MapPanel({ isVisible, autoScale, ...restProps }) {

    // data received from the server
    const [map, setMap] = useState(null)
    const [bounds, setBounds] = useState(new PositionBounds(settings.mapBounds));
    const [tracks, setTracks] = useState([]);
    const refreshTimer = useRef(null);

    useEffect(() => {
        if (map && autoScale) {
            //let box = PositionBounds.min(bounds.box, settings.mapBounds);
            console.log(JSON.stringify(bounds.box));
            console.log(JSON.stringify(bounds.clip(settings.mapBounds)));
            map.flyToBounds(bounds.clip(settings.mapBounds), settings.mapBoundsOptions);
            map.invalidateSize(true);
        }
    }, [map, bounds, autoScale]);

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // suspend refresh when page is not visible
        // Log("track visibility", isVisible);
        if (!isVisible && tracks.length > 0) return;

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        const url = `${settings.url}?from=${dtFrom}&sog=${settings.sog}`;
        Log("track", url);

        axios.get(url)
            .then((response) => {

                // make sure the vessel positions are sorted by time, in reverse order
                let newTracks = response.data.tracks;
                let newBounds = new PositionBounds();

                newTracks.forEach((vessel) => {
                    vessel.track.sort((a, b) => b.dt - a.dt);
                    vessel.pos = vessel.track[0];

                    // check track, and if more than three missed transmissions break
                    // the track into individual segments to avoid large jumps in pos
                    let lines = [];
                    let segment = null;
                    let segmentDt = 0;
                    const segmentMax = 3 * 1 * 60;
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

                        // calculate new map bounds
                        newBounds.push(p[0], p[1]);
                    });

                    // clean up
                    if (segment != null && segment.length > 1) {
                        lines.push(segment);
                    }
                    vessel.lines = lines;

                    // select color based on the default color
                    // thats been set from the database
                    vessel.info.icon = GetIcon(vessel.info.color);
                    vessel.info.color = GetColor(vessel.info.color);
                    vessel.info.zIndex = (settings.zIndex.has(vessel.info.org) ? settings.zIndex.get(vessel.info.org) : 100);
                });
                newTracks.sort((a, b) => (a.info.zIndex > b.info.zIndex) ? 1 : -1)
                setTracks(newTracks);
                setBounds(newBounds);
            })
            .catch((err) => {
                Log("track error", err);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

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
    }, []);

    // ----------------------------------------------------------------------------------------------------
    // return the component
    const displayMap = useMemo(
        () => (
            <MapContainer
                ref={setMap}
                zoom={settings.mapZoom}
                center={settings.mapPosition}
                style={settings.style}
                scrollWheelZoom={settings.useScrollWheel}
                attributionControl={settings.attribution}
                trackResize={true}
                zoomSnap={settings.zoomSnap}
                className="map-container"
            >
                <LayersControl position="topright">
                    <BaseLayers isChecked="Satellite" />
                    <LayersControl.Overlay name="Rain">
                        <RainLayer map={map} isVisible={isVisible} />
                    </LayersControl.Overlay>
                    <Tracks
                        map={map}
                        tracks={tracks}
                        isVisible={isVisible}
                        showMarkers={settings.showMarkers}
                        format={settings.format}
                    />
                    <LayersControl.Overlay name="Navigation">
                        <TileLayer
                            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                        />
                    </LayersControl.Overlay>
                    <LayersControl.Overlay name="Grid" checked>
                        <Graticule map={map} bounds={map == null ? null : map.getBounds()} zoom={map == null ? null : map.getZoom()} />
                    </LayersControl.Overlay>
                </LayersControl>
                <Control position="bottomleft">
                    <Next link="/history" icon="Globe" classes="next-button" styles={{ color: "#999", size: "30px" }} />
                </Control>
                <div className="leaflet-bottom leaflet-right">
                    <Coords />
                </div>
            </MapContainer>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [map, tracks, isVisible],
    );

    return (
        <div className="map panel">
            {displayMap}
        </div>
    )
}

export default MapPanel
