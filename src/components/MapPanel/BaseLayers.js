import React from "react";
import { TileLayer, LayersControl } from "react-leaflet";
const { BaseLayer } = LayersControl;

function JawgLight() {
    return (
        <TileLayer
            url="https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token={accessToken}"
            subdomains="abcd"
            attribution='<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            minZoom={0}
            maxZoom={22}
            accessToken='crlpZsERClzK5ulO9Dh4fzelh1bDdyamRNxC2CnAV9wS9fnV4ModhR2NG91Xs2sa'
        />
    );
}

function CartoDB() {
    return (
        <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={22}
        />
    );
}

function OpenStreetMap() {
    return (
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href=&quot;https://www.openstreetmap.org/copyright&quot;>OpenStreetMap</a> contributors"
        />
    );
}

function Satellite() {
    return (
        <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
        />
    );
}

function Terrain() {
    return (
        <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri"
            maxZoom={13}
        />
    );
}

function BaseLayers({ map }) {

    return (
        <>
            <BaseLayer name="CartoDB">
                <CartoDB />
            </BaseLayer>
            <BaseLayer name="Jawg Light">
                <JawgLight />
            </BaseLayer>
            <BaseLayer name="Streets">
                <OpenStreetMap />
            </BaseLayer>
            <BaseLayer name="Satellite" checked>
                <Satellite />
            </BaseLayer>
            <BaseLayer name="Terrain">
                <Terrain />
            </BaseLayer>
        </>
    );
}

BaseLayers.defaultProps = {
    map: null
}

export default BaseLayers;