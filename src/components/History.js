import React, { useState, useCallback, useEffect, useMemo } from "react";
import { MapContainer, LayersControl, TileLayer } from "react-leaflet";
import Control from "react-leaflet-custom-control";
import Select from 'react-select'
import makeAnimated from 'react-select/animated';
//import AsyncSelect from 'react-select/async';

import Next from "./Common/Next"
import Tracks from "./Common/Tracks"
import BaseLayers from "./MapPanel/BaseLayers";


const settings = {
    position: [-27.33, 153.27],
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20,
    style: { height: "100%", width: "100%" },
    attribution: false,
    fleets: [
        { value: 'QF2', label: 'QF2 Brisbane' },
        { value: 'SAR', label: 'Marine Rescue' },
        { value: 'All', label: 'All other vessels' }
    ],
    timeframes: [
        { value: '7D', label: '7 days' },
        { value: '30D', label: '30 days' },
        { value: '0M', label: 'This month' },
        { value: '1M', label: 'Last month' },
        { value: '2M', label: 'Last 2 months' }
    ]
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

const animatedComponents = makeAnimated();

function SideBar({ map }) {
    const [position, setPosition] = useState(() => map.getCenter())

    const onClick = useCallback(() => {
        map.setView(settings.position, settings.zoom)
    }, [map])

    const onMove = useCallback(() => {
        setPosition(map.getCenter())
    }, [map])

    useEffect(() => {
        map.on('move', onMove)
        return () => {
            map.off('move', onMove)
        }
    }, [map, onMove])

    return (
        <div className="sidebar panel">
            <p>lat: {position.lat.toFixed(4)}</p>
            <p>lon: {position.lng.toFixed(4)}</p>
            <p><button className="dropbtn" onClick={onClick}>Reset</button></p>
            <p className="sidebar-label left">Fleet:</p>
            <Select
                className="select-btn left"
                options={settings.fleets}
                closeMenuOnSelect={false}
                components={animatedComponents}
                defaultValue={[settings.fleets[0], settings.fleets[1], settings.fleets[2]]}
                isMulti
            />
            <p className="sidebar-label left">Timeframe:</p>
            <p className="sidebar-label left">From: 1 Jan 1970 20:30</p>
            <p className="sidebar-label left">To: 23 Jan 1970 22:30</p>
            <Select className="select-btn left" options={settings.timeframes} />
        </div>
    )
}

function History() {

    const [map, setMap] = useState(null);

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
                            />
                        </LayersControl.Overlay>
                        <LayersControl.Overlay name="Nav Marks" checked>
                            <TileLayer
                                url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                            />
                        </LayersControl.Overlay>
                    </LayersControl>
                    <Control position="bottomleft">
                        <Next key="btn-index" link="/dashboard" icon="Globe" classes="next-button" styles={{ color: "#999", size: "30px" }} />
                    </Control>
                </MapContainer>
            </div>
        ),
        [map],
    );

    return (
        <div className="page">
            {displayMap}
            {map ? <SideBar map={map} /> : null}
        </div>
    )
}

export default History;


//function History(props) {

//    const [map, setMap] = useState(null);

//    return (
//        < MapContainer
//            ref={setMap}
//            zoom={settings.zoom}
//            center={settings.position}
//            attributionControl={settings.attribution}
//            style={settings.style}
//            scrollWheelZoom={settings.useScrollWheel} >
//            <LayersControl position="topright">
//                <BaseLayers />
//                <LayersControl.Overlay name="QF2" checked>
//                    <TrackLayer org="QF2" />
//                </LayersControl.Overlay>
//                <LayersControl.Overlay name="Marine Rescue" checked>
//                    <TrackLayer org="QF2" />
//                </LayersControl.Overlay>
//                <LayersControl.Overlay name="All" checked>
//                    <TrackLayer org="QF2" />
//                </LayersControl.Overlay>
//                <LayersControl.Overlay name="Nav Marks">
//                    <TileLayer
//                        url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
//                    />
//                </LayersControl.Overlay>
//            </LayersControl>
//        </MapContainer >
//    )
//}


