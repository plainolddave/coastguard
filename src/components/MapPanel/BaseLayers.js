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

function CartoCDN() {
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

function BaseLayers({ map }) {

    return (
        <>
            <BaseLayer name="CartoCDN" className="left">
                <CartoCDN />
            </BaseLayer>
            <BaseLayer checked name="JawgLight">
                <JawgLight />
            </BaseLayer>
            <BaseLayer name="OpenStreetMap">
                <OpenStreetMap />
            </BaseLayer>
        </>
    );
}

BaseLayers.defaultProps = {
    map: null
}

export default BaseLayers;