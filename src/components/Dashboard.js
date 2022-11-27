import React from "react"
import MapPanel from "./../components/MapPanel";
import StatsPanel from "./../components/StatsPanel";
import ChartPanel from "./../components/ChartPanel";
import "./../index.css"

function Dashboard({ isVisible, ...restProps }) {
    return (
        <div className="page">
            <MapPanel isVisible={isVisible} autoScale={false} />
            <ChartPanel isVisible={isVisible} />
            <StatsPanel isVisible={isVisible} />
        </div>
    );
}

export default Dashboard;

