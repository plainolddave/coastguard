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

        // run an aggregation pipeline to get the requested data
        const collection = context.services.get("mongodb-atlas").db("ais").collection("positions");
        var pipeline = [];
        var result = { 'tracks': [] };

        //result["query"] = query;

        // optional - unix timestamp from which to include in the response
        var _from = new Date("1970-01-01T00:00:00Z")
        if (query["from"]) {
            const _fromStr = String(query["from"]);
            const _fromVal = parseInt(_fromStr);
            if (!isNaN(_fromVal)) {
                _from = new Date(_fromVal * 1000);
            }
        }
        result['from'] = _from;

        // optional - unix timestamp to which to include in the response
        var _to = new Date()
        if (query["to"]) {
            const _toStr = String(query["to"]);
            const _toVal = parseInt(_toStr);
            if (!isNaN(_toVal)) {
                _to = new Date(_toVal * 1000);
            }
        }
        result['to'] = _to;

        // optional - minimum sog to include in the response
        var _sog = 0;
        if (query["sog"]) {
            const sogStr = String(query["sog"]);
            const sogVal = parseFloat(sogStr);
            if (!isNaN(sogVal)) {
                _sog = sogVal;
            }
        }
        result['sog'] = _sog;

        // add the inial filters to the pipeline then sort
        pipeline.push({ "$match": { "time": { $gte: _from, $lte: _to }, "sog": { $gte: _sog } } });

        // group records into bins of n minutes (default 1 min)
        var mins = 1;
        if (query["mins"]) {
            const minsStr = String(query["mins"]);
            const minsVal = parseInt(minsStr);
            if (!isNaN(minsVal)) {
                mins = minsVal;
                result['mins'] = minsVal;
            }
        }
        pipeline.push({ $set: { one_minute: { $dateTrunc: { date: '$time', unit: 'minute', binSize: mins } } } });
        pipeline.push({
            $group: {
                _id: { time_bin: '$one_minute', mmsi_bin: '$mmsi' },
                name: { $last: '$vessel.name' },
                lat: { $last: { $arrayElemAt: ['$pos.coordinates', 1] } },
                lon: { $last: { $arrayElemAt: ['$pos.coordinates', 0] } },
                cog: { $avg: '$cog' },
                sog: { $max: '$sog' }
            }
        });

        // fix the rounding for lat/lon
        pipeline.push({
            $set: {
                lat: { $round: ['$lat', 6] },
                lon: { $round: ['$lon', 6] },
                time: { $toLong: '$_id.time_bin' },
                mmsi: '$_id.mmsi_bin'
            }
        });

        // group positions per vessel
        pipeline.push({
            $group: {
                _id: { mmsi_bin: '$mmsi' },
                mmsi: { $last: '$mmsi' },
                name: { $last: '$name' },
                dt: { $last: { $divide: ['$time', 1000] } },
                track: { $addToSet: { dt: { $divide: ['$time', 1000] }, lat: '$lat', lon: '$lon', cog: { $round: ['$cog', 0] }, sog: { $round: ['$sog', 0] } } }
            }
        });
        pipeline.push({ $unset: '_id' });
        pipeline.push({
            $lookup: {
                from: "vessels",
                localField: "mmsi",
                foreignField: "mmsi",
                as: "vessel"
            }
        });

        // clean up entries without a match to a known vessel
        // also sort the posiions by time
        pipeline.push({
            $set: {
                info: {
                    $cond: {
                        if: { $gt: [{ $size: "$vessel" }, 0] },
                        then: { $arrayElemAt: ["$vessel", 0] },
                        else: {
                            name: { $toString: "$mmsi" },
                            mmsi: "$mmsi",
                            fleet: "Other",
                            org: "Other",
                            color: "gray"
                        }
                    }
                }
            }
        });
        pipeline.push({ $unset: ['info._id', 'vessel'] });

        // optional - filter the vessel org(s) to include in the response
        // TODO TODO this is hardcoded - should be more flexible
        // allowable options are: 
        // QF2 - retrieves QF2 only
        // SAR - retrieves QF2, AVCG, VMR
        // ALL - applies no filter
        if (query["org"]) {
            const orgStr = String(query["org"]);
            if (orgStr === "QF2") {
                pipeline.push({ $match: { "info.org": 'QF2' } });
            } else if (orgStr === "SAR") {
                pipeline.push({ $match: { "info.org": { $in: ['QF2', 'VMR', 'AVCG'] } } });
            }
            result['org'] = orgStr;
        }

        // optional - limit to a cap of vessels
        if (query["limit"]) {
            const limitStr = String(query["limit"]);
            const limitVal = parseInt(limitStr);
            if (!isNaN(limitVal)) {
                pipeline.push({ "$limit": limitVal });
                result['limit'] = limitVal;
            }
        }

        // run the aggregation pipeline
        return collection.aggregate(pipeline)
            .toArray()
            .then(tracks => {
                // send back the result
                result.tracks = tracks;
                response.setStatusCode(200);
                response.setHeader("Content-Type", "application/json");
                response.setBody(JSON.stringify(result));
                context.functions.execute("api_log", "api_get_fleet", 200, headers);
            })
            .catch(error => {
                handleError(422, headers, error);
            });

    } catch (error) {
        handleError(400, headers, error);
    }
};
