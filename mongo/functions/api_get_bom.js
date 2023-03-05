// Send back an error message
const handleError = (code, headers, error, response) => {
  console.log(`error: ${JSON.stringify(error)}`);
  //if(headers == null)
  //  return;
  context.functions.execute("api_log", "api_get_bom", code, headers, error);
  //if(response == null)
  //  return;
  response.setStatusCode(code);
  response.setHeader("Content-Type","application/json");
  response.setBody(JSON.stringify({"code": code, "error": JSON.stringify(error)}));
}

function ApiException(message) {
  this.message = message;
  this.name = "ApiException";
}

// This function is the endpoint's request handler.
exports = function({query, headers, body}, response) {
    
  //console.log(`query: ${JSON.stringify(query)} response: ${JSON.stringify(response)}`);
  //query = { "field": "all", "id": 99497, "limit": 100 } // test code
  
  try {
  
    // check mandatory arguments
    if(query == null) {
      throw new ApiException(`invalid request arguments`);
    }
    
    if(!("field" in query)) {
      throw new ApiException(`field must be included in request e.g. ?field=pressure or ?field=wind or ?field=all to get all weather fields`);
    }
    
    if(!("id" in query)) {
      throw new ApiException(`station id must be included in request e.g. ?id=99497 for Hope Banks Beacon`);
    }

    const argField = query["field"]; 
    const argId = query["id"]; 
    
    // run an aggregation pipeline to get the requested data
    var pipeline = [];
    
    // station id that will be returned e.g. ?station=99497 for Hope Banks Beacon
    const idStr = String(argId);
    const idVal = parseInt(idStr);
    if(isNaN(idVal)) {
      throw new ApiException(`invalid station id "${argId}" included in request - should be like ?id=99497 for Hope Banks Beacon`);
    }
    pipeline.push({"$match": {"all.wmo":idVal}});
  
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

    console.log(`pipeline: ${JSON.stringify(pipeline)}`);
    
    // run the aggregation pipeline
    const collection = context.services.get("mongodb-atlas").db("weather").collection("bom_observation");
    return collection.aggregate(pipeline).toArray()
    .then(values => {
      
      // console.log(`values: ${JSON.stringify(values)}`);
          
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
      if(response == null) {
        throw new ApiException(`response prepared but body is invalid: ${subset}`);
      }
      response.setStatusCode(200);
      response.setHeader("Content-Type","application/json");
      response.setBody(JSON.stringify(subset));
      context.functions.execute("api_log", "api_get_bom", 200, headers);
    })
    .catch(error => {
      handleError(422, headers, error, response);
    });
  } catch (error) {
    handleError(400, headers, error, response);
  }
};
