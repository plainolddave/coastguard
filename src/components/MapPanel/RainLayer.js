import React, { Component, createRef } from 'react'
import { LayerGroup, TileLayer } from "react-leaflet";
import { Log, LogJSON } from "./../Common/Utils"
import axios from "axios";

const settings = {
    startupMillis: 10000,           // soft start
    refreshMillis: 1000 * 60 * 5,   // updates
    animateMillis: 500,             // animation
    animateFrames: 1,               // 5, TODO animation is disabled temporarily
    animateTotal: 10,
    rainOn: 0.2,
    rainOff: 0.0,
    rainSize: 512,
    rainColor: 6,
    rainSmooth: 1,
    rainSnow: 1
}

class RainLayer extends Component {

    constructor(props) {
        super(props);
        this.mounted = false;
        this.requestRef = axios.CancelToken.source();
        this.layerGroupRef = createRef();
        this.statupTimer = null;
        this.refreshTimer = null;
        this.animateTimer = null;
        this.animateIsOn = true;
        this.animateFrame = 0;
        this.state = {
            frames: [],
            opacity: []
        };
    }

    componentDidMount() {
        if (this.mounted) {
            Log("rain", "already mounted");
            return;
        }
        this.mounted = true;
        //Log("rain", "mounted");

        this.startupTimer = setTimeout(
            () => {
                // initial refresh
                this.requestRef = axios.CancelToken.source();
                this.refresh();

                // start the refresh timer 
                this.refreshTimer = setInterval(
                    () => this.refresh(),
                    settings.refreshMillis
                );

                // start the animation timer
                if (settings.animateFrames > 1) {
                    this.animateTimer = setInterval(
                        () => this.animate(),
                        settings.animateMillis
                    );
                }
            },
            settings.startupMillis
        );
    }

    componentWillUnmount() {
        this.requestRef.cancel();
        clearInterval(this.startupTimer);
        clearInterval(this.refreshTimer);
        clearInterval(this.animateTimer);
        this.refreshTimer = null;
        this.animateTimer = null;
        this.mounted = false;
        //Log("rain", "unmounted");
    }

    // -------------------------------------------------------------------------------

    refresh = () => {

        // Get the current timestamps from https://api.rainviewer.com/public/maps.json
        // as an array of unix timestamps like [1662181200, 1662181800, 1662182400 ... ]
        axios.get("https://api.rainviewer.com/public/maps.json", {
            cancelToken: this.requestRef.token,
        })
            .then((response) => {
                // check the output for basic errors - we're expecting
                // timestamps = [1662181200, 1662181800, 1662182400 ... ]
                let timestamps = response.data;
                if (!Array.isArray(timestamps)
                    || timestamps.length === 0
                    || Number.isNaN(timestamps[0])
                    || Number.isNaN(timestamps[timestamps.length - 1])) {
                    throw new Error("invalid response");
                }
                timestamps.sort(function (a, b) { return a - b });

                // reset the arrays holding opacity and timestamp values
                let frames = [];
                let opacity = [];
                if (timestamps.length >= settings.animateFrames && settings.animateFrames > 1) {
                    for (let i = timestamps.length - settings.animateFrames; i < timestamps.length; i++) {
                        frames.push(timestamps[i]);
                        opacity.push(settings.rainOff);
                    }
                } else {
                    frames.push(timestamps[timestamps.length - 1]);
                    opacity.push(settings.rainOn);
                }

                // save the state and trigger a re-render
                this.animateFrame = 0;
                this.setState({
                    'frames': frames,
                    'opacity': opacity
                })
                LogJSON("rain refresh frames", frames);
            })
            .catch((err) => {
                Log("rain error", err);
            })
            .finally(() => {
                this.requestRef = axios.CancelToken.source()
            });
    };

    // -------------------------------------------------------------------------------

    animate = () => {

        // only animate if there are enough frames
        if (this.animateIsOn !== true || this.state.frames.length < settings.animateFrames) {
            return;
        }

        try {
            // decide the next frame
            this.animateFrame = this.animateFrame < settings.animateTotal - 1 ? this.animateFrame + 1 : 0;

            // create an array of opacity values, with one on
            let opacity = new Array(this.state.frames.length).fill(settings.rainOff)
            opacity[(this.animateFrame < this.state.frames.length ? this.animateFrame : this.state.frames.length - 1)] = settings.rainOn;
            this.setState({
                'opacity': opacity
            })
        } catch (err) {
            Log("rain animate", err);
        }
        //Log("rain", { animate: (this.animateIsOn ? "on" : "off"), frame: this.animateFrame, frames: JSON.stringify(this.state.frames) });
    }

    // -------------------------------------------------------------------------------

    render = () => {

        this.layerRefs = [];
        //Log("rain render", { frames: this.state.frames, refs: this.layerRefs.length });

        return <LayerGroup ref={this.layerGroupRef}>
            {this.state.frames.map((timestamp, index) =>
                <TileLayer
                    key={`rn-${timestamp}`}
                    attribution='<a href="https://www.rainviewer.com/">RainViewer</a>'
                    url={`https://tilecache.rainviewer.com/v2/radar/${timestamp}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png`}
                    opacity={this.state.opacity[index]}
                    size={settings.rainSize}
                    color={settings.rainColor} // https://www.rainviewer.com/api.html#colorSchemes
                    smooth={settings.rainSmooth}
                    snow={settings.rainSnow}
                    zIndex={900}
                />
            )}
        </LayerGroup>
    }
}
export default RainLayer
