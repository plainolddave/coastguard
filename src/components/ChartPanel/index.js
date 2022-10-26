import React, { Component } from 'react'
import PressureChart from "./PressureChart"
import TideChart from "./TideChart"
import WindChart from "./WindChart"
import "./../../index.css"

class ChartPanel extends Component {
    render = () => {
        return (
            <>
                <WindChart />
                <PressureChart />
                <TideChart />
            </>
        )
    }
}

export default ChartPanel
