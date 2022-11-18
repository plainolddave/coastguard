import React from 'react'
import PressureChart from "./PressureChart"
import TideChart from "./TideChart"
import WindChart from "./WindChart"
import "./../../index.css"

const settings = {
    windRoseWidth: 300,
    windRoseHeight: 300,
    chartHeight: 120,
    tideHeight: 180
};

function ChartPanel({ isVisible, ...restProps }) {
    return (
        <div className="chart panel">
            <WindChart
                windRoseWidth={settings.windRoseWidth}
                windRoseHeight={settings.windRoseHeight}
                chartHeight={settings.chartHeight}
                isVisible={isVisible}
            />
            <PressureChart
                chartHeight={settings.chartHeight}
                isVisible={isVisible}
            />
            <TideChart
                chartHeight={settings.tideHeight}
                isVisible={isVisible}
            />
        </ div>
    )
}

export default ChartPanel
