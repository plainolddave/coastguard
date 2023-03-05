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
            <text x={0} y={-radius} textAnchor="middle"
                fill="white" fontSize={fontSize}>
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
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={valueSize}
                fontWeight={valueWeight}
            >
                {value}
            </text>
            <text x="0" y={unitY}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize={unitSize}
                fontWeight={unitWeight}
            >
                {units}
            </text>
        </g>
    )
};

const Label = ({ value, fill, size, weight, anchor, x, y }) => {
    return (
        <g>
            <text x={x} y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill={fill}
                fontSize={size}
                fontWeight={weight}
            >
                {value}
            </text>
        </g>
    )
};

export { Dial, Border, Dot, Numeral, Tick, Label }