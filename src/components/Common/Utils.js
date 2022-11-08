import * as dayjs from 'dayjs'
import { stringify } from 'flatted';

// calculate a time offset from the current time
function GetTimeOffset(hours) {
    return new Date(Date.now() + (hours * 60 * 60 * 1000))
};

// calculate a time offset from the current time as unix seconds
function GetTimeOffsetUnix(hours) {
    return Math.floor(GetTimeOffset(hours).getTime() / 1000);
};

// round a value to a specified precision 
function RoundToPrecision(value, precision) {
    return parseFloat(value.toFixed(precision));
}

function Clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

function Log(from, message) {
    console.log(`${dayjs(new Date()).format('HH:mm:ss.SSS')} ${from}:`, message);
};

function LogJSON(from, obj) {
    console.log(`${dayjs(new Date()).format('HH:mm:ss.SSS')} ${from}: ${JSON.stringify(obj)}`);
};

function LogReact(from, obj) {
    console.log(`${dayjs(new Date()).format('HH:mm:ss.SSS')} ${from}: ${stringify(obj)}`);
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

function PositionToString(lat, lon) {
    return LatToString(lat) + " " + LonToString(lon);
}

function LatToString(lat) {
    return `${Math.floor(Math.abs(lat))}\u00B0${(Math.abs(lat % 1) * 60).toFixed(3)}'${(lat >= 0 ? "N" : "S")}`;
}

function LonToString(lon) {
    return `${Math.floor(Math.abs(lon))}\u00B0${(Math.abs(lon % 1) * 60).toFixed(3)}'${(lon >= 0 ? "E" : "W")}`;
}

function CogToString(cog) {
    return String(cog).padStart(3, '0') + "\u00B0";
}

const MAX_LAT = 90;
const MIN_LAT = -90;
const MAX_LON = 180;
const MIN_LON = -180;

function IsValidLat(lat) {
    return (lat >= MIN_LAT && lat <= MAX_LAT);
}

function IsValidLon(lon) {
    return (lon >= MIN_LON && lon <= MAX_LON);
}

class PositionBounds {

    constructor(pos = [[MIN_LAT - 1, MAX_LON + 1], [MAX_LAT + 1, MIN_LON - 1]]) {

        this._minLat = MAX_LAT + 1;
        this._maxLat = MIN_LAT - 1;
        this._minLon = MAX_LON + 1;
        this._maxLon = MIN_LON - 1;

        this.push(pos[0][0], pos[0][1]);
        this.push(pos[1][0], pos[1][1]);
        // console.log(`bounds init: ${JSON.stringify(pos)} ${this.toString()}`);
    }

    get corner1() {
        return [this._maxLat, this._minLon];
    }

    get corner2() {
        return [this._minLat, this._maxLon];
    }

    get box() {
        return [this.corner1, this.corner2];
    }

    push(lat, lon) {
        try {
            // console.log(`bounds push lat: ${JSON.stringify(lat)} lon: ${JSON.stringify(lon)}`);
            // throw away invalid values and move on
            if (!IsValidLat(lat) || !IsValidLon(lon)) {  return; }
            this._minLat = Math.min(this._minLat, lat);
            this._maxLat = Math.max(this._maxLat, lat);
            this._minLon = Math.min(this._minLon, lon);
            this._maxLon = Math.max(this._maxLon, lon);
        } catch (err) {
            // ignore errors and move on
            console.log(`bounds exception lat: ${JSON.stringify(lat)} lon: ${JSON.stringify(lon)}`);
        }
    }

    get isSensible() {
        return (IsValidLat(this._minLat)
            && IsValidLat(this._maxLat)
            && IsValidLon(this._minLon)
            && IsValidLon(this._maxLon));
    }

    toString() {
        //return `corner1: ${this._minLat.toFixed(3)}, ${this._minLon.toFixed(3)} corner2: ${this._maxLat.toFixed(3)}, ${this._maxLon.toFixed(3)} sensible: ${this.isSensible ? "yes" : "no"}`
        return `corner1: ${LatToString(this._maxLat)}, ${LonToString(this._minLon)} corner2: ${LatToString(this._minLat)}, ${LonToString(this._maxLon)} sensible: ${(this.isSensible ? "yes" : "no")}`;
    }
}

export { PositionBounds, Log, LogJSON, PositionToString, CogToString, LogReact, GetTimeOffset, GetTimeOffsetUnix, RoundToPrecision, Clamp, ClampAngle, Saturate, Viewport, RoundUpToMultiple, RoundDownToMultiple }