import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import * as dayjs from 'dayjs'
import Row from "./../Common/Row";
import { GetTimeOffset, RoundToPrecision, Log, RoundDownToMultiple, RoundUpToMultiple } from "./../Common/Utils";
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
    startupMillis: 700,                 // soft start msec
    refreshMillis: 1000 * 60 * 60,      // get new data from the server once each hour
    recalcMillis: 1000 * 30,            // recalculate current tide height each 1/2 minute
    tickSeconds: 2 * 60 * 60,           // interval for chart ticks
    showHours: 10,                      // hours to show either side of now
    fromHours: -12,                     // get data for tide information n hours behind now()
    toHours: 12,                        // get data for tide information n hours ahead of now()
    url: "https://coastguard.netlify.app/.netlify/functions/tide",
    heightOffset: 0,                    // refer to https://www.msq.qld.gov.au/tides/tidal-datum-information
    fontSize: 16,
    fontColor: "white",
    numberPrecision: 2,
    chartPrecision: 1,
    yAxisTicks: [0.5, 1.0, 1.5, 2.0, 2.5],
    nullTide: { height: 0, dt: 0, type: "" }
};

// ----------------------------------------------------------------------------------------------------
// helper functions
const formatXAxis = item => {
    return dayjs.unix(item).format('HH:mm');
}

const formatYAxis = item => {
    return item.toFixed(settings.chartPrecision);
}

const formatLabel = item => {
    return item.toFixed(settings.numberPrecision);
}

const getXAxisTicks = () => {

    // get the start tick for the next even increment
    const dtFrom = GetTimeOffset(-settings.showHours).getTime() / 1000 + settings.tickSeconds;
    const dtTo = GetTimeOffset(settings.showHours).getTime() / 1000;
    let dtTick = Math.floor(dtFrom / settings.tickSeconds) * settings.tickSeconds;
    let tickArray = [];
    while (dtTick < dtTo) {
        tickArray.push(dtTick);
        dtTick += settings.tickSeconds;
    }

    return tickArray;
}

const getXDomainMin = () => {
    return GetTimeOffset(-settings.showHours).getTime() / 1000;
}

const getXDomainMax = () => {
    return GetTimeOffset(settings.showHours).getTime() / 1000;
}

// ----------------------------------------------------------------------------------------------------

function TideChart({
    chartHeight = settings.chartHeight,
    isVisible = true,
    ...restProps }) {

    let [heights, setHeights] = useState([]);
    let [extremes, setExtremes] = useState([]);
    let [tideNow, setTideNow] = useState(settings.nullTide);
    let [prevTide, setPrevTide] = useState(settings.nullTide);
    let [nextTide, setNextTide] = useState(settings.nullTide);
    let [station, setStation] = useState("");
    let [recalcFlag, setRecalcFlag] = useState(0);

    const refreshTimer = useRef(null);
    const recalcTimer = useRef(null);

    // ----------------------------------------------------------------------------------------------------
    // recalculate tide data displayed in the react component
    useEffect(() => {

        // get the current time in unix seconds
        const seconds = Math.round(Date.now() / 1000);

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
            setTideNow({
                "height": RoundToPrecision(height, settings.numberPrecision),
                "dt": seconds,
                "type": station  // just a label...
            });
            Log("tide", `recalc height: ${height.toFixed(2)}`);
            break;
        }

        // find the previous and next extreme heights
        for (var c = 1; c < extremes.length; c++) {

            // find the index of the next reading 
            if (extremes[c].dt < seconds) { continue; }

            // get the previous and next times and heights
            setPrevTide(extremes[c - 1]);
            setNextTide(extremes[c]);
            break;
        }

    }, [heights, extremes, station, recalcFlag]);

    // perform an initial recalc, then set a timer for periodic refresh
    useEffect(() => {

        if (recalcTimer.current) {
            Log("tide", `recalc timer: cleared`);
            clearInterval(recalcTimer.current);
            recalcTimer.current = null;
        }

        Log("tide", `recalc timer: ${settings.recalcMillis / 1000} ms`);
        recalcTimer.current = setInterval(function doRecalc() {
            setRecalcFlag(Date.now())
            return doRecalc;
        }(), settings.recalcMillis);

        return () => {
            Log("tide", "recalc timer: exiting");
            clearInterval(recalcTimer.current);
            recalcTimer.current = null;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // suspend refresh when page is not visible
        if (!isVisible && heights.length > 0) return;

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        const timeTo = GetTimeOffset(settings.toHours);
        const dtTo = Math.floor(timeTo.getTime() / 1000);
        let url = `${settings.url}?limit=100&from=${dtFrom}&to=${dtTo}&offset=${settings.heightOffset}`;
        Log("tide", `refresh: ${url}`);

        axios.get(url)
            .then((response) => {
                let data = response.data;
                setHeights(data.heights);
                setExtremes(data.extremes);
                setStation(data.station);
            })
            .catch((err) => {
                Log("tide", `error:  ${err}`);
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // perform an initial pull of data, then set a timer for periodic refresh
    useEffect(() => {

        if (refreshTimer.current) {
            Log("tide", `refresh timer: cleared`);
            clearInterval(refreshTimer.current);
            refreshTimer.current = null;
        }

        // this function refresh() within setinterval triggers an immediate refresh
        Log("tide", `refresh timer: ${settings.refreshMillis / 1000} ms`);
        refreshTimer.current = setInterval(function refresh() {
            onRefresh();
            return refresh;
        }(), settings.refreshMillis);

        return () => {
            Log("tide", `refresh timer: exiting`);
            clearInterval(refreshTimer.current);
            refreshTimer.current = null;
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----------------------------------------------------------------------------------------------------
    // return the component
    return (
        <div className="wrapper">
            <div className="label left">Tide</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={heights}
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
                        domain={[getXDomainMin, getXDomainMax]}
                        scale="time"
                        interval="0"
                        tickFormatter={formatXAxis}
                        angle={0}
                        ticks={getXAxisTicks()}
                        tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                        allowDataOverflow={true}
                    />
                    <YAxis
                        type="number"
                        ticks={settings.yAxisTicks}
                        tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                        domain={[dataMin => RoundDownToMultiple(dataMin - 0.1, 0.5), dataMax => RoundUpToMultiple(dataMax + 0.1, 0.5)]}
                        tickFormatter={formatYAxis}
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
                        x={tideNow.dt}
                        stroke="white"
                        strokeWidth={3}
                        isFront={true}
                    >
                        <Label
                            value={formatLabel(tideNow.height)}
                            position='top'
                            fill={settings.fontColor}
                            fontSize={settings.fontSize}
                        />
                    </ReferenceLine>
                </AreaChart>
            </ResponsiveContainer>
            <Row label="Tide" value={tideNow} rowStyle="data-row" />
            <Row label="Tide" value={prevTide} rowStyle="data-row" />
            <Row label="Tide" value={nextTide} rowStyle="data-row" />
        </div>
    );
}

export default TideChart;
