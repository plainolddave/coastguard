import React, { useEffect, useState, useLayoutEffect } from "react";
import axios from "axios";
import * as dayjs from 'dayjs'
import DataRow from "./../App/DataRow";
import { GetTimeOffset, RoundToPrecision, Log } from "./../App/Helpers";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Label,
    CartesianGrid,
    ReferenceLine,
    ResponsiveContainer
} from "recharts";

const settings = {
    refreshMillis: 1000 * 60 * 60,      // get new data from the server once an hour
    recalcMillis: 1000 * 60,            // recalculate current tide height each 1/2 minute
    tickSeconds: 2 * 60 * 60,           // interval for chart ticks
    fromHours: -12,                     // use a window of tide information n hours behind now()
    toHours: 12,                        // use a window of tide information n hours ahead of now()
    url: "https://coastguard.netlify.app/.netlify/functions/tide",
    heightOffset: 1.328,
    fontSize: 16,
    fontColor: "white",
    numberPrecision: 2,
    yAxisTicks: [0.5, 1.0, 1.5, 2.0, 2.5]
};

/**
 * Displays tides
 *
 * url: https://coastguard.netlify.app/.netlify/functions/tide?limit=100&from=1665165923&to=1665252323&offset=1.328
 * data:
 * tide: {
        "heights": [
            { "height": 0.544, "dt": 1665165600 }, 
            { "height": 0.957, "dt": 1665169200 }, ...etc...
        ],
        "extremes": [
            { "height": 2.103, "dt": 1665181233, "type": "High" }, 
            { "height": 0.345, "dt": 1665203277, "type": "Low" }, ...etc...
        ],
        "station": "Brisbane Bar",
        "from": 1665165407,
        "to": 1665251807,
        "offset": 1.328
 *
 **/

