import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import * as dayjs from 'dayjs'
import { GetTimeOffset, Log, RoundUpToMultiple, RoundDownToMultiple } from "./../Common/Utils"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Label,
    CartesianGrid,
    ResponsiveContainer
} from "recharts";

const settings = {
    startupMillis: 4000,            // soft start
    refreshMillis: 1000 * 60 * 10,  // get new data every 10 minutes
    fromHours: -6,                  // use a window of tide information from 6 hours behind now()
    toHours: 0,                     // use a window of tide information to 6 hours ahead of now()
    tickSeconds: 1 * 60 * 60,       // interval for chart ticks
    url: "https://coastguard.netlify.app/.netlify/functions/weather",
    fontSize: 16,
    fontColor: "white",
    numberPrecision: 1,
    chartHeight: 200
};

// ----------------------------------------------------------------------------------------------------
// helper functions
const formatXAxis = item => {
    return dayjs.unix(item).format('HH:mm');
}

const formatYAxis = item => {
    return Math.round(item);
}

const formatXTicks = () => {

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

function PressureChart({
    chartHeight = settings.chartHeight,
    isVisible = true,
    ...restProps }) {

    // data received from the server
    let [data, setData] = useState([]); 
    const refreshTimer = useRef(null);

    // ----------------------------------------------------------------------------------------------------
    // refresh data from the server
    const onRefresh = useCallback(() => {

        // suspend refresh when page is not visible
        if (!isVisible) return;

        const timeFrom = GetTimeOffset(settings.fromHours);
        const dtFrom = Math.floor(timeFrom.getTime() / 1000);
        const timeTo = GetTimeOffset(settings.toHours);
        const dtTo = Math.floor(timeTo.getTime() / 1000);
        let url = `${settings.url}?field=pressure&limit=1000&from=${dtFrom}&to=${dtTo}`;
        Log("pressure", url);

        axios.get(url)
            .then((response) => {
                setData(response.data);
            })
            .catch((err) => {
                Log("pressure error", err);
            });

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
    }, [isVisible]);

    // ----------------------------------------------------------------------------------------------------
    // return the component
    return (
        <div className="wrapper">
            <div className="label left">Pressure</div>
            <ResponsiveContainer width="100%" height={chartHeight}>
                <AreaChart data={data}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="pressureColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="50%" stopColor="#00B050" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#008080" stopOpacity={0.7} />
                        </linearGradient>
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
                        ticks={formatXTicks()}
                        allowDataOverflow={true}
                    />
                    <YAxis
                        type="number"
                        tick={{ fontSize: settings.fontSize, fill: settings.fontColor }}
                        domain={[dataMin => RoundDownToMultiple(dataMin - 1, 5), dataMax => RoundUpToMultiple(dataMax + 1, 5)]}
                        tickFormatter={formatYAxis}
                        interval={'preserveStartEnd'}
                        allowDecimals={false}
                        allowDataOverflow={true}
                    >
                        <Label
                            value='hpa'
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
                        dataKey="value"
                        stroke="#00CC00"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#pressureColor)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

export default PressureChart;