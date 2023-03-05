import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import * as dayjs from 'dayjs'
import { GetTimeOffset, Log, RoundUpToMultiple, RoundDownToMultiple } from "./../Common/Utils"
import WindRose from "./../WindRose"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Label
} from "recharts";

const settings = {
    startupMillis: 1500,            // soft start msec
    refreshMillis: 1000 * 60 * 10,  // get new data every n minutes
    fromHours: -6,                  // use a window of tide information from 6 hours behind now()
    toHours: 0,                     // use a window of tide information to 6 hours ahead of now()
    tickSeconds: 1 * 60 * 60,       // interval for chart ticks
    url: "https://coastguard.netlify.app/.netlify/functions/bom",
    stationId: 99497,
    fontSize: 16,
    labelSize: 12,
    labelOffset: -5,
    fontColor: "white",
    numberPrecision: 0,
    windRoseWidth: 400,
    windRoseHeight: 400,
    chartHeight: 200
}

// ----------------------------------------------------------------------------------------------------
// helper functions
const formatXAxis = item => {
    return dayjs.unix(item).format('HH:mm');
}

const formatYAxis = item => {
    return item.toFixed(settings.numberPrecision);
}

const formatTicks = () => {

    // get the start tick for the next even increment
    const dtFrom = GetTimeOffset(settings.fromHours).getTime() / 1000 + settings.tickSeconds;
    const dtTo = GetTimeOffset(settings.toHours).getTime() / 1000;

    let dtTick = Math.floor(dtFrom / settings.tickSeconds) * settings.tickSeconds;
    let tickArray = [];
    while (dtTick < dtTo) {
        tickArray.push(dtTick);
        dtTick += settings.tickSeconds;
    }
    return tickArray;
}

// ----------------------------------------------------------------------------------------------------
// displays wind
function WindChart({
    isVisible,
    windRoseWidth = settings.windRoseWidth,
    windRoseHeight = settings.windRoseHeight,
    chartHeight = settings.chartHeight,
    ...restProps }) {

    // data received from the server
    const [data, setData] = useState([]);
    const [label, setLabel] = useState("");
    const refreshTimer = useRef(null);

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server - expected format is:
    // [
    //      { "value": { "knots": 15.01, "direction": 130 }, "dt": 1677915840 },
    //      { "value": { "knots": 13, "direction": 130 }, "dt": 1677916560 }
    // ]

    const onRefresh = useCallback(() => {

        // suspend refresh when page is not visible
        if (!isVisible && data.length > 0) return;

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        const timeTo = GetTimeOffset(settings.toHours);
        const dtTo = Math.floor(timeTo.getTime() / 1000);
        let url = `${settings.url}?field=wind&id=${settings.stationId}&limit=100&from=${dtFrom}&to=${dtTo}`;
        Log("wind", url);

        axios.get(url)
            .then((response) => {

                const result = response.data;
                if (result == null)
                    return;

                setData(result.data);
                setLabel(result.name);
            })
            .catch((err) => {
                Log("wind error", err);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible]);

    // ----------------------------------------------------------------------------------------------------
    // soft start a timer to periodically refresh data
    useEffect(() => {

        setTimeout(() => {

            if (refreshTimer.current) {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            }

            refreshTimer.current = setInterval(function refresh() {
                onRefresh();
                return refresh;
            }(), settings.refreshMillis);

            return () => {
                clearInterval(refreshTimer.current);
                refreshTimer.current = null;
            };

        }, settings.startupMillis);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----------------------------------------------------------------------------------------------------
    // return the component
    return (
        <div className="wrapper">
            <WindRose
                data={data}
                label={label}
                precision={settings.numberPrecision}
                width={windRoseWidth}
                height={windRoseHeight} />
            <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={data}
                    margin={{ top: 0, right: 10, left: 0, bottom: -3 }}>
                    <defs>
                        <linearGradient id="windColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="50%" stopColor="#9933FF" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#660066" stopOpacity={0.7} />
                        </linearGradient>
                        {/*<linearGradient id="gustColor" x1="0" y1="0" x2="0" y2="1">*/}
                        {/*    <stop offset="50%" stopColor="#9933FF" stopOpacity={0.9} />*/}
                        {/*    <stop offset="100%" stopColor="#660066" stopOpacity={0.7} />*/}
                        {/*</linearGradient>*/}
                    </defs>
                    <XAxis
                        dataKey="dt"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        scale="time"
                        interval="preserveStart"
                        tickFormatter={formatXAxis}
                        angle={0}
                        tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                        ticks={formatTicks()}
                        allowDataOverflow={true}
                    >
                        {/*<Label*/}
                        {/*    value={label}*/}
                        {/*    position='bottom'*/}
                        {/*    offset={settings.labelOffset}*/}
                        {/*    style={{*/}
                        {/*        textAnchor: 'middle',*/}
                        {/*        fontSize: settings.labelSize,*/}
                        {/*        fill: 'white'*/}
                        {/*    }}*/}
                        {/*/>*/}
                    </XAxis>
                    <YAxis
                        type="number"
                        tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                        domain={[dataMin => RoundDownToMultiple(dataMin, 2), dataMax => RoundUpToMultiple(dataMax + 1, 2)]}
                        tickFormatter={formatYAxis}
                        interval={'preserveStartEnd'}
                        allowDataOverflow={true}
                    >
                        <Label
                            value='knots'
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
                        dataKey="value.knots"
                        stroke="#FF00FF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#windColor)" />
                    <Area
                        type="monotone"
                        dataKey="value.gust"
                        stroke="#8000ff"
                        strokeWidth={3}
                        fillOpacity={0} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default WindChart;