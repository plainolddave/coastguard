import React from "react"
import MapPanel from "./../components/MapPanel";
import StatsPanel from "./../components/StatsPanel";
import ChartPanel from "./../components/ChartPanel";
import "./../index.css"

function Dashboard() {
    return (
        <div className="page">
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
    );
}

export default Dashboard;

