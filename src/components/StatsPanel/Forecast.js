import React, { useEffect, useState, useCallback, useRef } from "react";
import * as dayjs from 'dayjs'
import axios from "axios";
import Row from "./../Common/Row"
import { Log } from "./../Common/Utils"

const settings = {
    startupMillis: 1000,            // soft start msec
    refreshMillis: 1000 * 60 * 60,  // 1 hour
    hoursFrom: -3,                  // now minus n hours
    hoursTo: 9.5,                   // now plus n hours
    url: "https://coastguard.netlify.app/.netlify/functions/forecast"
}

// ----------------------------------------------------------------------------------------------------
// displays weather forecast
function Forecast({ isVisible, ...restProps }) {

    // data received from the server
    let [forecast, setForecast] = useState([]);
    const refreshTimer = useRef(null);

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // suspend refresh when page is not visible
        if (!isVisible) return;

        const dtFrom = Math.floor(Date.now() / 1000 + 60 * 60 * settings.hoursFrom); 
        const dtTo = Math.floor(Date.now() / 1000 + 60 * 60 * settings.hoursTo); 
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    // ----------------------------------------------------------------------------------------------------
    // soft start a timer to periodically refresh data
    useEffect(() => {

        setTimeout(() => {

            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            }

            refreshTimer.current = setInterval(function refresh() {
                onRefresh();
                return refresh;
            }(), settings.refreshMillis);

            return () => {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            };

        }, settings.startupMillis);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    // ----------------------------------------------------------------------------------------------------
    // return the component
    return (
        <div className="wrapper">
            <div className="label center">Forecast</div>
            <div className="forecast">
                {forecast.map(({ dt, icon, label, temp, wind, pressure }) => (
                    <div className="forecast-column" key={`fc-${dt}`}>
                        <div className="time label">{`${dayjs.unix(dt).format("HH:mm")}`}</div>
                        <div className="icon"><img src={`icons/${icon}.png`} alt={`${label}`} /></div>
                        <div className="desc label">{label}</div>
                        <Row className="temp" label="Temp" value={temp} rowStyle="forecast-row" />
                        <Row className="wind" label="Wind" value={wind.knots} rowStyle="forecast-row" iconRotation={0} />
                        <Row className="pressure" label="PressureForecast" value={pressure} rowStyle="forecast-row" />
                        {/*<Row className="wind" label="Wind" value={wind.knots} rowStyle="forecast-row" iconRotation={wind.direction} />*/}
                        {/*<Row className="gust" label="Gust" value={wind.gust} rowStyle="forecast-row" />*/}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Forecast;
