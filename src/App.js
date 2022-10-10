import React, { Component } from "react"
import MapPanel from "./components/MapPanel";
import StatsPanel from "./components/StatsPanel";
import ChartPanel from "./components/ChartPanel";
import "./App.css"

class App extends Component {
    render() {
        return (
            <div className="App">
                <div className="map panel">
                    <MapPanel />
                </div>
                <div className="chart panel">
                    <ChartPanel />
                </div>
                <div className="stats panel">
                    <StatsPanel />
                </div>
            </div>
        )
    }
}

export default App
