import React from "react";

/**
 * Displays weather icon
 * "weather": { "icon": "04d", "label": "Broken Clouds", "temp": 22.42 },
 **/
function Weather({ icon, label, temperature }) {
    return (
        <div className="wrapper weather">
            <img className="icon" src={`icons/${icon}.png`} alt={label} />
            <div className="label">{label}</div>
            <div className="numeral">{Math.round(temperature)}</div>
            <div className="celcius">&#959; C</div>
        </div>
    );
}

Weather.defaultProps = {
    icon: 0,
    label: "",
    temp: 0
}

export default Weather;
