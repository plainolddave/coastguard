import * as dayjs from 'dayjs'
import { stringify } from 'flatted';

// calculate a time offset from the current time
function GetTimeOffset(hours) {
    return new Date(Date.now() + (hours * 60 * 60 * 1000))
};

// round a value to a specified precision 
function RoundToPrecision(value, precision) {
    return parseFloat(value.toFixed(precision));
}

function Clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function Log(from, message) {
    console.log(`${dayjs(new Date()).format('HH:mm:ss')} ${from}:`, message);
};

function LogJSON(from, obj) {
    console.log(`${dayjs(new Date()).format('HH:mm:ss')} ${from}: ${JSON.stringify(obj)}`);
};

function LogReact(from, obj) {
    console.log(`${dayjs(new Date()).format('HH:mm:ss')} ${from}: ${stringify(obj)}`);
};

// helper to fix negative angles
function ClampAngle(angle) {
    if (angle < 0) {
        angle += 360;
    }
    if (angle >= 360) {
        angle -= 360;
    }
    return angle;
}

function Saturate(hexColor, satPercent = 0) {

    var hex = hexColor;
    var sat = satPercent;
    var hash = hex.substring(0, 1) === "#";
    hex = (hash ? hex.substring(1) : hex).split("");

    var long = hex.length > 3,
        rgb = [],
        i = 0,
        len = 3;

    rgb.push(hex.shift() + (long ? hex.shift() : ""));
    rgb.push(hex.shift() + (long ? hex.shift() : ""));
    rgb.push(hex.shift() + (long ? hex.shift() : ""));

    for (; i < len; i++) {
        if (!long) {
            rgb[i] += rgb[i];
        }
        rgb[i] = Math.round(parseInt(rgb[i], 16) / 100 * sat).toString(16);
        rgb[i] += rgb[i].length === 1 ? rgb[i] : "";
    }
    return (hash ? "#" : "") + rgb.join("");
}

function Viewport() {
    var e = window
        , a = 'inner';
    if (!('innerWidth' in window)) {
        a = 'client';
        e = document.documentElement || document.body;
    }
    return { width: e[a + 'Width'], height: e[a + 'Height'] }
}

function RoundUpToMultiple(value, n) {
    return Math.ceil(value / n) * n;
}

function RoundDownToMultiple(value, n) {
    return Math.floor(value / n) * n;
}

export { Log, LogJSON, LogReact, GetTimeOffset, RoundToPrecision, Clamp, ClampAngle, Saturate, Viewport, RoundUpToMultiple, RoundDownToMultiple }