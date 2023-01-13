// Send back an error message
const handleError = (code, headers, error) => {
  response.setStatusCode(code);
  response.setHeader("Content-Type","application/json");
  response.setBody(JSON.stringify({"code": code, "error": JSON.stringify(error)}));
  context.functions.execute("api_log", "api_get_tide", code, headers, error);
}

// This function is the endpoint's request handler.
exports = function({ query, headers, body}, response) {

  try {
 
    // run an aggregation pipeline to get the requested data
    const collection = context.services.get("mongodb-atlas").db("weather").collection("tide");
    var pipeline = [];
    var result = { 'heights': [], 'extremes':[]};
    
    // future - current station does nothing / return data is always Brisbane Bar
    if (query["station"]) {
      //const stationStr = String(query["station"]);
      //result['station'] = stationStr;
    } 
    result['station'] = "Brisbane Bar";
    
    // optional - unix timestamp from which to include in the response
    if (query["from"]) {
      const fromStr = String(query["from"]);
      const fromVal = parseInt(fromStr);
      if(!isNaN(fromVal)) {
        pipeline.push({"$match": {"$expr": { "$gte": ["$dt", fromVal]}}});
        result['from'] = fromVal;
      }
    }
    
    // optional - unix timestamp to which to include in the response
    if (query["to"]) {
      const toStr = String(query["to"]);
      const toVal = parseInt(toStr);
      if(!isNaN(toVal)) {
        pipeline.push({"$match": {"$expr": { "$lte": ["$dt", toVal]}}});
        result['to'] = toVal;
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

    if (query["offset"]) {
      const offsetStr = String(query["offset"]);
      const offsetVal = Number(parseFloat(offsetStr).toFixed(3));
      if(!isNaN(offsetVal)) {
        pipeline.push({"$set":{"height":{ "$add": [ "$height", offsetVal]}}});
        result['offset'] = offsetVal;
      }
    }
          
    // run the aggregation pipeline
    return collection.aggregate(pipeline).toArray()
    .then(values => {
      values.forEach(r => {
          let row = {};
          row['height'] = Number(r.height.toFixed(3));
          row["dt"]= r.dt;
          if(r.type) {
            row["type"]= r.type;
            result.extremes.push(row);
          }
          result.heights.push(row);
      });

      // send back the result
      response.setStatusCode(200);
      response.setHeader("Content-Type","application/json");
      response.setBody(JSON.stringify(result));
      context.functions.execute("api_log", "api_get_tide", 200, headers);
    })
    .catch(error => {
      handleError(422, headers, error);
    });
    
  } catch (error) {
    handleError(400, headers, error);
  }
};
