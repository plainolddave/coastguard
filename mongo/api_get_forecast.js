// Send back an error message
const handleError = (code, headers, error) => {
    response.setStatusCode(code);
    response.setHeader("Content-Type", "application/json");
    response.setBody(JSON.stringify({ "code": code, "error": JSON.stringify(error) }));
    context.functions.execute("api_log", "api_get_forecast", code, headers, error);
}

// This function is the endpoint's request handler.
exports = function ({ query, headers, body }, response) {

    try {
        // run an aggregation pipeline to get the requested data
        const collection = context.services.get("mongodb-atlas").db("weather").collection("forecast");
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

        // note there is an arbitrary cap of 100 of the most recent records
        pipeline.push({ "$limit": 100 });
        pipeline.push({ "$sort": { "time": 1 } });

        // run the aggregation pipeline
        return collection.aggregate(pipeline).toArray()
            .then(values => {

                // send back the result
                response.setStatusCode(200);
                response.setHeader("Content-Type", "application/json");

                subset = [];
                if (query["field"]) {

                    // just return one field as requested
                    const argField = query["field"];
                    values.forEach(r => {

                        // check if the requested field is present in each record?
                        const doc = r.forecast;
                        if (doc[argField] == null) {
                            // do nothing
                        } else {

                            let val = doc[argField];
                            let row = {
                                //"time": doc.time,
                                "dt": doc.dt
                            };
                            row[argField] = Array.isArray(val) ? val[0] : val;
                            subset.push(row);
                        }
                    });
                } else {
                    values.forEach(r => {
                        subset.push(r.forecast);
                    });
                }
                response.setBody(JSON.stringify(subset));
                context.functions.execute("api_log", "api_get_forecast", 200, headers);
            })
            .catch(error => {
                handleError(422, headers, error);
            });

    } catch (error) {
        handleError(400, headers, error);
    }
};
