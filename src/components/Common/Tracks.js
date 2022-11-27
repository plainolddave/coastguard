import React, { useMemo } from "react";
import { LayerGroup, LayersControl, Polyline, Marker, Popup, Tooltip, CircleMarker, Pane } from "react-leaflet";
import * as dayjs from 'dayjs'
import { PositionToString, CogToString } from "./Utils"

const settings = {
    format: {
        track: {
            weight: 5,
            opacity: 0.3
        },
        circle: {
            radius: 5,
            weight: 1,
            opacity: 0.5
        },
        tooltip: {
            opacity: 1.0,
            offset: [-14, -28],
            direction: "left"
        },
        marker: {
            opacity: 1.0
        }
    }
}

function displayMarker(vessel, format) {
    return (
        <Marker
            key={`mk_${vessel.mmsi}`}
            position={[vessel.pos.lat, vessel.pos.lon]}
            icon={vessel.info.icon}
            opacity={format.marker.opacity}
        >
            <Tooltip
                className="tooltip"
                offset={format.tooltip.offset}
                key={`tt_${vessel.mmsi}`}
                opacity={format.tooltip.opacity}
                direction={format.tooltip.direction}
                permanent>
                {vessel.info.name}
            </Tooltip>
            <Popup key={`pp_${vessel.mmsi}`}>
                Name: {vessel.info.name}<br />
                MMSI: {vessel.info.mmsi}<br />
                Time: {dayjs.unix(vessel.pos.dt).format("DD MMM YYYY HH:mm")}<br />
                Pos: {PositionToString(vessel.pos.lat, vessel.pos.lon)}<br />
                Course: {CogToString(vessel.pos.cog)}<br />
                Speed: {vessel.pos.sog} kts<br />
            </Popup>
        </Marker>
    );
}

function Tracks({
    map = null,
    tracks = [],
    showMarkers = true,
    format = settings.format,
    ...restProps }) {

    //useEffect(() => {
    //    tracks.forEach((vessel) => {
    //        console.log(`vessel: ${vessel.info.name} org: ${vessel.info.org} index: ${vessel.info.zIndex} `)
    //    });
    //}, [tracks]);

    const displayTracks = useMemo(() => (
        <>
            {tracks.map((vessel, index) =>
                <LayersControl.Overlay name={vessel.info.name} checked>
                    <Pane key={`pn_${vessel.mmsi}`} style={{ zIndex: (vessel.info.zIndex ? vessel.info.zIndex : 100) }}>
                        <LayerGroup key={`lg_${vessel.mmsi}`}>
                            {vessel.lines.map((segment, index) =>
                                <Polyline
                                    key={`tk_${vessel.mmsi}_${index}`}
                                    pathOptions={{ weight: format.track.weight, opacity: format.track.opacity, color: vessel.info.color }}
                                    positions={segment}
                                />
                            )}
                            {vessel.track.map((point, index) =>
                                <CircleMarker
                                    key={`cm_${vessel.mmsi}_${point.dt}`}
                                    center={point}
                                    radius={format.circle.radius}
                                    pathOptions={{ weight: format.circle.weight, opacity: format.circle.opacity, color: vessel.info.color }}
                                >
                                    <Popup key={`pu_${vessel.mmsi}`}>
                                        Name: {vessel.info.name}<br />
                                        MMSI: {vessel.info.mmsi}<br />
                                        Time: {dayjs.unix(point.dt).format("DD MMM YYYY HH:mm")}<br />
                                        Pos: {PositionToString(point.lat, point.lon)}<br />
                                        Course: {CogToString(point.cog)}<br />
                                        Speed: {point.sog} kts<br />
                                    </Popup>
                                </CircleMarker>
                            )}
                            {(showMarkers ? displayMarker(vessel, format) : <></>)}
                        </LayerGroup>
                    </Pane>
                </LayersControl.Overlay>
            )}
        </>),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [tracks, showMarkers],
    );

    return (
        <div className="page">
            {displayTracks}
        </div>
    )
}

export default Tracks;
