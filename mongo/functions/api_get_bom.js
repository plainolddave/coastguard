// Send back an error message
const handleError = (code, headers, error, response) => {
  response.setStatusCode(code);
  response.setHeader("Content-Type","application/json");
  response.setBody(JSON.stringify({"code": code, "error": JSON.stringify(error)}));
  console.log(`error: ${JSON.stringify(error)}`);
  context.functions.execute("api_log", "api_get_weather", code, headers, error);
}

// This function is the endpoint's request handler.
exports = function({ query, headers, body}, response) {

  try {
    throw new Error(`test test test`)
    
    // mandatory - field that will be returned
    const argField = query["field"]; 
    if(argField == null) {
        throw new Error(`field must be included in request e.g. ?field=pressure or ?field=wind or ?field=all to get all weather fields`)
    }
    
    // mandatory - id that will be returned 
    const argId = query["id"]; 
    if(argId == null) {
        throw new Error(`station id must be included in request e.g. ?id=99497 for Hope Banks Beacon`)
    }

    // run an aggregation pipeline to get the requested data
    const collection = context.services.get("mongodb-atlas").db("weather").collection("bom_observation");
    var pipeline = [];
    
    // station id that will be returned e.g. ?station=99497 for Hope Banks Beacon
    const idVal = parseInt(String(argId));
    if(isNaN(idVal)) {
      pipeline.push({"$match": {"$expr": { "$eq": ["$wmo", idVal]}}});
    } else {
      throw new Error(`station id must be included in request e.g. ?id=99497 for Hope Banks Beacon`)
    }
    
    // optional - unix timestamp from which to include in the response
    if (query["from"]) {
      const dtFromVal = parseInt(String(query["from"]));
      if(!isNaN(dtFromVal)) {
        pipeline.push({"$match": {"$expr": { "$gte": ["$all.dt", dtFromVal]}}});
      }
    }

    // optional - unix timestamp to which to include in the response
    if (query["to"]) {
      const dtToVal = parseInt(String(query["to"]));
      if(!isNaN(dtToVal)) {
        pipeline.push({"$match": {"$expr": { "$lte": ["$all.dt", dtToVal]}}});
      }
    }

    // sort the pipeline by reverse Date
    pipeline.push({"$sort": {"time": -1}});

    // optional - limit the records in the response
    if (query["limit"]) {
      const limitStr = String(query["limit"]);
      const limitVal = parseInt(limitStr);
      if(!isNaN(limitVal)) {
        pipeline.push({"$limit": limitVal});
      }
    } 
    
    // note there is an arbitrary cap of 1000 of the most recent records
    pipeline.push({"$limit": 1000});
    pipeline.push({"$sort": {"time": 1}});

    // run the aggregation pipeline
    return collection.aggregate(pipeline).toArray()
    .then(values => {
      
      // return all fields in the observation
      subset = [];
      if(argField == "all") {
        values.forEach(r => {
            delete r._id;
            subset.push(r);
        });
        
      // just return one field as requested
      } else {
        values.forEach(r => {
          if(r[argField]==null) {
            // do nothing
          } else {
            let val = r[argField];
            let row = { 
              "value": (Array.isArray(val) ? val[0] : val), 
              "time": r.time,
              "dt": r.dt
            };
            subset.push(row);
          } 
        });
      }
      
      // send back the result
      response.setStatusCode(200);
      response.setHeader("Content-Type","application/json");
      response.setBody(JSON.stringify(subset));
      context.functions.execute("api_log", "api_get_weather", 200, headers);
    })
    .catch(error => {
      handleError(422, headers, error, response);
    });
  } catch (error) {
    handleError(400, headers, error, response);
  }
};
