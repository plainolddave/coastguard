// Send back an error message
const handleError = (code, headers, error) => {
    response.setStatusCode(code);
    response.setHeader("Content-Type", "application/json");
    response.setBody(JSON.stringify({ "code": code, "error": JSON.stringify(error) }));
    context.functions.execute("api_log", "api_get_fleet", code, headers, error);
}

// This function is the endpoint's request handler.
exports = function ({ query, headers, body }, response) {

    try {

        let request = { query, headers, body };
        console.log(`Request: ${JSON.stringify(request)}`);

        // run an aggregation pipeline to get the requested data
        var pipeline = [];
        const collection = context.services.get("mongodb-atlas").db("signalk").collection("data");

        // path is mandatory - must be included
        if (query["path"]) {
            pipeline.push({ "$match": { "path": query["path"] } });
        } else {
            throw new Error(`Path argument must be included in request`)
        }

        // optional - filter by self
        if (query["self"]) {
            const self = String(query["self"]);
            if (self.localeCompare('true')) {
                pipeline.push({ '$match': { 'self': true } });
            }
        }

        // optional - unix timestamp from which to include in the response
        if (query["from"]) {
            const fromStr = String(query["from"]);
            const fromVal = parseInt(fromStr);
            if (!isNaN(fromVal)) {
                pipeline.push({ "$match": { "$expr": { "$gte": ["$dt", fromVal] } } });
            }
        }

        // optional - unix timestamp to which to include in the response
        if (query["to"]) {
            const toStr = String(query["to"]);
            const toVal = parseInt(toStr);
            if (!isNaN(toVal)) {
                pipeline.push({ "$match": { "$expr": { "$lte": ["$dt", toVal] } } });
            }
        }

        // note there is an arbitrary limit of 1000 of the most recent records
        pipeline.push({ "$sort": { "time": -1 } });
        pipeline.push({ "$limit": 100000 });
        pipeline.push({ "$sort": { "time": 1 } });

        // run the aggregation pipeline
        console.log(`Pipeline: ${JSON.stringify(pipeline)}`);
        return collection.aggregate(pipeline).toArray()
            .then(values => {

                console.log(`Values: ${JSON.stringify(values)}`);

                // send back the result
                response.setStatusCode(200);
                response.setHeader("Content-Type", "application/json");

                payload = [];
                values.forEach(r => {

                    let row = {}
                    row["value"] = Array.isArray(r.value) ? r.value[0] : r.value;
                    row["time"] = r.time;
                    row["dt"] = r.dt;
                    payload.push(row);

                });

                //console.log(`Payload: ${JSON.stringify(payload)}`);
                response.setBody(JSON.stringify(payload));
                context.functions.execute("api_log", "api_get_signalk", 200, headers);
            })
            .catch(error => {
                handleError(422, headers, error);
            });

    } catch (error) {
        handleError(400, headers, error);
    }
};
