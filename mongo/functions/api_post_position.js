// This function is the endpoinT request handler for 
// PUT https://data.mongodb-api.com/app/data-xplts/endpoint/position
// Note a request is made up of { query, headers, body}
exports = async function(request, response) {

  try {
    
    const error_collection = context.services.get("mongodb-atlas").db("errors").collection("errors");
    const position_collection = context.services.get("mongodb-atlas").db("ais").collection("positions");
    let docs = [];

    // 1. Parse data from the incoming request
    if(request.body === undefined) {
      throw new Error(`Request body was not defined.`)
    }
    var json_array = EJSON.parse(request.body.text());
    
    // 2. perform range and boundary checks:
    // - mandatory:
    //    - json is an array
    //    - mmsi - 9 digit number
    //    - pos - lat lon within bounds
    //    - unix timestamp 
    //    - normal timestamp
    if (!Array.isArray(json_array)){
      throw new Error("json is not an array");
    } 
    
    json_array.forEach((json) => {

      let err = [];
      
      if ( 'mmsi' in json){
        if ( json.mmsi <= 99999999 || json.mmsi > 999999999 ) { 
          err.push("mmsi is out of range");
        }
      } else {
        err.push("mmsi is missing");
      }
  
      if ( 'pos' in json){
        if ('coordinates' in json.pos) {
          let lon = json.pos.coordinates[0];
          let lat = json.pos.coordinates[1];      
          if ( lat < -90 || lat > 90 ) { 
            err.push("lat is out of range");
          }
          if ( lon < -180 || lon > 180 ) { 
            err.push("lon is out of range");
          }
        } else {
          err.push("coords are missing");
        }
      } else {
        err.push("pos is missing");
      }
      
      if (!('unix' in json)){
        err.push("unix is missing");
      }
      
      if (!('time' in json)){
        err.push("time is missing");
      }
      
      // Check optional fields
      //    - cog & sog - must be positive numbers
      //    - name - string
      //    - fleet - string
      //    - org - string
      //    - type - positive integer 
      //    - tag - string
      //    - err - array of strings
      if ( 'cog' in json) {
        if ( json.cog < 0 ) { 
          err.push("cog is negative");
        }
      }
      if ( 'sog' in json) {
        if ( json.sog < 0 ) { 
          err.push("sog is negative");
        }
      }
  
      // 3. Add Vessel info - name, fleet, org
      //if(err.length == 0) {
      //  var vessels_collection = context.services.get("coastguard").db("ais").collection("vessels");
      //  let vessel_info = await vessels_collection.findOne( { 'mmsi': json.mmsi} )
      //  if(vessel_info) {
      //    // just add the fields of interest
      //    var vessel = {};
      //    if ('vessel' in json)
      //    {
      //      vessel = json.vessel;
      //    }
      //    // does mmsi exist already?
      //    if (!('mmsi' in vessel))
      //    {
      //      vessel.mmsi = vessel_info.mmsi;
      //    }
      //    // does name exist already?
      //    if (!('name' in vessel))
      //    {
      //      vessel.name = vessel_info.name;
      //    }
      //    vessel.fleet = vessel_info.fleet;
      //    vessel.org = vessel_info.org;
      //    json.vessel = vessel;
      //  }
      //}  
    
      // 4. Add a source tag and final check for any errors
      json.tag = "api";
      if (err.length == 0) {
        docs.push(json);
      } else {
            
        // Save the error for later
        // throw new Error(err.toString());
        let error_doc = 
        {
          time: new Date(),
          tag: 'api',
          message: error.message,
          json : request.body.text()
        }
        error_collection.insertOne( error_doc );
      }
    });

    // 5. Store the position in the positions collection    
    //const { insertedId } = await context.services
    //  .get("coastguard")
    //  .db("ais")
    //  .collection("positions")
    //  .insertMany(json);
      
    // 6. Configure the response
    // var result = "true";
    //response.setStatusCode(201);
    //response.setBody(JSON.stringify({ result, insertedId }));
    
    // 5. Store the position in the positions collection
    position_collection.insertMany(docs);
    response.setStatusCode(201);
    
  } catch (error) {

    // Send back the error message
    const status = 400;
    const message = error.message;
    const body = request.body.text();
    response.setStatusCode(status);
    response.setHeader("Content-Type","application/json");
    response.setBody(JSON.stringify({status, message, body}));
    
  }
};
