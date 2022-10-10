import React from 'react'

const Dial = ({ inside, outside }) => (
    <g>
        <circle cx={0} cy={0} r={outside}
            fill="None" stroke="#444444" strokeWidth={0.5} />
        <circle cx={0} cy={0} r={inside}
            fill="None" stroke="#444444" strokeWidth={0.5} />
    </g>
)

const Border = ({ x, y, width, height, border, fill }) => (
    <g>
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={fill}
            stroke={border}
            fillOpacity={0.1}
            strokeOpacity={0.9}
            strokeWidth={1}
        />
    </g>
)

const Dot = ({ angle, radius, size, strokeWidth, strokeColor, fillColor }) => {
    return (
        <g transform={`rotate(${angle})`}>
            <circle cx={0} cy={-radius} r={size}
                fill={fillColor} stroke={strokeColor}
                fillOpacity={0.5}
                strokeOpacity={1.0}
                strokeWidth={strokeWidth} />
        </g>
    )
};

const Tick = ({ angle, radius, label, fontSize }) => {
    return (
        <g transform={`rotate(${angle})`}>
            <text x={0} y={-radius} text-anchor="middle"
                fill="white" font-size={fontSize}>
                {label}
            </text>
        </g>
    )
};

const Numeral = ({ value, units,
    valueSize, valueWeight, valueY,
    unitSize, unitWeight, unitY }) => {
    return (
        <g>
            <text x="0" y={valueY}
                text-anchor="middle"
                dominant-baseline="middle"
                fill="white"
                font-size={valueSize}
                font-weight={valueWeight}
            >
                {value}
            </text>
            <text x="0" y={unitY}
                text-anchor="middle"
                dominant-baseline="middle"
                fill="white"
                font-size={unitSize}
                font-weight={unitWeight}
            >
                {units}
            </text>
        </g>
    )
};

export { Dial, Border, Dot, Numeral, Tick }