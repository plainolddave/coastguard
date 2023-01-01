import React from 'react';
import L from 'leaflet';
import { Marker, Polygon } from 'react-leaflet';

const settings = {
    polygonOptions: {
        opacity: 0.0,
        color: "white",
        fillColor: 'white',
    }
};

function GraticuleText({
    positions = null,
    text = "",
    textOptions = {
        color: 'white',
        opacity: 0.5,
        anchor: [-5, 20]
    },
    ...restProps }) {

    if (positions == null) return (<></>);

    const iconPos = L.polygon(positions).getBounds().getSouthWest(); //.getCenter(); 
    const iconText = L.divIcon({ className: 'graticule-icon', html: text, iconAnchor: textOptions.anchor });

    return (
        <Polygon positions={positions} pathOptions={settings.polygonOptions}>
            <Marker opacity={textOptions.opacity} position={iconPos} icon={iconText} />
        </Polygon>
    );

}

export default GraticuleText