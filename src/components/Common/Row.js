import React, { useMemo } from "react";
import { IconContext } from "react-icons";
import * as dayjs from 'dayjs'
import Icon from "./Icon"

/**
 * Displays a row of statistics - 
 * icons are from https://react-icons.github.io/react-icons/icons?name=wi
 * and https://erikflowers.github.io/weather-icons/
 **/
function Row({ label, value, rowStyle, iconStyle, iconRotation}) {

    const getIcon = (label, value) => {
        let name = label;
        switch (label) {
            case 'Wind':
            case 'Gust':
                if (value < 1) {
                    name = "Wind0";
                } else if (value < 4) {
                    name = "Wind1";
                } else if (value < 7) {
                    name = "Wind2";
                } else if (value < 11) {
                    name = "Wind3";
                } else if (value < 17) {
                    name = "Wind4";
                } else if (value < 22) {
                    name = "Wind5";
                } else if (value < 28) {
                    name = "Wind6";
                } else if (value < 34) {
                    name = "Wind7";
                } else if (value < 41) {
                    name = "Wind8";
                } else if (value < 48) {
                    name = "Wind9";
                } else if (value < 56) {
                    name = "Wind10";
                } else if (value < 64) {
                    name = "Wind11";
                } else {
                    name = "Wind12";
                }
                break;
            case "Pressure":
                name = "None";
                break;
            case "Tide":
                if (value.type === "High" || value.type === "Low") {
                    name = value.type;
                } else {
                    name = "Place";
                }
                break;
            default:
                break; // use the label 'as is'
        };
        return <Icon name={name} />;
    };

    function getValue(label, value = {}) {
        switch (label) {
            case 'Temp':
                return <>{Math.round(value)}</>;
            case 'Wind':
            case 'Gust':
                return <>{Math.round(value)}</>;
            case 'Sunrise':
            case 'Sunset':
                return <>{dayjs.unix(value).format("HH:mm")}</>;
            case 'Place':
                if (value.dt === 0) return "";
                return <>{dayjs.unix(value.dt).format("HH:mm")}</>;
            case 'Tide':
                // Tide value is passed as an object with properties:
                // { "height": 0.274, "dt": 1665160299, "type": "Low" }
                if (value.height == null) {
                    return "";
                }
                return <>{value.height.toFixed(2)}</>;
            default:
                return value;
        }
    }

    function getUnit(label) {
        switch (label) {
            case 'Temp':
                return <>&nbsp;&#176;<sup>c</sup></>;
            case 'Wind':
            case 'Gust':
                return <>&nbsp;<sup>kts</sup></>;
            case 'Pressure':
                return <>&nbsp;<sup>hPa</sup></>;
            case 'Humidity':
            case 'Cloud':
                return <>&nbsp;<sup>%</sup></>;
            case 'Tide':
                return <>&nbsp;<sup>m</sup></>;
            default:
                return "";
        }
    }

    // Tide value is passed as an object with properties:
    // { "height": 0.274, "dt": 1665160299, "type": "Low" }
    function getLabel(label, value, rowStyle) {
        if (rowStyle === "forecast-row")
            return "";
        else if (label === "Tide") {
            let label = value.type;
            if (label === "High" || label === "Low") {
                label += ` at ${dayjs.unix(value.dt).format("HH:mm")}`;
            }
            return label;
        } else if (label === "Place") {
            return value.place;
        } else {
            return label;
        }
    }

    function getRotation(iconRotation) {
        if (iconRotation === 0)
            return({});

        return ({
            transform: `rotate(${iconRotation}deg)`,
            transition: 'transform 150ms ease'
        });
    }

    const rowIcon = useMemo(() => getIcon(label, value), [label, value]);
    const rowValue = useMemo(() => getValue(label, value), [label, value]);
    const rowUnit = useMemo(() => getUnit(label), [label]);
    const rowLabel = useMemo(() => getLabel(label, value, rowStyle), [label, value, rowStyle]);
    const rotation = useMemo(() => getRotation(iconRotation), [iconRotation]);

    return (
        <div className={rowStyle} >
            <div className="icon">
                <IconContext.Provider value={iconStyle}>
                    <div style={rotation}>
                        {rowIcon}
                    </div>
                </IconContext.Provider>
            </div>
            <div className="label left">{rowLabel}</div>
            <div className="value">{rowValue}</div>
            <div className="unit">{rowUnit}</div>
        </div>
    );
}

Row.defaultProps = {
    label: "",
    value: {},
    rowStyle: "data-row",
    iconStyle: {
        color: "white",
        size: "36px",
        verticalAlign: "middle"
    },
    iconRotation: 0
}

export default Row;
