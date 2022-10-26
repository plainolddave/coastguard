import React, { useMemo } from "react";
import { IconContext } from "react-icons";
import * as dayjs from 'dayjs'
import Icon from "./Icon"

/**
 * Displays a row of statistics - 
 * icons are from https://react-icons.github.io/react-icons/icons?name=wi
 * and https://erikflowers.github.io/weather-icons/
 **/
function Row({ label, value, rowStyle, iconStyle}) {

    const getIcon = (label, value) => {
        let name = label;
        switch (label) {
            case 'Wind':
                if (value < 1) {
                    name += "0";
                } else if (value < 4) {
                    name += "1";
                } else if (value < 7) {
                    name += "2";
                } else if (value < 11) {
                    name += "3";
                } else if (value < 17) {
                    name += "4";
                } else if (value < 22) {
                    name += "5";
                } else if (value < 28) {
                    name += "6";
                } else if (value < 34) {
                    name += "7";
                } else if (value < 41) {
                    name += "8";
                } else if (value < 48) {
                    name += "9";
                } else if (value < 56) {
                    name += "10";
                } else if (value < 64) {
                    name += "11";
                } else {
                    name += "12";
                }
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
                return <>{Math.round(value)}&nbsp;</>;
            case 'Wind':
                return <>{Math.round(value)}&nbsp;</>;
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
                return <>&#176;<sup>c</sup></>;
            case 'Wind':
                return <><sup>kts</sup></>;
            case 'Pressure':
                return <><sup>hPa</sup></>;
            case 'Humidity':
            case 'Cloud':
                return <><sup>%</sup></>;
            case 'Tide':
                return <><sup>m</sup></>;
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

    const rowIcon = useMemo(() => getIcon(label, value), [label, value]);
    const rowValue = useMemo(() => getValue(label, value), [label, value]);
    const rowUnit = useMemo(() => getUnit(label), [label]);
    const rowLabel = useMemo(() => getLabel(label, value, rowStyle), [label, value, rowStyle]);

    return (
        <div className={rowStyle} >
            <div className="icon">
                <IconContext.Provider value={iconStyle}>
                    <div>
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
        size: "36px"
    }
}

export default Row;
