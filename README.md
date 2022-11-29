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
npm install react-router-dom
npm install react-select
npm install react-page-visibility --save 
npm install react-datepicker --save
```
For more instructions on the front-end React App [look here](Netlify_Instructions.md)  

## Issues and improvements

To do now:
- add wind gusts
- re-architect API calls to remove unecessary requests
- add a config setting to switch between live and BOM data source
- write a function to collect names and data of vessels not currently in the database
- add AISHub data / confrm Scarborough is feeding correctly (separate to Manly)
- turn off data refresh if the page is not selected

Maybe later:
- still some annoying CSS alignment issues
- add a TTL index to signalk->ais->positions to cap data at 3 months
- allow history to be selected by date range
- allow history to be selected per individual vessel or group of vessels
- shorten the variable names all round e.g. for wind
- put the 'weather refreshed' time somewhere inconspicuous
- add tooltips back into each chart
- experiment with serviceworker
- experiment with adding all other AIS tracks in view
- experiment with adding operational areas 
- this mini-map is kind of cool https://react-leaflet.js.org/docs/example-react-control/
- look at a higher contrast map or marine chart layer

Done:
- ~~add position in the bottom corner of the map~~
- ~~add a menu and extra tab pages for historical tracks~~
- ~~fix the default routing to point to the dashboard page~~
- ~~add a button to animate rain~~
- ~~change the default height to the viewport (i.e. excluding menu bars etc, instead of the whole screen)~~
- ~~add pressure and wind direction to the forecast panels~~
- ~~add the full date and time for tooltips on the history page~~
- ~~"other" tracks can go back to grey?~~
- ~~sort out a mobile version~~
- ~~make the label next to each icon about midway up the bubble~~
- ~~add a button or something to the map to click and drag the screen up on a mobile~~
- ~~change the default time to 24 hours or so (play around with this)~~
- ~~add different color or line style to indicate where signal has been lost~~
- ~~default to rain animation off - it doesnt render cleanly enough on AndroidTV~~
- ~~remove the attribution on leaflet~~
- ~~change the colors to be driven from the database~~
- ~~check is the current weather obs actually the latest? i.e. is it sorting properly?~~
- ~~change to color for each track to match the icon~~
- ~~add an animate play/pause button~~
- ~~the clock font can be slightly bigger, and add a little margin between it and the weather~~
- ~~play with the track dots - they look old fashioned~~
- ~~fix the scales and labels on the wind and pressure charts (e.g. wind should not go to -0.1)~~
- ~~sequence the soft start delay (weather & stats & forecast -> wind -> pressure -> tide -> tracks -> rain)~~
- ~~relook whether to add a label for the wind panel~~
- ~~sort out the mobile version~~
- ~~turn off data refresh if the page is not visible~~
- ~~remove API keys from lambda function~~
- ~~add a legend key and different icon colors on the history page~~
- ~~the degrees celcius symbol is seperated from the numerals for some reason~~
- ~~expand the capacity of the positions collection in mongoDB to 3 months~~
- ~~break up tracks into segments when signal is lost for a while~~
- ~~auto scale the History page to the collected tracks~~
- ~~"Light Intensity Shower Rain" is too long for the display~~
- ~~add a spinner to the history page while its fetchng data~~
- ~~fix redirects so browsing history works~~
- ~~fix position lat/lon display for track markers~~
- ~~make the course display as three digits and degrees symbol~~
- ~~add an indicator for local ip and remote address~~

## Setup for Android TV

- Default AndroidTV resolution was 1280x720
- ViewSonic 27in QHD VA 165Hz Curved Adaptive Sync Gaming Monitor (VX2718-2KPC-MHD) is 2560x1440
- Using ADB:
```bash
adb connect [IP address]
adb devices
adb shell wm size 1920x1080
adb shell wm density 164
```
Play around with the density number depending on the size of your tv (160 is ok on the viewsonic monitor)

Then to update the splash screen:
```bash
adb remount
adb shell ls -al /system/media

	C:\Temp\ADB>adb shell ls -al /system/media
	total 5939
	drwxr-xr-x 3 root root    4096 2022-04-18 16:53 .
	drwxr-xr-x 1 root root    3488 2022-10-20 19:19 ..
	drwxr-xr-x 6 root root    4096 2022-04-18 15:52 audio
	-rw-r--r-- 1 root root  475354 2022-04-18 16:53 boot.mp4
	-rw-r--r-- 1 root root 5588643 2022-04-18 16:53 bootanimation.zip
```
Find the bootanimation file:
adb shell find / -name "bootanimation*"
Pull the old files:
```bash
adb pull /system/media/boot.mp4 c:\temp\boot.mp4
adb pull /system/media/bootanimation.zip c:\temp\bootanimation.zip
```
Change them and push them back to the device:
```bash
adb push c:\temp\boot.mp4 /system/media/boot.mp4 
adb push c:\temp\bootanimation.zip /system/media/bootanimation.zip 
```

For more info look at:
- [Android Debug Bridge (adb)](https://github.com/K3V1991/ADB-and-FastbootPlusPlus)
- [ADB setup instructions](https://www.makeuseof.com/how-to-use-adb-on-android-tv/)
- [ADB commands](https://devhints.io/adb)
- [ADB reference guide](https://developer.android.com/studio/command-line/adb)
- [Useful info on screen resolution](https://www.reddit.com/r/AndroidTV/comments/rmqsvq/so_i_have_a_4k_android_tv_but_when_checking_stats/)
- [Useful info on screen resolution](https://www.reddit.com/r/AndroidTV/comments/rmqsvq/so_i_have_a_4k_android_tv_but_when_checking_stats/)
