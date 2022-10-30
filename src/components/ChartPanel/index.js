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

    constructor(props) {
        super(props);
    }

    render = () => {
        return (
            <>
                <WindChart
                    windRoseWidth={settings.windRoseWidth}
                    windRoseHeight={settings.windRoseHeight}
                    chartHeight={settings.chartHeight}
                    isVisible={this.props.isVisible} 
                />
                <PressureChart
                    chartHeight={settings.chartHeight}
                    isVisible={this.props.isVisible}
                />
                <TideChart
                    chartHeight={settings.tideHeight}
                    isVisible={this.props.isVisible} 
                />
            </>
        )
    }
}

export default ChartPanel
