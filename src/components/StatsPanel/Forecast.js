import React, { useEffect, useState } from "react";
import * as dayjs from 'dayjs'
import axios from "axios";
import DataRow from "./../App/DataRow"
import { Log } from "./../App/Helpers"

const settings = {
    refreshMillis: 1000 * 60 * 60,  // 1 hour
    url: "https://coastguard.netlify.app/.netlify/functions/forecast"
}

/**
 * Displays weather forecast
 *
 * @returns {JSX.Element} Forecast component
 * [{"dt":1664776800,"time":"2022-10-03T06:00:00.000Z",
 * "icon":"03d","label":"Scattered Clouds","temp":19.71,
 * "pressure":1018,"wind":{"knots":13.4,"direction":132,
 * "gust":14.7}},...etc...]
 * 
 * */
function Forecast() {

    let [forecast, setForecast] = useState([]);

    useEffect(() => {
        refresh();
        const refreshTimer = setInterval(() => {
            refresh();
        }, settings.refreshMillis); // update once an hour
        return () => {
            clearInterval(refreshTimer);
        };
    }, []);

    function refresh() {

        const dtFrom = Math.floor(Date.now() / 1000 - 60 * 60 * 3); // now minus 3 hours
        const dtTo = Math.floor(Date.now() / 1000 + 60 * 60 * 6); // now plus 6 hours
        let url = `${settings.url}?from=${dtFrom}&to=${dtTo}&limit=3`;
        Log("forecast", url);

        axios.get(url)
            .then((response) => {
                let data = response.data; // always returns an array
                setForecast(data);
                //console.log(`forecast: ${JSON.stringify(data)}`);
            })
            .catch((err) => {
                Log("forecast error", err);
            });
    };

    return (
        <div className="wrapper">
            <div className="label center">Forecast</div>
            <div className="forecast">
                {forecast.map(({ dt, icon, label, temp, wind }) => (
                    <div className="forecast-column" key={`fc-${dt}`}>
                        <div className="time label">{`${dayjs.unix(dt).format("HH:mm")}`}</div>
                        <div className="icon"><img src={`icons/${icon}.png`} alt={`${label}`} /></div>
                        <div className="desc label">{label}</div>
                        <DataRow className="temp" label="Temp" value={temp} styling="forecast-row" />
                        <DataRow className="wind" label="Wind" value={wind.knots} styling="forecast-row" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Forecast;
