import React, { Component, createRef } from 'react'
import styles from "./../App/styles.css"
import PressureChart from "./PressureChart"
import TideChart from "./TideChart"
import WindChart from "./WindChart"
import Spacer from "./../App/Spacer"

const settings = {
    spacerHeight:"0px",
    spacerWidth:"100%"
}

class ChartPanel extends Component {

    constructor(props) {
        super(props);
    }

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
