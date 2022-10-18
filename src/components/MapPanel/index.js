import React, { Component, useState, useMemo } from "react";
import {
    MapContainer,
    LayersControl,
} from "react-leaflet";

import { Log } from "./../App/Helpers"
import BaseLayers from "./BaseLayers";
import OverLayers from "./OverLayers";

const settings = {
    position: { lat: -27.33, lng: 153.27 },
    zoom: 10.5,
    useScrollWheel: true,
    maxZoom: 20
}

function MapPanel(props) {

    const [map, setMap] = useState(null)
    const [animated, setAnimated] = useState(false)

    //const display = useMemo(
    //    () => (
    //        <>
    //            <LayersControl position="topright">
    //                <BaseLayers />
    //                {map ? <>
    //                    <LayersControl.Overlay checked name="Rain radar">
    //                        <RainLayer2 map={map} animated={animated} />
    //                    </LayersControl.Overlay>
    //                    <LayersControl.Overlay checked name="Vessel tracks">
    //                        <TrackLayer map={map} />
    //                    </LayersControl.Overlay>
    //                </> : null}
    //            </LayersControl>
    //        </>
    //    ),
    //    [{ map, animated }]
    //)

    //const displayOverlays = useMemo(
    //    () => (
    //        <>
    //            <LayersControl position="topright">
    //                <BaseLayers />
    //                {map ? <>
    //                    <LayersControl.Overlay checked name="Rain radar">
    //                        <RainLayer2 map={map} animated={animated} />
    //                    </LayersControl.Overlay>
    //                    <LayersControl.Overlay checked name="Vessel tracks">
    //                        <TrackLayer map={map} />
    //                    </LayersControl.Overlay>
    //                </> : null}
    //            </LayersControl>
    //            <Control position="topright">
    //                <ButtonGroup orientation="vertical" variant="contained">
    //                    <Tooltip placement="left" title="Animate rain">
    //                        <Button id="rainButton" color="inherit" onClick={() => setAnimated((prev) => !prev)} variant="contained">
    //                            <WiRainMix />
    //                        </Button>
    //                    </Tooltip>
    //                </ButtonGroup>
    //            </Control>
    //        </>
    //    ),
    //    [map]
    //)

    Log("map", "render");
    return (
        < MapContainer
            ref={setMap}
            zoom={settings.zoom}
            center={settings.position}
            attributionControl={false}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={settings.useScrollWheel} >
            <LayersControl position="topright">
                <BaseLayers /> 
                {map ? <OverLayers map={map} /> : <></>} 
            </LayersControl>
        </MapContainer >
    )
}

export default MapPanel

/*{ map ? <OverLayers map={map} /> : <></> } */

//class MapPanel extends Component {

//    constructor(props) {
//        super(props);
//        this.state = {
//            animate: false
//        };
//    }

//    toggle = () => {
//        console.log("toggle");
//        let animate = this.state.animate === true ? false : true;
//        this.setState({ 'animate': animate });
//    };

//    render = () => {

//        Log("map", "render");
//        return (
//            <MapContainer
//                animate={false}
//                zoom={settings.zoom}
//                center={settings.position}
//                attributionControl={false}
//                style={{ height: "100%", width: "100%" }}
//                scrollWheelZoom={settings.useScrollWheel} >

//                <LayersControl position="topright">
//                    <BaseLayer name="CartoCDN">
//                        <CartoCDN />
//                    </BaseLayer>
//                    <BaseLayer checked name="JawgLight">
//                        <JawgLight />
//                    </BaseLayer>
//                    <BaseLayer name="OpenStreetMap">
//                        <OpenStreetMap />
//                    </BaseLayer>
//                    <LayersControl.Overlay checked name="Rain radar">
//                        <RainLayer2 name="Rain" animate={this.state.animate} />
//                    </LayersControl.Overlay>
//                    <LayersControl.Overlay checked name="Vessel tracks">
//                        <LayerGroup>
//                            <TrackLayer name="Vessels" />
//                        </LayerGroup>
//                    </LayersControl.Overlay>
//                    <LayersControl.Overlay name="Marker with popup">
//                        <Marker position={center}>
//                            <Popup>
//                                A pretty CSS3 popup. <br /> Easily customizable.
//                            </Popup>
//                        </Marker>
//                    </LayersControl.Overlay>
//                    <LayersControl.Overlay checked name="Layer group with circles">
//                        <LayerGroup>
//                            <Circle
//                                center={center}
//                                pathOptions={{ fillColor: 'blue' }}
//                                radius={200}
//                            />
//                            <Circle
//                                center={center}
//                                pathOptions={{ fillColor: 'red' }}
//                                radius={100}
//                                stroke={false}
//                            />
//                            <LayerGroup>
//                                <Circle
//                                    center={[51.51, -0.08]}
//                                    pathOptions={{ color: 'green', fillColor: 'green' }}
//                                    radius={100}
//                                />
//                            </LayerGroup>
//                        </LayerGroup>
//                    </LayersControl.Overlay>
//                    <LayersControl.Overlay name="Feature group">
//                        <FeatureGroup pathOptions={{ color: 'purple' }}>
//                            <Popup>Popup in FeatureGroup</Popup>
//                            <Circle center={[51.51, -0.06]} radius={200} />
//                            <Rectangle bounds={rectangle} />
//                        </FeatureGroup>
//                    </LayersControl.Overlay>

//                </LayersControl>


//                <Control position="topright">
//                    <ButtonGroup orientation="vertical" variant="contained">
//                        <Tooltip placement="left" title="Animate rain">
//                            <Button id="rainButton" color="inherit" onClick={this.toggle} variant="contained">
//                                <WiRainMix />
//                            </Button>
//                        </Tooltip>
//                    </ButtonGroup>
//                </Control>

//            </MapContainer>
//        );
//    }
//}

//export default MapPanel

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