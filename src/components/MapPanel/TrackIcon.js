import * as L from "leaflet";

const ChartIcon = L.Icon.extend({
    options: {
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }
});

const urlMap = new Map([
    ['gold', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png'],
    ['blue', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'],
    ['green', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'],
    ['violet', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png'],
    ['red', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'],
    ['orange', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'],
    ['black', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png'],
    ['gray', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png'],
    ['grey', 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png']
    ]);

// get the url 
function GetUrl(color) {
    if (urlMap.has(color)) {
        return urlMap.get(color);
    }
    return urlMap.get("gray");
}

// color strings are provided from the database
const colorMap = new Map([
/*    ['gold', '#FFD700'],*/
    ['gold', '#FBBC05'],
    ['blue', '#0000FF'],
    ['green', '#00FF00'],
    ['violet', '#8F00FF'],
    ['red', '#FF0000'],
    ['orange', '#FFA500'],
    ['black', '#000000'],
    ['gray', '#808080'],
    ['grey', '#808080']
]);

// get the color 
function GetColor(color) {
    //console.log("color " + color)
    if (colorMap.has(color)) {
        return colorMap.get(color);
    }
    return colorMap.get("gray");
}

const iconMap = new Map([
    ['gold', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png' })],
    ['blue', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png' })],
    ['green', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png' })],
    ['violet', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png' })],
    ['red', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png' })],
    ['orange', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png' })],
    ['black', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png' })],
    ['gray', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png' })],
    ['grey', new ChartIcon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png' })]
]);

// get the icon and url
function GetIcon(color) {
    if (!iconMap.has(color)) {
        color = "gray";
    }
    let icon = iconMap.get(color);
    icon.url = urlMap.get(color);
    return icon;
}

export { GetColor, GetIcon, GetUrl }

//, greenIcon, blueIcon, goldIcon, violetIcon, greyIcon, redIcon, orangeIcon, blackIcon }

//const greenIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
//});

//const blueIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png'
//});

//const goldIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png'
//});

//const violetIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png'
//});

//const greyIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png'
//});

//const redIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
//});

//const orangeIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'
//});

//const blackIcon = new ChartIcon({
//    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png'
//});

