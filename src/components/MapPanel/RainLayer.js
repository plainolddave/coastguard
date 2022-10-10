import React, { Component, createRef } from 'react'
import { LayerGroup, TileLayer } from "react-leaflet";
import { Log } from "./../App/Helpers"
import axios from "axios";

const settings = {
    refreshMillis: 1000 * 60 * 5,   // updates
    tickMillis: 500,                // animation
    rainOn: 0.5,
    rainOff: 0.01,
    rainSize: 512,
    rainColor: 6,
    rainSmooth: 1,
    rainSnow: 1,
    overrun: 20,
    maxErrors: 3
}

class RainLayer extends Component {

    constructor(props) {
        super(props);
        this.layerGroupRef = createRef();
        this.layerRefs = [];
        this.layerIndex = 0; 
        this.tickTimer = null;
        this.refreshTimer = null;
        this.refreshErrors = 0;
        this.state = {
            timestamps: [],
            opacity: new Map()
        };
    }

    componentDidMount() {
        this.refresh();
        this.refreshTimer = setInterval(
            () => this.refresh(),
            settings.refreshMillis
        );
        this.tickTimer = setInterval(
            () => this.tick(),
            settings.tickMillis
        );
    }

    componentWillUnmount() {
        clearInterval(this.refreshTimer);
        clearInterval(this.tickTimer);
        this.refreshTimer = null;
        this.tickTimer = null;
    }

    // -------------------------------------------------------------------------------

    refresh = () => {

        // Get the current timestamps from https://api.rainviewer.com/public/maps.json
        // as an array of unix timestamps like [1662181200, 1662181800, 1662182400 ... ]
        axios.get("https://api.rainviewer.com/public/maps.json")
            .then((response) => {
                // check the output for basic errors - we're expecting
                // timestamps = [1662181200, 1662181800, 1662182400 ... ]
                let timestamps = response.data;
                Log("rain", timestamps);

                if (Array.isArray(timestamps)) {
                    if (timestamps.length > 0) {
                        if (!Number.isNaN(timestamps[0])
                            && !Number.isNaN(timestamps[timestamps.length - 1])) {
                            this.layerRefs = [];

                            // reset opacity
                            let opacity = this.state.opacity;
                            let lastTimestamp = 0;
                            opacity.clear();
                            timestamps.forEach(timestamp => {
                                opacity.set(timestamp, settings.rainOff);
                                if (timestamp > lastTimestamp)
                                    lastTimestamp = timestamp;
                            });

                            // set the last frame 'on'
                            opacity.set(lastTimestamp, settings.rainOn);

                            // save the state and trigger a re-render
                            this.setState({
                                'timestamps': timestamps,
                                'opacity': opacity
                            })
                            this.refreshErrors = 0;
                            return true;
                        }
                    }
                }
                this.refreshError('invalid response');
            })
            .catch((err) => {
                this.refreshError(err);
            });
    };

    refreshError = (err) => {
        this.refreshErrors++;
        Log("rain error",`count: ${this.refreshErrors} error: ${err}`);
        if (this.rainRefreshErrors >= settings.maxErrors) {
            Log("rain error", `too many errors - clearing all frames`);
            this.setState({
                timestamps: [],
                opacity: new Map()
            })
        }
    }
      
    // -------------------------------------------------------------------------------

    tick = () => {
        if (this.props.animate === true) {
            try {
                let opacity = this.state.opacity;
                let index = this.layerIndex >= this.state.timestamps.length
                    ? this.state.timestamps.length - 1
                    : this.layerIndex;
                opacity.set(this.state.timestamps[index], settings.rainOff);

                this.layerIndex = this.layerIndex < (this.state.timestamps.length + settings.overrun)
                    ? this.layerIndex + 1
                    : 0;

                if (this.layerIndex >= this.state.timestamps.length) {
                    opacity.set(
                        this.state.timestamps[this.state.timestamps.length - 1],
                        settings.rainOn);
                } else {
                    opacity.set(
                        this.state.timestamps[this.layerIndex],
                        settings.rainOn);
                }
                this.setState({ 'opacity': opacity });

            } catch (err) {
                console.log(`rain exception ${err}`);
            }
        }
    }

    // -------------------------------------------------------------------------------

    getOpacity = (timestamp) => {
        let value = this.state.opacity.get(timestamp);
        if (value == null) return settings.rainOff;
        return value;
    }

    render = () => {

        Log("track", "render");
        this.layerRefs = [];
        return <LayerGroup ref={this.layerGroupRef}>
            {this.state.timestamps.map((timestamp, index) =>
                <TileLayer
                    ref={(ref) => this.layerRefs.push(ref)}
                    key={`rn-${timestamp}`}
                    attribution='<a href="https://www.rainviewer.com/">RainViewer</a>'
                    url={`https://tilecache.rainviewer.com/v2/radar/${timestamp}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png`}
                    opacity={this.getOpacity(timestamp)}
                    size={settings.rainSize} 
                    color={settings.rainColor} // https://www.rainviewer.com/api.html#colorSchemes
                    smooth={settings.rainSmooth}
                    snow={settings.rainSnow}
                />
            )}
        </LayerGroup>
    }
}

export default RainLayer
