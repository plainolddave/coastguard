## Coastguard Brisbane Dashboard

This is a dashboard hosted at [https://coastguard.netlify.app/](https://coastguard.netlify.app/)

The platform is hosted at:
- [Github] (https://github.com/plainolddave/coastguard)
- [Netlify](https://app.netlify.com/sites/coastguard/overview) 
- [MongoDB Atlas] (https://cloud.mongodb.com/v2/631ba89895f2d85906fa7fa3#clusters)

For more instructions on the front-end React App [look here](Netlify_Instructions.md)  

Dependencies are:

1. [react-leaflet](https://react-leaflet.js.org/docs/start-installation/)
2. [axios](https://www.npmjs.com/package/axios)
3. [datejs](https://www.npmjs.com/package/datejs)
4. [recharts](https://recharts.org/en-US)
5. [react-icons](https://react-icons.github.io/react-icons/)

To install npm packages use:
```bash
npm install react react-dom leaflet
npm install react-leaflet
npm install axios
npm install datejs
npm install react-icons --save
npm install recharts
```

Issues and improvements are:
- change to color for each track to match the icon
- add an animate play/pause button
- add a config button to switch between live and BOM data source
- add pressure and wind direction to the forecast panels
- add tooltips back into each chart
- ~~remove the attribution on leaflet~~
- change the colors to be driven from the database
- shorten the variable names all round e.g. for wind
- wind chart y axis labels are weird
- check is the current weather obs actually the latest? i.e. is it sorting properly??
- make the label next to each icon about midway up the bubble
- add a menu and extra tab pages for historical tracks 

