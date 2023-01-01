// Get the weather for Manly from openweathermap.org - expected return is:
// {
//    "coord":{"lon":153.19,"lat":-27.45},
//    "weather":[{"id":803,"main":"Clouds","description":"broken clouds","icon":"04n"}],
//    "base":"stations",
//    "main":{"temp":289.74,"feels_like":289.86,"temp_min":288.8,"temp_max":290.95,"pressure":1015,"humidity":92},
//    "visibility":10000,
//    "wind":{"speed":3.09,"deg":330},
//    "clouds":{"all":75},
//    "dt":1662729529,
//    "sys":{"type":1,"id":9485,"country":"AU","sunrise":1662666760,"sunset":1662709036},
//    "timezone":36000,
//    "id":2158868,
//    "name":"Manly",
//    "cod":200
// }

exports = function () {

    // constants - just get weather for Manly Queensland 
    const lat = -27.45;
    const lon = 153.20;
    const key = context.values.get("OPENWEATHERMAP_API_KEY_VALUE");
    const httpService = context.services.get('http');

    // helper functions
    function titleCase(str) {
        return str.toLowerCase().split(' ').map(function (word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }

    function roundDecimal(num, precision) {
        return Math.round((num + Number.EPSILON) * Math.pow(10, precision)) / Math.pow(10, precision);
    }

    function dateLabel(dt_secs, offset_hrs) {
        return new Date((dt_secs - offset_hrs * 60 * 60) * 1000)
            .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }

    // retrieve the latest weather
    let url_str = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
    context.http.get({ url: url_str })
        .then(response => {

            // check if there is already a record for this time in the collection
            let json = JSON.parse(response.body.text());
            json.time = new Date(json.dt * 1000);
            const collection = context.services.get("mongodb-atlas").db("weather").collection("observation");
            collection.findOne({ time: json.time }).then(existing => {

                //console.log(`response: ${JSON.stringify(json)}`);
                //console.log(`existing: ${JSON.stringify(existing)}`);

                // if the doc already exists, do nothing
                if (existing) { return; }

                // build a new document to make it easier to manage the API
                let doc = {};
                doc.all = json;
                doc.time = new Date(json.dt * 1000);
                doc.dt = json.dt;
                doc.weather = { icon: json.weather[0].icon, label: titleCase(json.weather[0].description), temp: json.main.temp };
                doc.wind = { knots: roundDecimal(json.wind.speed * 1.94384, 2), direction: json.wind.deg };
                //doc.wind = { knots: Math.Round(json.wind.speed * 1.94384), direction: json.wind.deg };
                doc.stats = {
                    sunrise_dt: json.sys.sunrise,
                    //sunrise_label: dateLabel(json.sys.sunrise, -10),
                    sunset_dt: json.sys.sunset,
                    //sunset_label: dateLabel(json.sys.sunset, -10),
                    cloud: json.clouds.all,
                    pressure: json.main.pressure,
                    humidity: json.main.humidity,
                    temp: json.main.temp
                };
                doc.pressure = json.main.pressure;
                doc.temp = json.main.temp;
                doc.humidity = json.main.humidity;
                doc.cloud = json.clouds.all;

                return collection.insertOne(doc)
                    .then(result => {
                        console.log(`Weather ${JSON.stringify(doc)}`);
                    })
                    .catch(error => {
                        console.error(`Weather error: ${error}`);
                    });
            });
        })
        .catch(error => {
            console.error(`Weather error: ${error}`);
        });
};
