// Send back an error message
const handleError = (code, headers, error, response) => {
  response.setStatusCode(code);
  response.setHeader("Content-Type","application/json");
  response.setBody(JSON.stringify({"code": code, "error": JSON.stringify(error)}));
  context.functions.execute("api_log", "api_get_weather", code, headers, error);
}

// This function is the endpoint's request handler.
//exports = function({ query, headers, body}, response) {
exports = function(request, response) {
  
  let query = {field:"all", id:99497};
  let headers = null;
  let body = null;
    
  console.log(JSON.stringify(request))
    
  if (request != null && request != undefined) {
    query = request.query;
    headers = request.headers;
    body = request.body;
  }

  try {

    console.log(JSON.stringify(query));
    
    // mandatory - field that will be returned e.g. ?field=pressure or ?field=wind or ?field=all to get all weather fields
    let argField = query["field"]; 
    if(argField == null) {
        //throw new Error(`field must be included in request`);
        argField = "all";
    }

    // mandatory - station id that will be returned e.g. ?station=99497 for Hope Banks Beacon
    let argId = query["id"]; 
    if(argId == null) {
        //throw new Error(`station must be included in request`);
        argId = 99497;
    }    

    // run an aggregation pipeline to get the requested data
    const collection = context.services.get("mongodb-atlas").db("weather").collection("bom_observation");
    var pipeline = [];
    
    // mandatory - station that will be returned e.g. ?station=99497 for Hope Banks Beacon
    const idVal = parseInt(String(argId));
    if(!isNaN(idVal)) {
      pipeline.push({"$match": {"$expr": { "$eq": ["$wmo", idVal]}}});
    } 
    
    // optional - unix timestamp from which to include in the response
    if (query["from"]) {
      const dtFromVal = parseInt(String(query["from"]));
      if(!isNaN(dtFromVal)) {
        pipeline.push({"$match": {"$expr": { "$gte": ["$dt", dtFromVal]}}});
      }
    }

    // optional - unix timestamp to which to include in the response
    if (query["to"]) {
      const dtToVal = parseInt(String(query["to"]));
      if(!isNaN(dtToVal)) {
        pipeline.push({"$match": {"$expr": { "$lte": ["$dt", dtToVal]}}});
      }
    }

    // sort the pipeline by reverse Date
    pipeline.push({"$sort": {"time": -1}});

    // optional - limit the records in the response
    if (query["limit"]) {
      const limitVal = parseInt(String(query["limit"]));
      if(!isNaN(limitVal)) {
        pipeline.push({"$limit": limitVal});
      }
    } 
    
    // note there is an arbitrary cap of 1000 of the most recent records
    pipeline.push({"$limit": 1000});
    pipeline.push({"$sort": {"time": 1}});

    //console.log(JSON.stringify(query));
    //console.log(JSON.stringify(pipeline));    
    //console.log(JSON.stringify(argField));  
    
    // run the aggregation pipeline
    return collection.aggregate(pipeline).toArray()
    .then(values => {
      
      // send back the result
      subset = [];
      if(argField == "all") {
        
        console.log(JSON.stringify("all===="));
    
        // return all relevant fields in the observation
        values.forEach(r => {
            let row = { 
              //"time": r.time,
              //"place": r.all.name,
              "dt": r.dt,
              "wind": r.wind, 
              //"weather": r.weather,
              //"stats": r.stats
            };
            subset.push(row);
        });
        
      } else {
        
        // just return one field as requested
        values.forEach(r => {
          // check if the requested field is present in each record?
          if(r[argField]==null) {
            // do nothing
          } else {
            let val = r[argField];
            let row = { 
              "value": (Array.isArray(val) ? val[0] : val), 
              //"time": r.time,
              "dt": r.dt
          };
            subset.push(row);
          } 
        });
        
      }

      if (response==null || response==undefined){
        console.log(JSON.stringify(subset));
      } else {
        response.setStatusCode(200);
        response.setHeader("Content-Type","application/json");
        response.setBody(JSON.stringify(subset));
        context.functions.execute("api_log", "api_get_weather", 200, headers);
      }
    })
    .catch(error => {
      //handleError(422, headers, error, response);
      console.log(JSON.stringify(error))
    });
  } catch (error) {
    //handleError(400, headers, error, response);
    console.log(JSON.stringify(error));
  }
};
