import React, { Component } from 'react'
import { Log } from "./../App/Helpers"
import Spacer from "./../App/Spacer"
import Forecast from "./Forecast.js"
import Weather from "./Weather.js"
import Clock from "./Clock.js"
import Stats from "./Stats.js"
import axios from "axios";

const settings = {
    url: "https://coastguard.netlify.app/.netlify/functions/weather",
    refreshMillis: 1000 * 60 * 1,  // 1 min
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
 *      "dt": 1665206160, 
 *      "wind": { "knots": 17.01, "direction": 30 }, 
 *      "weather": { "icon": "04d", "label": "Broken Clouds", "temp": 24.35 }, 
 *      "stats": { "sunrise_dt": 1665170347, "sunset_dt": 1665215425, "cloud": 75, "pressure": 1017, "humidity": 64, "temp": 24.35 } 
 *  }]
 **/
class StatsPanel extends Component {

    constructor(props) {
        super(props);
        this.refreshTimer = null;
        this.state = {
            obs: {
                "dt": 0,
                "wind": { "knots": 0, "direction": 0 },
                "weather": { "icon": "01d", "label": "Fine", "temp": 0.0 },
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
        this.refresh();
        this.refreshTimer = setInterval(
            () => this.refresh(),
            settings.refreshMillis
        );
    }

    componentWillUnmount() {
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
        let wx = this.state.obs.weather;
        let stats = this.state.obs.stats;

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
                <Spacer height={settings.spacerHeight1} width={settings.spacerWidth } />
                <Stats
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