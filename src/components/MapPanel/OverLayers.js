import React from "react";
import { LayersControl, TileLayer } from "react-leaflet";
import RainLayer from "./RainLayer"
import TrackLayer from "./TrackLayer"

function OverLayers({ map, isVisible = true }) {
    return (
        <>
            <LayersControl.Overlay name="Rain">
                <RainLayer map={map} isVisible={isVisible} />
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Vessels" checked>
                <TrackLayer map={map} isVisible={isVisible} />
            </LayersControl.Overlay>
            <LayersControl.Overlay name="Nav Marks" checked>
                <TileLayer
                    url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
                />
            </LayersControl.Overlay>
        </>
    );
}

OverLayers.defaultProps = {
    map: null
}

export default OverLayers;
