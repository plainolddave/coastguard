import React from "react";
import styles from "./../App/styles.css"
import {
    WiNa,
    WiBarometer,
    WiCloud,
    WiHumidity,
    WiThermometer,
    WiSunrise,
    WiSunset,
    WiWindBeaufort0,
    WiWindBeaufort1,
    WiWindBeaufort2,
    WiWindBeaufort3,
    WiWindBeaufort4,
    WiWindBeaufort5,
    WiWindBeaufort6,
    WiWindBeaufort7,
    WiWindBeaufort8,
    WiWindBeaufort9,
    WiWindBeaufort10,
    WiWindBeaufort11,
    WiWindBeaufort12,
    WiWindBeaufort13,
    WiCelsius,
    WiDirectionUpRight,
    WiDirectionDownRight
} from "react-icons/wi";
import {
    GiHighTide,
    GiLowTide
} from "react-icons/gi";
import {
    GoArrowDown,
    GoArrowUp,
    GoGlobe
} from "react-icons/go";

import { IconContext } from "react-icons";
import * as dayjs from 'dayjs'

/**
 * Displays a row of statistics - 
 * icons are from https://react-icons.github.io/react-icons/icons?name=wi
 * and https://erikflowers.github.io/weather-icons/
 **/
function DataRow({ label, value, styling="data-row" }) {

    function getIcon(label, value = {}) {
        switch (label) {
            case 'Pressure':
                return <WiBarometer />;
            case 'Cloud':
                return <WiCloud />;
            case 'Humidity':
                return <WiHumidity />;
            case 'Temp':
                return <WiThermometer />;
            case 'Sunrise':
                return <WiSunrise />;
            case 'Sunset':
                return <WiSunset />;
            case 'Wind':
                if (value < 1) {
                    return <WiWindBeaufort0 />;
                }
                if (value < 4) {
                    return <WiWindBeaufort1 />;
                }
                if (value < 7) {
                    return <WiWindBeaufort2 />;
                }
                if (value < 11) {
                    return <WiWindBeaufort3 />;
                }
                if (value < 17) {
                    return <WiWindBeaufort4 />;
                }
                if (value < 22) {
                    return <WiWindBeaufort5 />;
                }
                if (value < 28) {
                    return <WiWindBeaufort6 />;
                }
                if (value < 34) {
                    return <WiWindBeaufort7 />;
                }
                if (value < 41) {
                    return <WiWindBeaufort8 />;
                }
                if (value < 48) {
                    return <WiWindBeaufort9 />;
                }
                if (value < 56) {
                    return <WiWindBeaufort10 />;
                }
                if (value < 64) {
                    return <WiWindBeaufort11 />;
                }
                return <WiWindBeaufort12 />;
            case "Tide":
                if (value == null) {
                    return "";
                } else if (value.type == "High") {
                    return <GoArrowUp />;
                } else if (value.type == "Low") {
                    return <GoArrowDown />;
                } else {
                    return <GoGlobe />; 
                }
            default:
                return <WiNa />;
        };
    }

    function getValue(label, value = {}) {
        switch (label) {
            case 'Temp':
                return <>{Math.round(value)}&nbsp;</>;
            case 'Wind':
                return <>{Math.round(value)}&nbsp;</>;
            case 'Sunrise':
            case 'Sunset':
                return <>{dayjs.unix(value).format("HH:mm")}</>;
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
    function getLabel(label, value = {}, styling = "data-row") {
        if (styling == "forecast-row")
            return "";
        else if (label == "Tide") {
            let label = value.type;
            if (label == "High" || label == "Low") {
                label += ` at ${dayjs.unix(value.dt).format("HH:mm")}`;
            }
            return label;
        } else {
            return label;
        }
    }

    //if (label == "Tide") {
    //    console.log(`tide: datarow ${JSON.stringify(value)}`);
    //}

    return (
        <div className={styling} >
            <div className="icon">
                <IconContext.Provider value={{
                    color: "white",
                    className: "global-class-name",
                    size: "36px"
                }}>
                    <div>
                        {getIcon(label, value)}
                    </div>
                </IconContext.Provider>
            </div>
            <div className="label left">{getLabel(label, value, styling)}</div>
            <div className="value">{getValue(label, value)}</div>
            <div className="unit">{getUnit(label)}</div>
        </div>
    );
}

DataRow.defaultProps = {
    label: "",
    value: 0
}

export default DataRow;
