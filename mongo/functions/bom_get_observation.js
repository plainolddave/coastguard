// Get observations for selected locations from bom 
// Sample URL is:
//  http://reg.bom.gov.au/fwo/IDQ60901/IDQ60901.99497.json
// Expected return is:
//{
//    "observations": {
//        "notice": [
//            {
//                "copyright": "Copyright Commonwealth of Australia 2023, Bureau of Meteorology. For more information see: http://www.bom.gov.au/other/copyright.shtml http://www.bom.gov.au/other/disclaimer.shtml",
//                "copyright_url": "http://www.bom.gov.au/other/copyright.shtml",
//                "disclaimer_url": "http://www.bom.gov.au/other/disclaimer.shtml",
//                "feedback_url": "http://www.bom.gov.au/other/feedback"
//            }
//        ],
//        "header": [
//            {
//                "refresh_message": "Issued at  6:31 pm EST Saturday  4 March 2023",
//                "ID": "IDQ60901",
//                "main_ID": "IDQ60900",
//                "name": "Hope Banks Beacon",
//                "state_time_zone": "QLD",
//                "time_zone": "EST",
//                "product_name": "Capital City Observations",
//                "state": "Queensland"
//            }
//        ],
//        "data": [
//            {
//                "sort_order": 0,
//                "wmo": 99497,
//                "name": "Hope Banks Beacon",
//                "history_product": "IDQ60901",
//                "local_date_time": "04/06:30pm",
//                "local_date_time_full": "20230304183000",
//                "aifstime_utc": "20230304083000",
//                "lat": -27.4,
//                "lon": 153.3,
//                "apparent_t": null,
//                "cloud": "-",
//                "cloud_base_m": null,
//                "cloud_oktas": null,
//                "cloud_type_id": null,
//                "cloud_type": "-",
//                "delta_t": null,
//                "gust_kmh": 44,
//                "gust_kt": 24,
//                "air_temp": null,
//                "dewpt": null,
//                "press": null,
//                "press_qnh": null,
//                "press_msl": null,
//                "press_tend": "-",
//                "rain_trace": "-",
//                "rel_hum": null,
//                "sea_state": "-",
//                "swell_dir_worded": "-",
//                "swell_height": null,
//                "swell_period": null,
//                "vis_km": "-",
//                "weather": "-",
//                "wind_dir": "SE",
//                "wind_spd_kmh": 35,
//                "wind_spd_kt": 19
//            },
//            { ...}
//        ]
//    }
//}

