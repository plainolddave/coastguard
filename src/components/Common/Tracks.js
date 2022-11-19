import React, { useMemo } from "react";
import { LayerGroup, Polyline, Marker, Popup, Tooltip, CircleMarker } from "react-leaflet";
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

function Tracks({
    map = null,
    tracks = [],
    showMarkers = true,
    format = settings.format,
    ...restProps }) {

    const displayMarker = (vessel) => (
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

    const displayTracks = useMemo(() => (
        <>
            {tracks.map((vessel, index) =>
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
                    {(showMarkers ? displayMarker(vessel) : <></>)}
                </LayerGroup>
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
