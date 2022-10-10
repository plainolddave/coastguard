import React, { Component } from 'react'
import { ClampAngle, Saturate } from "./../App/Helpers"

/*import Border from "./Border"*/
import { Dot, Numeral, Tick } from "./Components"
import { TestData } from "./Data"

const settings = {
    dotCount: 36,
    dotRadius: 40,
    dotSize: 3.4,
    dotStrokeWidth: 0.8,
    dotStrokeColor: "#FF00FF",
    dotFillColor: "#FF00FF",
    dotScale: [40, 85],
    currentStrokeWidth: 1.0,
    currentStrokeColor: "#FFD700",
    currentFillColor: "#FFD700",
    numeralSize: 30,
    numeralWeight: 700,
    numeralOffset: 0,
    labelSize: 9,
    labelWeight: 600,
    labelOffset: 15,
    tickRadius: 45,
    tickSize: 5,
    ticks: [
        { label: "N", angle: 0 },
        { label: "NE", angle: 45 },
        { label: "E", angle: 90 },
        { label: "SE", angle: 135 },
        { label: "S", angle: 180 },
        { label: "SW", angle: 225 },
        { label: "W", angle: 270 },
        { label: "NW", angle: 315 }]
}

class WindRose extends Component {

    constructor(props) {
        super(props);
        this.state = {
            maxSpeed: 0,
            minSpeed: 0,
            averageSpeed: 0
        };
        this.current = { angle: 0, knots: 0, direction: 0, dt: 0, bucket: 0 };

        // pre-calculate colors and sizes for zero and non-zero dots
        this.dotStrokeColor = [
            Saturate(settings.dotStrokeColor, settings.dotScale[0]),
            Saturate(settings.dotStrokeColor, settings.dotScale[1]),
            settings.currentStrokeColor
        ];

        this.dotFillColor = [
            Saturate(settings.dotFillColor, settings.dotScale[0]),
            Saturate(settings.dotFillColor, settings.dotScale[1]),
            settings.currentFillColor
        ];

        this.dotSize = [
            settings.dotSize * settings.dotScale[0] / 100.0,
            settings.dotSize * settings.dotScale[1] / 100.0,
            settings.dotSize
        ];
    }

    componentDidMount() {
    }

    componentWillUnmount() {
    }


    recalc() {
        //[ { "value": { "knots": 9.99, "direction": 10 }, "dt": 1665277680 },
        //  { "value": { "knots": 9.99, "direction": 10 }, "dt": 1665278160 },
        //  { "value": { "knots": 9.99, "direction": 10 }, "dt": 1665278340 }]

        // build an array of angles around 360 degrees 
        let dots = [];
        const anglePerDot = 360 / settings.dotCount;
        for (let i = 0; i < settings.dotCount; i++) {
            dots.push({
                angleStart: ClampAngle(i * anglePerDot - (anglePerDot * 0.5)),
                angleEnd: ClampAngle(i * anglePerDot + (anglePerDot * 0.5)),
                angle: ClampAngle(i * anglePerDot),
                count: 0
            });
        }

        let maxSpeed = 0;
        let minSpeed = 0;
        let averageSpeed = 0;
        let count = 0;

        // map wind values to each bucket in the angle array
        this.props.data.forEach(reading => {
            const direction = reading.value.direction;
            const speed = reading.value.knots;
            const bucket = Math.floor(ClampAngle(direction + anglePerDot * 0.5) / anglePerDot);
            dots[bucket].count += 1;

            // find the max and min values
            count = dots[bucket].count > count ? dots[bucket].count : count;
            maxSpeed = speed > maxSpeed ? speed : maxSpeed;
            minSpeed = speed < minSpeed ? speed : minSpeed;
            averageSpeed += speed;

            // find the most recent value
            if (reading.dt > this.current.dt) {
                this.current = {
                    direction: reading.value.direction,
                    knots: reading.value.knots,
                    angle: dots[bucket].angle,
                    dt: reading.dt,
                    bucket: bucket
                }
            }
        });
        averageSpeed /= this.props.data.length;

        // do a final pass to set the scale and color for each dot
        dots.forEach(dot => {
            let index = 0;
            if (dot.count > 0) index = 1;
            if (dot.angle === this.current.angle) index = 2;

            dot.strokeColor = this.dotStrokeColor[index];
            dot.fillColor = this.dotFillColor[index];
            dot.size = this.dotSize[index];
        });

        // commit to component state
        this.setState = {
            maxSpeed: maxSpeed,
            minSpeed: minSpeed,
            averageSpeed: averageSpeed
        }
        return dots;
    }

    render = () => {
        return (
            <svg
                width={this.props.width}
                height={this.props.height}
                viewBox="-50 -50 100 100"
            >
                {this.recalc().map(({ angle, size, strokeColor, fillColor }) => (
                    <Dot
                        key={`dt-${angle}`}
                        angle={angle}
                        radius={settings.dotRadius}
                        size={size}
                        strokeWidth={settings.dotStrokeWidth}
                        strokeColor={strokeColor}
                        fillColor={fillColor}
                    />
                ))}
                {settings.ticks.map(({ label, angle }) => (
                    <Tick
                        key={`tk-${angle}`}
                        angle={angle}
                        radius={settings.tickRadius}
                        label={label}
                        fontSize={settings.tickSize}
                    />
                ))}
                <Numeral
                    value={this.current.knots.toFixed(this.props.precision)}
                    valueSize={settings.numeralSize}
                    valueWeight={settings.numeralWeight}
                    valueY={settings.numeralOffset}
                    units="knots"
                    unitSize={settings.labelSize}
                    unitWeight={settings.labelWeight}
                    unitY={settings.labelOffset}
                />
            </svg>
        );
    }
}

WindRose.defaultProps = {
    data: TestData,
    precision: 1,
    width: 300,
    height: 300
};

export default WindRose;

