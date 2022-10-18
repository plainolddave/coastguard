import React, { useMemo } from "react";
import { LayersControl } from "react-leaflet";
import RainLayer from "./RainLayer"
import TrackLayer from "./TrackLayer"

function OverLayers({ map }) {
    return (
        <>
            <LayersControl.Overlay checked name="Rain">
                <RainLayer map={map} />
            </LayersControl.Overlay>
            <LayersControl.Overlay checked name="Vessels">
                <TrackLayer map={map} />
            </LayersControl.Overlay>
        </>
    );
}

OverLayers.defaultProps = {
    map: null
}

export default OverLayers;
