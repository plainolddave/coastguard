import React from "react"
import MapPanel from "./../components/MapPanel";
import StatsPanel from "./../components/StatsPanel";
import ChartPanel from "./../components/ChartPanel";
import "./../index.css"

function Dashboard({ isVisible }) {

    return (
        <div className="page">
            <div className="map panel">
                <MapPanel isVisible={isVisible} />
            </div>
            <div className="chart panel">
                <ChartPanel isVisible={isVisible} />
            </div>
            <div className="stats panel">
                <StatsPanel isVisible={isVisible} />
            </div>
        </div>
    );
}

export default Dashboard;

