import * as L from "leaflet";
//import colorString from "color-string";

const ChartIcon = L.Icon.extend({
    options: {
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }
});

const greenIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
});

const blueIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
});

const goldIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png'
});

const violetIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png'
});

const greyIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png'
});

const redIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
});

const orangeIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
});

const blackIcon = new ChartIcon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png'
});

// colors are set in the database
// track can be any web color
// icon choices are:
//  greenIcon
//  blueIcon
//  goldIcon
//  violetIcon
//  greyIcon
//  redIcon
//  orangeIcon
//  blackIcon

const colorMap = new Map([
/*    ['gold', '#FFD700'],*/
    ['gold', '#FBBC05'],
    ['blue', '#0000FF'],
    ['green', '#00FF00'],
    ['violet', '#8F00FF'],
    ['red', '#FF0000'],
    ['orange', '#FFA500'],
    ['black', '#000000'],
    ['gray', '#808080']
]);

const iconMap = new Map([
    ['gold', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png' })],
    ['blue', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png' })],
    ['green', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' })],
    ['violet', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png' })],
    ['red', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' })],
    ['orange', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png' })],
    ['black', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png' })],
    ['gray', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png' })]
]);

// get the icon 
function GetColor(vessel) {
    let color = "gray";
    if (vessel.vessel.length > 0) {
        color = vessel.vessel[0].color;
    }
    if (colorMap.has(color))
        return colorMap.get(color);
    else
        return colorMap.get("gray");
}

// get the icon and color
function GetIcon(vessel) {
    let color = "gray";
    if (vessel.vessel.length > 0) {
        color = vessel.vessel[0].color;
    }
    if (iconMap.has(color))
        return iconMap.get(color);
    else
        return iconMap.get("gray");
}

//switch (org) {
//    case "QF2":
//        return goldIcon;
//    case "QPS":
//        return blueIcon
//    case "AVCG":
//        return greenIcon
//    case "VMR":
//        return violetIcon
//    default:
//        return greyIcon;
//}

//// get the icon 
//function GetIcon(vessel) {
//    let color = "gray";
//    if (vessel.vessel.length > 0) {
//        color = vessel.vessel[0].color;
//    }
//    switch (color) {
//        case "gold":
//            return { color: "#FFD700", icon: goldIcon };
//        case "blue":
//            return { color: "#0000FF", icon: blueIcon };
//        case "green":
//            return { color: "#00FF00", icon: greenIcon };
//        case "violet":
//            return { color: "#8F00FF", icon: violetIcon };
//        case "red":
//            return { color: "#FF0000", icon: redIcon };
//        case "orange":
//            return { color: "#FFA500", icon: orangeIcon };
//        case "black":
//            return { color: "#000000", icon: blackIcon };
//        default:
//            return { color: "#808080", icon: greyIcon };
//    }
//}

export { GetColor, GetIcon, greenIcon, blueIcon, goldIcon, violetIcon, greyIcon, redIcon, orangeIcon, blackIcon }