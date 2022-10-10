import React from "react";
import DataRow from "./../App/DataRow"

/**
 * Displays weather statistics
 *
 * data: "stats": { "sunrise_dt": 1665170347, "sunset_dt": 1665215425, "cloud": 75, "pressure": 1017, "humidity": 64, "temp": 24.35 } 
 *
 */
function Stats({ pressure, humidity, cloud, sunrise, sunset }) {
    return (
        <div className="wrapper">
            <DataRow label="Pressure" value={pressure} />
            <DataRow label="Humidity" value={humidity} />
            <DataRow label="Cloud" value={cloud} />
            <DataRow label="Sunrise" value={sunrise} />
            <DataRow label="Sunset" value={sunset} />
        </div>
    );
}

Stats.defaultProps = {
    sunrise: new Date(2022, 1, 1, 0, 0, 0, 0),
    sunset: new Date(2022, 1, 1, 0, 0, 0, 0),
    pressure: 0,
    humidity: 0,
    cloud: 0
}

export default Stats;