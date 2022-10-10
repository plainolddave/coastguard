import React, { Component } from "react";
import { ButtonGroup, Button, Tooltip } from "@mui/material";
import { MapContainer, TileLayer } from "react-leaflet";

// Refer to https://github.com/chris-m92/react-leaflet-custom-control
import Control from "react-leaflet-custom-control";
import RainLayer from "./RainLayer"
import TrackLayer from "./TrackLayer"
import { WiRainMix } from "react-icons/wi";
import { Log } from "./../App/Helpers"

const settings = {
    position: { lat: -27.33, lng: 153.27 },
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20
}

class MapPanel extends Component {

    constructor(props) {
        super(props);
        this.state = {
            animate: false
        };
    }

    toggle = () => {
        console.log("toggle");
        let animate = this.state.animate === true ? false : true;
        this.setState({ 'animate': animate });
    };

    render = () => {

        Log("map", "render");
        return (
            <MapContainer
                animate={false}
                zoom={settings.zoom}
                center={settings.position}
                attributionControl={false}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={settings.useScrollWheel} >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    maxZoom={settings.maxZoom}
                />
                <RainLayer name="Rain" animate={this.state.animate} />
                <TrackLayer name="Vessels" />
                <Control position="topright">
                    <ButtonGroup orientation="vertical" variant="contained">
                        <Tooltip placement="left" title="Animate rain">
                            <Button id="rainButton" color="inherit" onClick={this.toggle} variant="contained">
                                <WiRainMix />
                            </Button>
                        </Tooltip>
                    </ButtonGroup>
                </Control>
            </MapContainer>
        );
    }
}

export default MapPanel

//<div className="App">
//    <CssBaseline />
//    <Box
//        sx={{
//            display: "flex",
//            flexDirection: "column",
//            width: "100vw",
//            height: "100vh"
//        }}
//    >
//        <Box sx={{ flexGrow: 1 }}>
//            <MapContainer
//                animate={false}
//                zoom={settings.zoom}
//                center={settings.position}
//                attributionControl={false}
//                style={{ height: "100%", width: "100%" }}
//                scrollWheelZoom={settings.useScrollWheel}
//            >
//                <TileLayer
//                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
//                    subdomains="abcd"
//                    maxZoom={settings.maxZoom}
//                />
//                <RainLayer name="Rain" />
//                <TrackLayer name="Vessels" />
//                <Control position="topright">
//                    <ButtonGroup orientation="vertical" variant="contained">
//                        <Tooltip placement="left" title="Adjust">
//                            <Button
//                                color={active === "adjust" ? "primary" : "inherit"}
//                                onClick={() => handleClick("adjust")}
//                                variant="contained"
//                            >
//                                <AdjustIcon />
//                            </Button>
//                        </Tooltip>
//                        <Tooltip placement="left" title="Cast">
//                            <Button
//                                color={active === "cast" ? "primary" : "inherit"}
//                                onClick={() => handleClick("cast")}
//                                variant="contained"
//                            >
//                                <CastConnectedIcon />
//                            </Button>
//                        </Tooltip>
//                    </ButtonGroup>
//                </Control>
//                <Control position="topright">
//                    <ButtonGroup orientation="vertical" variant="contained">
//                        <Tooltip placement="left" title="Fullscreen">
//                            <Button color="inherit">
//                                <FullscreenIcon />
//                            </Button>
//                        </Tooltip>
//                    </ButtonGroup>
//                </Control>
//            </MapContainer>
//        </Box>
//    </Box>
//</div>