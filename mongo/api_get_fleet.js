// Send back an error message
const handleError = (code, source, error, response) => {
  const details = JSON.stringify({code: code, source: source, error: JSON.stringify(error)});
  response.setStatusCode(code);
  response.setHeader("Content-Type","application/json");
  response.setBody(details);
  console.log(`Error: ${details}`);
}

// This function is the endpoint's request handler.
exports = function({ query, headers, body}, response) {

  try {
 
    // run an aggregation pipeline to get the requested data
    const collection = context.services.get("mongodb-atlas").db("ais").collection("positions");
    var pipeline = [];
    var result = { 'tracks': [] };

    // optional - unix timestamp from which to include in the response
    if (query["from"]) {
      const fromStr = String(query["from"]);
      const fromVal = parseInt(fromStr);
      if(!isNaN(fromVal)) {
        pipeline.push({"$match": {"$expr": { "$gte": ["$unix", fromVal]}}});
        result['from'] = fromVal;
      }
    }
    
    // optional - unix timestamp to which to include in the response
    if (query["to"]) {
      const toStr = String(query["to"]);
      const toVal = parseInt(toStr);
      if(!isNaN(toVal)) {
        pipeline.push({"$match": {"$expr": { "$lte": ["$unix", toVal]}}});
        result['to'] = toVal;
      }
    }

    // get one record per minute
    pipeline.push({ $set: { one_minute: { $dateTrunc: { date: '$time', unit: 'minute', binSize: 1 } } } });
    pipeline.push({ $group: {
        _id: { time_bin: '$one_minute', mmsi_bin: '$mmsi' },
        name: { $last: '$vessel.name' },
        lat: { $last: { $arrayElemAt: ['$pos.coordinates', 1] } },
        lon: { $last: { $arrayElemAt: ['$pos.coordinates', 0] } },
        cog: { $avg: '$cog' },
        sog: { $max: '$sog' }
      }});
      
    // fix the rounding for lat/lon
    pipeline.push(      { $set: {
        lat: { $round: ['$lat', 6] },
        lon: { $round: ['$lon', 6] },
        time: { $toLong: '$_id.time_bin' },
        mmsi: '$_id.mmsi_bin'
      }});  
      
    // group positions per vessel
    pipeline.push({ $group: {
        _id: { mmsi_bin: '$mmsi' },
        mmsi: { $last: '$mmsi' },
        name: { $last: '$name' },
        dt: { $last: { $divide: [ '$time' , 1000 ] } },
        track: { $addToSet: {dt: { $divide: [ '$time', 1000 ] }, lat: '$lat', lon: '$lon', cog: { $round: [ '$cog', 0 ] }, sog: { $round: [ '$sog', 0 ] } }}
      }});  
    pipeline.push({ $unset: '_id' }); 
    pipeline.push({ $lookup: {
      from: "vessels",
      localField: "mmsi",
      foreignField: "mmsi",
      as: "vessel"
    }});

    // optional - limit to a cap of vessels
    if (query["limit"]) {
      const limitStr = String(query["limit"]);
      const limitVal = parseInt(limitStr);
      if(!isNaN(limitVal)) {
        pipeline.push({"$limit": limitVal});
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
      response.setHeader("Content-Type","application/json");
      response.setBody(JSON.stringify(result));
    })
    .catch(error => {
      handleError(422, "api_get_fleet", error, response);
    });
    
  } catch (error) {
    handleError(400, "api_get_fleet", error, response);
  }
};