class TideChart extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            date: new Date(),
            heights: [],    // tide data received from the server
            extremes: [],   // tide data received from the server
            tideNow: { height: 0, dt: 0, type: "" },     // current height
            prevTide: { height: 0, dt: 0, type: "" },   // previous tide state info
            nextTide: { height: 0, dt: 0, type: "" },   // next tide state info
            station: ""
        };
    }

    // ----------------------------------------------------------------------------------------------------
    // recalculate tide data displayed in the react component
    recalc() {

        // get the current time in unix seconds
        const seconds = Math.round(Date.now() / 1000);
        let heights = this.state.heights;
        let extremes = this.state.extremes;
        let tideNow = null;
        let prevTide = null;
        let nextTide = null;

        // approximate the current tide height
        for (var i = 0; i < heights.length; i++) {

            // find the index of the next reading 
            if (heights[i].dt < seconds) { continue; }

            // get the previous and next times and heights
            const prevTime = heights[i - 1].dt;
            const nextTime = heights[i].dt;
            const prevHeight = heights[i - 1].height;
            const nextHeight = heights[i].height;

            // interpolate - not great but not too bad if readings are spaced say an hour or less apart
            let height = prevHeight + ((seconds - prevTime) / (nextTime - prevTime)) * (nextHeight - prevHeight);
            tideNow = {
                "height": RoundToPrecision(height, settings.numberPrecision),
                "dt": seconds,
                "type": this.state.station  // just a label...
            };
            break;
        }

        // find the previous and next extreme heights
        for (var i = 0; i < extremes.length; i++) {

            // find the index of the next reading 
            if (extremes[i].dt < seconds) { continue; }

            // get the previous and next times and heights
            prevTide = extremes[i - 1];
            nextTide = extremes[i];
            break;
        }

        //console.log(`tide recalc: ${JSON.stringify(tideNow)}`);
        this.setState({
            tideNow: (tideNow == null ? this.state.tideNow : tideNow),
            prevTide: (prevTide == null ? this.state.prevTide : prevTide),
            nextTide: (nextTide == null ? this.state.nextTide : nextTide)
        });
    };

    // ----------------------------------------------------------------------------------------------------
    // refresh tide data from the server

    refresh() {

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        const timeTo = GetTimeOffset(settings.toHours);
        const dtTo = Math.floor(timeTo.getTime() / 1000);

        let url = `${settings.url}?limit=100&from=${dtFrom}&to=${dtTo}&offset=${settings.heightOffset}`;
        Log("tide", url);

        axios.get(url)
            .then((response) => {

                let data = response.data;
                this.setState({
                    heights: data.heights,
                    extremes: data.extremes,
                    station: data.station
                }, this.recalc);

                //console.log(`tide: ${JSON.stringify(response.data)}`);
            })
            .catch((err) => {
                Log("tide error", err);
            });
    };

    // ----------------------------------------------------------------------------------------------------

    componentDidMount() {
        this.recalcID = setInterval(
            () => this.recalc(),
            settings.recalcMillis
        );
        this.refreshID = setInterval(
            () => this.refresh(),
            settings.refreshMillis
        );
        this.refresh();
    }

    componentWillUnmount() {
        clearInterval(this.refreshID);
        clearInterval(this.recalcID);
    }

    // ----------------------------------------------------------------------------------------------------

    formatXAxis = item => {
        return dayjs.unix(item).format('HH:mm');
    }

    formatYAxis = item => {
        return item.toFixed(1);
    }

    getXAxisTicks = () => {

        // get the start tick for the next even increment
        const dtFrom = GetTimeOffset(settings.fromHours).getTime() / 1000 + settings.tickSeconds;
        const dtTo = GetTimeOffset(settings.toHours).getTime() / 1000;
        let dtTick = Math.floor(dtFrom / settings.tickSeconds) * settings.tickSeconds;
        let tickArray = [];
        while (dtTick < dtTo) {
            tickArray.push(dtTick);
            dtTick += settings.tickSeconds;
        }
        //console.log(`tide ticks: ${JSON.stringify(tickArray)}`);
        return tickArray;
    }

    getTideHeightNow() {
        //console.log(`tide now: ${JSON.stringify(this.state.tideNow)}`);
        return this.state.tideNow.height.toFixed(settings.numberPrecision);
    }

    render() {
        return (
            <div className="wrapper">
                <div className="label left">Tide</div>
                <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={this.state.heights}
                        margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorHeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="50%" stopColor="#3A6FCE" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="#1E3E77" stopOpacity={0.7} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="dt"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            scale="time"
                            interval="preserveStart"
                            tickFormatter={this.formatXAxis}
                            angle={0}
                            tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                            ticks={this.getXAxisTicks()}
                            allowDataOverflow={true}
                        />
                        <YAxis
                            type="number"
                            ticks={settings.yAxisTicks}
                            tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                            domain={['dataMin-0.1', 'dataMax']}
                            tickFormatter={this.formatYAxis}
                            interval={0}
                            allowDataOverflow={true}
                        >
                            <Label
                                value='metres'
                                position='insideLeft'
                                angle={-90}
                                style={{
                                    textAnchor: 'middle',
                                    fontSize: settings.fontSize,
                                    fill: 'white'
                                }}
                            />
                        </YAxis>
                        <CartesianGrid stroke="#555555" strokeWidth={1} />
                        <Area
                            type="monotone"
                            dataKey="height"
                            stroke="#3399FF"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorHeight)" />
                        <ReferenceLine
                            x={this.state.tideNow.dt}
                            stroke="white"
                            strokeWidth={3}
                            isFront={true}
                        >
                            <Label
                                value={this.getTideHeightNow()}
                                position="insideRight"
                                position='top'
                                fill={settings.fontColor}
                                fontSize={settings.fontSize}
                            />
                        </ReferenceLine>
                    </AreaChart>
                </ResponsiveContainer>
                <DataRow label="Tide" value={this.state.tideNow} />
                <DataRow label="Tide" value={this.state.prevTide} />
                <DataRow label="Tide" value={this.state.nextTide} />
            </div>
        );
    }
}

export default TideChart;