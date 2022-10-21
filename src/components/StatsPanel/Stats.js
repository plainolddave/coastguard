import React from "react";
import DataRow from "./../App/DataRow"

/**
 * Displays weather statistics
 *
 * data: "stats": { "sunrise_dt": 1665170347, "sunset_dt": 1665215425, "cloud": 75, "pressure": 1017, "humidity": 64, "temp": 24.35 } 
 *
 */
function Stats({ place, dt, pressure, humidity, cloud, sunrise, sunset }) {
    return (
        <div className="wrapper">
            <DataRow label="Place" value={{ 'dt': 0, 'place': place }} />
            <DataRow label="Sunrise" value={sunrise} />
            <DataRow label="Sunset" value={sunset} />
            <DataRow label="Pressure" value={pressure} />
            <DataRow label="Humidity" value={humidity} />
            <DataRow label="Cloud" value={cloud} />
        </div>
    );
}

Stats.defaultProps = {
    place: "",
    dt: new Date(2022, 1, 1, 0, 0, 0, 0),
    sunrise: new Date(2022, 1, 1, 0, 0, 0, 0),
    sunset: new Date(2022, 1, 1, 0, 0, 0, 0),
    pressure: 0,
    humidity: 0,
    cloud: 0
}

export default Stats;
