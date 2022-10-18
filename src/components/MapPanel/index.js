import React, { useState } from "react";
import {
    MapContainer,
    LayersControl,
} from "react-leaflet";

import { Log } from "./../App/Helpers"
import BaseLayers from "./BaseLayers";
import OverLayers from "./OverLayers";

const settings = {
    position: { lat: -27.33, lng: 153.27 },
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20
}

function MapPanel(props) {

    const [map, setMap] = useState(null)

    Log("map", "render");
    return (
        < MapContainer
            ref={setMap}
            zoom={settings.zoom}
            center={settings.position}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={settings.useScrollWheel} >
            <LayersControl position="topright">
                <BaseLayers /> 
                {map ? <OverLayers map={map} /> : <></>} 
            </LayersControl>
        </MapContainer >
    )
}

export default MapPanel
