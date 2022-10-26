import React, { Component } from 'react'
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
    refreshMillis: 1000 * 60 * 2,  // 2 mins
    maxErrors: 5,
    spacerHeight1: "10px",
    spacerHeight2: "10px",
    spacerWidth: "100%"
}

/**
 * Displays statistics about the weather
 *
 * url: https://coastguard.netlify.app/.netlify/functions/weather
 * data:
 *  [{  
 *      "dt": 1665206160, "name":"Manly",
 *      "wind": { "knots": 17.01, "direction": 30 }, 
 *      "weather": { "icon": "04d", "label": "Broken Clouds", "temp": 24.35 }, 
 *      "stats": { "sunrise_dt": 1665170347, "sunset_dt": 1665215425, "cloud": 75, "pressure": 1017, "humidity": 64, "temp": 24.35 } 
 *  }]
 **/
class StatsPanel extends Component {

    constructor(props) {
        super(props);
        this.statupTimer = null;
        this.refreshTimer = null;
        this.state = {
            obs: {
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
                }
            }
        }
    }

    componentDidMount() {

        this.startupTimer = setTimeout(
            () => {
                // initial refresh
                this.refresh();

                // start the refresh timer 
                this.refreshTimer = setInterval(
                    () => this.refresh(),
                    settings.refreshMillis
                );
            },
            settings.startupMillis
        );
    }

    componentWillUnmount() {
        clearInterval(this.startupTimer);
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
    }

    // -------------------------------------------------------------------------------

    refresh = () => {

        //Get the current weather observations
        Log("stats", settings.url);
        axios.get(settings.url)
            .then((response) => {
                let obs = response.data[0]; // always returns an array
                //console.log(`stats: ${JSON.stringify(response.data)}`);
                this.setState({
                    obs: obs
                })
            })
            .catch((err) => {
                Log("stats error", err);
            });
    };

    render = () => {
        let obs = this.state.obs;
        let wx = obs.weather;
        let stats = obs.stats;

        return (
            <>
                <Clock
                    sunrise={stats.sunrise}
                    sunset={stats.sunset} />
                <Weather
                    icon={wx.icon}
                    label={wx.label}
                    temperature={wx.temp}
                />
                <Spacer height={settings.spacerHeight1} width={settings.spacerWidth} />
                <Stats
                    place={obs.place}
                    dt={obs.dt}
                    pressure={stats.pressure}
                    humidity={stats.humidity}
                    cloud={stats.cloud}
                    sunrise={stats.sunrise_dt}
                    sunset={stats.sunset_dt}
                />
                <Spacer height={settings.spacerHeight2} width={settings.spacerWidth} />
                <Forecast />
            </>
        )
    }
}

export default StatsPanel