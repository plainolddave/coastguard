import React, { useState } from "react";
import { MapContainer, LayersControl } from "react-leaflet";
import Control from "react-leaflet-custom-control";
import Next from "./../Common/Next"
import Coords from "./../Common/Coords"
import BaseLayers from "./BaseLayers";
import OverLayers from "./OverLayers";

const settings = {
    position: { lat: -27.33, lng: 153.27 },
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20,
    style: { height: "100%", width: "100%" },
    attribution: false
}

function MapPanel(props) {

    const [map, setMap] = useState(null)

    //const handleClick = (name) => {
    //    if (active === name) {
    //        setActive(null);
    //    } else {
    //        setActive(name);
    //    }
    //};

    return (
        < MapContainer
            ref={setMap}
            zoom={settings.zoom}
            center={settings.position}
            style={settings.style}
            scrollWheelZoom={settings.useScrollWheel}
            attributionControl={settings.attribution}
        >
            <LayersControl position="topright">
                <BaseLayers /> 
                {map ? <OverLayers map={map} isChecked="Satellite" /> : <></>} 
            </LayersControl>
            <Control position="bottomleft">
                <Next link="/history" icon="Globe" classes="next-button" styles={{ color: "#999", size: "30px" }}/>
            </Control>
            <div className="leaflet-bottom leaflet-right">
                <Coords />
            </div>
        </MapContainer >
    )
}

export default MapPanel
