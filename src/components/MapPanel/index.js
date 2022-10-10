import React, { Component, createRef } from 'react'
import { MapContainer, TileLayer } from "react-leaflet";
import RainLayer from "./RainLayer"
import TrackLayer from "./TrackLayer"

const settings = {
    position: [-27.33, 153.27],
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20
}

class MapPanel extends Component {

    constructor(props) {
        super(props);
        this.mapRef = createRef()
    }

    render = () => {

        // load the CartoDB_Positron base map - for more basemap options see
        // https://leaflet-extras.github.io/leaflet-providers/preview/
        return (
            <MapContainer center={settings.position} zoom={settings.zoom} scrollWheelZoom={settings.useScrollWheel} ref={this.mapRef}>
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={settings.maxZoom}
                />
                <RainLayer /> 
                <TrackLayer />
            </MapContainer>
        )
    }
}

<TrackLayer />

export default MapPanel