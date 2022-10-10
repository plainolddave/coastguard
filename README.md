## Coastguard Brisbane Dashboard

This is a dashboard hosted at [https://coastguard.netlify.app/](https://coastguard.netlify.app/)

Components are:
- [Github](https://github.com/plainolddave/coastguard) - repository including CICD pipe to auto-build the React app on Netlify
- [Netlify](https://app.netlify.com/sites/coastguard/overview) - front end hosting, and proxying of API calls to MongoDB Atlas
- [MongoDB Atlas](https://cloud.mongodb.com/v2/631ba89895f2d85906fa7fa3#clusters) - data storage, aggregatation pipelines, API to handle ingestion of AIS data, and functions to poll OpenWeatherMap for updates
- SignalK - locally hosted to push NMEA2K data to MongoDB
- AIS Server - pushes AIS data to MongoDB in batches

Dependencies are:

1. [react-leaflet](https://react-leaflet.js.org/docs/start-installation/)
2. [axios](https://www.npmjs.com/package/axios)
3. [datejs](https://www.npmjs.com/package/datejs)
4. [recharts](https://recharts.org/en-US)
5. [react-icons](https://react-icons.github.io/react-icons/)
6. [material ui icons](https://mui.com/material-ui/icons/#icons)
7. [leaflet-easybutton]()

To install npm packages for the React App::
```bash
npm install react react-dom leaflet
npm install react-leaflet
npm install axios
npm install datejs
npm install react-icons --save
npm install recharts
npm install @mui/icons-material
npm install @mui/material @emotion/react @emotion/styled
npm i leaflet-easybutton
npm i font-awesome TBC TBC

```

For more instructions on the front-end React App [look here](Netlify_Instructions.md)  

Issues and improvements are:
- change to color for each track to match the icon
- ~~add an animate play/pause button~~
- add a config button to switch between live and BOM data source
- add pressure and wind direction to the forecast panels
- add tooltips back into each chart
- ~~remove the attribution on leaflet~~
- change the colors to be driven from the database
- shorten the variable names all round e.g. for wind
- wind chart y axis labels are weird
- check is the current weather obs actually the latest? i.e. is it sorting properly?
- make the label next to each icon about midway up the bubble
- add a menu and extra tab pages for historical tracks 
- this mini-map is kind of cool https://react-leaflet.js.org/docs/example-react-control/
- add timestamps in the bottom corner of the map
- add a button or something to the map to click and drag the screen up on a mobile
- look at a higher contrast map or marine chart layer
- add different color or line style to indicate where signal has been lost