exports = function(){

  // constants
  const url_str = "http://reg.bom.gov.au/fwo/IDQ60901/IDQ60901.99497.json"
  //const lat = -27.45;
  //const lon = 153.20;
  //const key = context.values.get("OPENWEATHERMAP_API_KEY_VALUE");
  const httpService = context.services.get('http');
  const collection = context.services.get("mongodb-atlas").db("weather").collection("bom_observation");
    
  // helper functions
  function titleCase(str) {
    return str.toLowerCase().split(' ').map(function(word) {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }
  
  function roundDecimal(num, precision) {
    return Math.round((num + Number.EPSILON) * Math.pow(10,precision)) / Math.pow(10,precision);
  }
  
  function dateLabel(dt_secs, offset_hrs)
  {
    return new Date((dt_secs - offset_hrs*60*60)*1000)
      .toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: false});
  }
  
  function secondsSinceEpoch(d){ 
    return Math.floor( d / 1000 ); 
  }
  
  // parse a 14 digit string like "aifstime_utc": "20230304083000" to a Date value
  function stringToDate (utc_str)
  {
    if(isNaN(+utc_str)) return NaN;
    if (utc_str.length != 14) return NaN;
    
    let year = +utc_str.substring(0, 4);
    let monthIndex = +utc_str.substring(4, 6) - 1;
    let day = +utc_str.substring(6, 8);
    let hours = +utc_str.substring(8, 10);
    let minutes = +utc_str.substring(10, 12);
    let seconds = +utc_str.substring(12, 14);
    
    //console.log(`str: ${utc_str} yy: ${year} mm: ${monthIndex} dd: ${day} hh: ${hours} mm: ${minutes} ss: ${seconds}`);    
    
    if(year < 1900 || year > 2100) return NaN;
    if(monthIndex < 0 || monthIndex > 11) return NaN;
    if(day < 1 || day > 31) return NaN;
    if(hours < 0 || hours > 23) return NaN;
    if(minutes < 0 || minutes > 59) return NaN;
    if(seconds < 0 || seconds > 59) return NaN;
    
    return new Date(year, monthIndex, day, hours, minutes, seconds);
  }
  
    // parse a 14 digit string like "aifstime_utc": "20230304083000" to a Date value
  function stringToDegrees (cardinal_str)
  {
    switch(cardinal_str) {
      case "N":
        return 0.0;
      case "NNE":
        return 22.5;
      case "NE":
        return 45.0;
      case "ENE":
        return 67.5;
      case "E":
        return 90.0;  
      case "ESE":
        return 112.5;  
      case "SE":
        return 135.0;  
      case "SSE":
        return 157.5;  
      case "S":
        return 180.0;  
      case "SSW":
        return 202.5;  
      case "SW":
        return 225.0;  
      case "WSW":
        return 247.5;  
      case "W":
        return 270.0;  
      case "WNW":
        return 292.5;  
      case "NW":
        return 315.0;  
      case "NNW":
        return 337.5;  
      default: 
        return 0;
    }
  }
  
  // ====================================================================================================
  
  // retrieve the latest observation
  context.http.get({ url: url_str })
  .then(response => {
    
    let doc = JSON.parse(response.body.text());
    if(!('observations' in doc) || !('data' in doc.observations) || !Array.isArray(doc.observations.data))
      return false;

    // loop through each record and prepare docs to upsert based on "wmo" and utc seconds
    let bulkWriteOps = [];
    doc.observations.data.forEach(function (obs, index) {
    
      /* build up a doc to help later queries 
        {
          "time": 
          "dt": 1675366920,
          "wind": {
            "knots": 5,
            "direction": 270,
            "gust": 9
          },
          "stats": {
            "sunrise_dt": 1675365659,
            "sunset_dt": 1675413648,
            "cloud": 0,
            "pressure": 996,
            "humidity": 89,
            "temp": 23.77
          },
          "weather": {
            "icon": "01d",
            "label": "Clear Sky",
            "temp": 23.77
          },
          "temp": 23.77,
          "humidity": 89,
          "cloud": 0,
          "pressure": 996,
          "all": {...original...}
          }
        }
      */
      const obsTime = stringToDate(obs.aifstime_utc);
      let doc = {
        "time": obsTime,
        "dt": secondsSinceEpoch(obsTime),
        "name": obs.name.substring(0,10),
        "temp": obs.air_temp,
        "humidity": obs.rel_hum,
        "cloud": (obs.cloud_oktas == null ? null : Math.round(obs.cloud_oktas / 8.0 * 100.0)),
        "pressure": obs.press_msl,
        "all": obs
      };
      
      if(obs.wind_spd_kt != null)
        doc.wind = {
          "knots": obs.wind_spd_kt, 
          "direction": stringToDegrees(obs.wind_dir),
          "gust": obs.gust_kt || 0.0
        };
      
      /*
      doc.stats = {
        //"sunrise_dt": 1675365659,
        //"sunset_dt": 1675413648,
        "cloud": doc.cloud,
        "pressure": doc.pressure,
        "humidity": doc.humidity,
        "temp": doc.temp
      };
      */
      /*
      doc.weather = {
        //"icon": "01d",
        "label": obs.cloud,
        "temp": doc.temp
      };
      */
      
      //console.log(`bom upsert: ${JSON.stringify(doc)}`);
      
      bulkWriteOps.push(
        {
          replaceOne: {
            filter: { "time": doc.time, "all.wmo": doc.all.wmo, "all.history_product": doc.all.history_product},
            replacement: doc,
            upsert: true,
          }
        }
      );
    });

    // run the bulk operation
    collection.bulkWrite(bulkWriteOps)
    .then(result => {
      //console.log(`bom result: ${JSON.stringify(result)}`);
    })
    .catch(error => {
      console.error(`bom error: ${error}`);
    });
  })
  .catch(error => {
    console.error(`bom error: ${error}`);
  });
};