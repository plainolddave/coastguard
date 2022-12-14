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
//function ClampAngle(angle) {
//    if (angle < 0) {
//        angle += 360;
//    }
//    if (angle >= 360) {
//        angle -= 360;
//    }
//    return angle;
//}

// helper to fix negative or multiples of angles
function ClampAngle(angle, min = 0, max = 360, span = 360) {
    while (angle < min) {
        angle += span;
    }
    while (angle > max) {
        angle -= span;
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

// 'value' is decimal degrees e.g. -27.56789
// 'digits' is the number of digits to display for minutes (including the dot)
function DegreesToDecimalString(value, digits) {

    var str;
    var mins = 0;
    var deg = 0;

    mins = (Math.abs(value % 1) * 60);
    if (digits === 0) {
        // display degrees only
        deg = Math.round(Math.abs(value));
        str = `${deg.toFixed(0)}\u00B0`;
    } else {
        // display n digits for mins
        deg = Math.floor(Math.abs(value));
        digits = digits <= 3 ? 0 : digits - 3;
        mins = RoundToPrecision(mins, digits)
        if (mins === 60) {
            deg += 1;
            mins = 0;
        }
        str = mins.toFixed(digits);

        // mins are always 2 digit numbers
        if (str.length < 2 || (digits > 0 && str.substr(2, 1) !== ".")) str = "0" + str;
        str = `${deg.toFixed(0)}\u00B0` + str;
    }
    //console.log(`val: ${value} deg: ${deg} min: ${mins} str: ${str}`);
    return str;
}

function LatToString(lat, digits = 6) {
    lat = ClampAngle(lat, -90, 90, 180); 
    return DegreesToDecimalString(lat, digits) + (lat >= 0 ? "N" : "S");
}

function LonToString(lon, digits = 6) {
    lon = ClampAngle(lon, -180, 180, 360); 
    return DegreesToDecimalString(lon, digits) + (lon >= 0 ? "E" : "W");
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
            if (!IsValidLat(lat) || !IsValidLon(lon)) { return; }
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
        return `corner1: ${LatToString(this._maxLat)}, ${LonToString(this._minLon)} corner2: ${LatToString(this._minLat)}, ${LonToString(this._maxLon)} sensible: ${(this.isSensible ? "yes" : "no")}`;
    }

    clip(clipbox) {
        let newbox = [[0, 0], [0, 0]];
        newbox[0][0] = this._maxLat < clipbox[0][0] ? this._maxLat : clipbox[0][0]; // NW LAT
        newbox[1][0] = this._minLat > clipbox[1][0] ? this._minLat : clipbox[1][0]; // SE LAT
        newbox[0][1] = this._minLon > clipbox[0][1] ? this._minLon : clipbox[0][1]; // NW LON
        newbox[1][1] = this._maxLon < clipbox[1][1] ? this._maxLon : clipbox[1][1]; // SE LON
        return newbox;
    }
}

export { PositionBounds, Log, LogJSON, PositionToString, LatToString, LonToString, CogToString, LogReact, GetTimeOffset, GetTimeOffsetUnix, RoundToPrecision, Clamp, ClampAngle, Saturate, Viewport, RoundUpToMultiple, RoundDownToMultiple }