import React, { Component } from 'react'
import PressureChart from "./PressureChart"
import TideChart from "./TideChart"
import WindChart from "./WindChart"
import "./../../index.css"

const settings = {
    windRoseWidth: 300,
    windRoseHeight: 300,
    chartHeight: 110,
    tideHeight: 160
};

class ChartPanel extends Component {

    render = () => {
        return (
            <>
                <WindChart
                    windRoseWidth={settings.windRoseWidth}
                    windRoseHeight={settings.windRoseHeight}
                    chartHeight={settings.chartHeight}
                />
                <PressureChart chartHeight={settings.chartHeight} />
                <TideChart chartHeight={settings.tideHeight} />
            </>
        )
    }
}

export default ChartPanel
