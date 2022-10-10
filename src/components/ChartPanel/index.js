import React, { Component } from 'react'
import PressureChart from "./PressureChart"
import TideChart from "./TideChart"
import WindChart from "./WindChart"

//import Spacer from "./../App/Spacer"
//const settings = {
//    spacerHeight:"0px",
//    spacerWidth:"100%"
//}

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
