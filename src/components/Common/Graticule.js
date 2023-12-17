import React, { useState, useEffect, useMemo } from "react";
import { LayerGroup, Polyline, useMapEvents } from "react-leaflet";
import { LatToString, LonToString } from "./Utils"
import GraticuleText from "./GraticuleText"
import { Log } from "./Utils"

const settings = {
    lineOptions: {
        stroke: true,
        color: 'white',
        weight: 2,
        opacity: 0.2
    },
    labelOptions: {
        color: 'white',
        opacity: 0.5,
        anchor: [-5, 20]
    },
    zoomIntervals: [
        { zoom: 2, interval: 30, digits: 0 },
        { zoom: 3, interval: 20, digits: 0 },
        { zoom: 4, interval: 10, digits: 0 },
        { zoom: 5, interval: 5, digits: 0 },
        { zoom: 6, interval: 2, digits: 0 },
        { zoom: 7, interval: 1, digits: 0 },
        { zoom: 8, interval: 30 / 60, digits: 2 },
        { zoom: 9, interval: 20 / 60, digits: 2 },
        { zoom: 10, interval: 20 / 60, digits: 2 },
        { zoom: 11, interval: 10 / 60, digits: 2 },
        { zoom: 12, interval: 10 / 60, digits: 2 },
        { zoom: 13, interval: 5 / 60, digits: 2 },
        { zoom: 15, interval: 2 / 60, digits: 2 },
        { zoom: 17, interval: 1 / 60, digits: 2 }
    ],
    zoomBounds:
    {
        minZoom: -10,
        maxZoom: 14
    }
}

function Graticule({
    map = null,
    zoomBounds = [settings.zoomBounds.minZoom, settings.zoomBounds.maxZoom],
    ...restProps }) {

    const [graticule, setGraticule] = useState([]);
    const [zoom, setZoom] = useState(null);
    const [bounds, setBounds] = useState(null);

    const mapEvents = useMapEvents({
        zoomend: () => {
            setZoom(mapEvents.getZoom());
            setBounds(mapEvents.getBounds());
        },
        dragend: () => {
            setZoom(mapEvents.getZoom());
            setBounds(mapEvents.getBounds());
        },
        moveend: () => {
            setZoom(mapEvents.getZoom());
            setBounds(mapEvents.getBounds());
        },
    });

    useEffect(() => {
        setZoom(mapEvents.getZoom());
        setBounds(mapEvents.getBounds());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map]);

    useEffect(() => {

        if (bounds == null || zoom == null) {
            //console.log("graticule: map is not ready");
            setGraticule([]);
            return;
        }

        if (zoom < zoomBounds[0] || zoom > zoomBounds[1]) {
            //console.log("graticule: outside zoom bounds");
            setGraticule([]);
            return;
        }

        // set up parameters
        var graticuleArray = [];
        var digits;
        var interval;
        var keyStr;

        // get the interval based on zoom level
        for (const zoomInterval of settings.zoomIntervals) {
            interval = zoomInterval.interval;
            digits = zoomInterval.digits;
            if (zoom <= zoomInterval.zoom) {
                break
            }
        }

        Log("map", `graticule: zoom: ${zoom} interval: ${interval} bounds: ${bounds.getNorth()},${bounds.getWest()} / ${bounds.getSouth()},${bounds.getEast()}`);

        // calculate latitude lines
        var lat1 = bounds.getNorth();
        lat1 = Math.ceil(lat1 / interval) * interval; // round to interval
        var lat2 = bounds.getSouth();
        var lon1 = bounds.getWest();
        var lon2 = bounds.getEast();
        while (lat1 > lat2) {
            keyStr = "lat" + graticuleArray.length.toString();
            graticuleArray.push(
                {
                    path: [[lat1, lon1], [lat1, lon2]],
                    labelPos: [[lat1, lon1]],
                    labelText: LatToString(lat1, digits),
                    key: keyStr
                }
            );
            lat1 -= interval;
        }

        // calculate longitude lines
        lat1 = bounds.getNorth();
        lon1 = Math.floor(lon1 / interval) * interval; // round to interval
        while (lon1 < lon2) {
            keyStr = "lon" + graticuleArray.length.toString();
            graticuleArray.push(
                {
                    path: [[lat1, lon1], [lat2, lon1]],
                    labelPos: [[lat2, lon1]],
                    labelText: LonToString(lon1, digits),
                    key: keyStr
                }
            );
            lon1 += interval;
        }
        setGraticule(graticuleArray);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bounds, zoom]);

    const displayGraticule = useMemo(() => (
        <>
            {graticule.map((value, index) =>
                <LayerGroup key={`${value.key}`}>
                    <Polyline pathOptions={settings.lineOptions} positions={value.path} />
                    <GraticuleText positions={value.labelPos} text={value.labelText} textOptions={settings.labelOptions} />
                </LayerGroup>
            )}
        </>
    ), [graticule]);

    return (
        <LayerGroup>
            {displayGraticule}
        </LayerGroup>
    );
}

export default Graticule;
