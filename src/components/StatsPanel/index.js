import React, { useEffect, useState, useCallback, useRef } from "react";
import { Log } from "./../Common/Utils"
import Spacer from "./../Common/Spacer"
import Forecast from "./Forecast"
import Weather from "./Weather"
import Clock from "./Clock"
import Stats from "./Stats"
import axios from "axios";

const settings = {
    url: "https://coastguard.netlify.app/.netlify/functions/weather",
    startupMillis: 1000,           // soft start
    refreshMillis: 1000 * 60 * 10, // n mins
    maxErrors: 5,
    spacerHeight1: "10px",
    spacerHeight2: "10px",
    spacerWidth: "100%",
    default: {
        "dt": 0,
        "name": "",
        "wind": { "knots": 0, "direction": 0 },
        "weather": { "icon": "01d", "label": "", "temp": 0.0 },
        "stats": {
            "sunrise": 0,
            "sunset": 0,
            "cloud": 0,
            "pressure": 0,
            "humidity": 0,
            "temp": 0
        },
        "default": true
    }
}

// ----------------------------------------------------------------------------------------------------
// displays statistics about the weather
function StatsPanel({
    isVisible,
    ...restProps }) {

    // data received from the server
    let [obs, setObs] = useState(settings.default);
    const refreshTimer = useRef(null);

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // suspend refresh when page is not visible
        if (!isVisible && obs.default !== true) return;

        // get the current weather observations
        Log("stats", settings.url);
        axios.get(settings.url)
            .then((response) => {
                setObs(response.data[0]); // always returns an array
            })
            .catch((err) => {
                Log("stats error", err);
            });

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
    }, []);

    // ----------------------------------------------------------------------------------------------------
    // return the component
    return (
        <div className="stats panel">
            <Clock
                sunrise={obs.stats.sunrise}
                sunset={obs.stats.sunset} />
            <Weather
                icon={obs.weather.icon}
                label={obs.weather.label}
                temperature={obs.weather.temp}
            />
            <Spacer height={settings.spacerHeight1} width={settings.spacerWidth} />
            <Stats
                place={obs.place}
                dt={obs.dt}
                pressure={obs.stats.pressure}
                humidity={obs.stats.humidity}
                cloud={obs.stats.cloud}
                sunrise={obs.stats.sunrise_dt}
                sunset={obs.stats.sunset_dt}
            />
            <Spacer height={settings.spacerHeight2} width={settings.spacerWidth} />
            <Forecast isVisible={isVisible} />
        </ div>
    )
}

export default StatsPanel