// Send back an error message
const handleError = (code, source, error, response) => {
    const details = JSON.stringify({ code: code, source: source, error: JSON.stringify(error) });
    response.setStatusCode(code);
    response.setHeader("Content-Type", "application/json");
    response.setBody(details);
}

// This function is the endpoint's request handler.
exports = function ({ query, headers, body }, response) {

    try {
        // mandatory - field that will be returned e.g. ?field=pressure or ?field=obs to get all weather fields
        const argField = query["field"];
        if (argField == null) {
            throw new Error(`field argument must be included in request`)
        }

        // run an aggregation pipeline to get the requested data
        const collection = context.services.get("mongodb-atlas").db("weather").collection("observation");
        var pipeline = [];

        // optional - unix timestamp from which to include in the response
        if (query["from"]) {
            const dtFromStr = String(query["from"]);
            const dtFromVal = parseInt(dtFromStr);
            if (!isNaN(dtFromVal)) {
                pipeline.push({ "$match": { "$expr": { "$gte": ["$all.dt", dtFromVal] } } });
            }
        }

        // optional - unix timestamp to which to include in the response
        if (query["to"]) {
            const dtToStr = String(query["to"]);
            const dtToVal = parseInt(dtToStr);
            if (!isNaN(dtToVal)) {
                pipeline.push({ "$match": { "$expr": { "$lte": ["$all.dt", dtToVal] } } });
            }
        }

        // sort the pipeline by reverse Date
        pipeline.push({ "$sort": { "time": -1 } });

        // optional - limit the records in the response
        if (query["limit"]) {
            const limitStr = String(query["limit"]);
            const limitVal = parseInt(limitStr);
            if (!isNaN(limitVal)) {
                pipeline.push({ "$limit": limitVal });
            }
        }

        // note there is an arbitrary cap of 1000 of the most recent records
        pipeline.push({ "$limit": 1000 });
        pipeline.push({ "$sort": { "time": 1 } });

        // run the aggregation pipeline
        return collection.aggregate(pipeline).toArray()
            .then(values => {

                // send back the result
                response.setStatusCode(200);
                response.setHeader("Content-Type", "application/json");

                subset = [];
                if (argField == "obs") {

                    // return all relevant fields in the observation
                    values.forEach(r => {
                        let row = {
                            //"time": r.time,
                            "place": r.all.name,
                            "dt": r.dt,
                            "wind": r.wind,
                            "weather": r.weather,
                            "stats": r.stats
                        };
                        subset.push(row);
                    });

                } else {

                    // just return one field as requested
                    values.forEach(r => {
                        // check if the requested field is present in each record?
                        if (r[argField] == null) {
                            // do nothing
                        } else {
                            let val = r[argField];

                            let row = {
                                "value": (Array.isArray(val) ? val[0] : val),
                                //"time": r.time,
                                "dt": r.all.dt
                            };
                            subset.push(row);
                        }
                    });

                }
                response.setBody(JSON.stringify(subset));
            })
            .catch(error => {
                handleError(422, "api_get_weather", error, response);
            });

    } catch (error) {
        handleError(400, "api_get_weather", error, response);
    }
};
