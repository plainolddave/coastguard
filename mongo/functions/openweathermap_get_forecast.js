// Get the forecasts for Manly from openweathermap.org - expected return is:
// {
//    "cod":"200","message":0,"cnt":40,"list":[ 
//    {
//      "dt":1662789600,
//      "main":{"temp":297.28,"feels_like":296.77,"temp_min":296.5,"temp_max":297.28,"pressure":1012,"sea_level":1012,"grnd_level":1011,"humidity":39,"temp_kf":0.78},
//      "weather":[{"id":801,"main":"Clouds","description":"few clouds","icon":"02d"}],
//      "clouds":{"all":15},
//      "wind":{"speed":5.69,"deg":264,"gust":9.2},
//      "visibility":10000,
//      "pop":0,
//      "sys":{"pod":"d"},
//      "dt_txt":"2022-09-10 06:00:00"
//      },{
//      "dt":1662800400,
//      "main":{"temp":294.22,"feels_like":293.64,"temp_min":292.49,"temp_max":294.22,"pressure":1013,"sea_level":1013,"grnd_level":1014,"humidity":48,"temp_kf":1.73},
//      etc...

exports = function(){

  // constants - just get weather for Manly Queensland 
  const lat = -27.45;
  const lon = 153.20;
  const key = context.values.get("OPENWEATHERMAP_API_KEY_VALUE");
  const httpService = context.services.get('http');

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
  
  // retrieve the latest forecasts
  let url_str = `http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;    
  context.http.get({ url: url_str })
  .then(response => {
 
    const collection = context.services.get("mongodb-atlas").db("weather").collection("forecast");
    let forecast = JSON.parse(response.body.text());
    if (forecast.list == null)
      return;

    const sunrise = { dt: forecast.city.sunrise, label: dateLabel(forecast.city.sunrise, -10) };
    const sunset = { dt: forecast.city.sunset, label: dateLabel(forecast.city.sunset, -10) };   
        
    forecast.list.forEach(json => {
      
      // delete any existing records for this time in the collection
      json.time = new Date(json.dt * 1000);
      collection.deleteMany({ time: json.time }).then(result => {

        // build a new document to make it easier to manage the API
        let doc = {};
        doc.all = json;
        doc.time = json.time;
        doc.forecast = {
          dt: json.dt, 
          time: json.time, 
          icon: json.weather[0].icon,
          label: titleCase(json.weather[0].description),
          temp: json.main.temp,
          pressure: json.main.pressure,
          wind: { knots: roundDecimal(json.wind.speed * 1.94384, 1), direction: json.wind.deg, gust: roundDecimal(json.wind.gust * 1.94384, 1)},
        }

        return collection.insertOne(doc)
        .then(result => {
          console.log(`Forecast ${JSON.stringify(doc)}`);
        })
        .catch(error => {
          console.error(`Forecast error: ${error}`);
        });
      });
    });
  })
  .catch(error => {
    console.error(`Forecast error: ${error}`);
  });
};
