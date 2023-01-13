// This function is the endpoint's request handler...
exports = function({ query, headers, body}, response) {
  
  const collection = context.services.get("mongodb-atlas").db("signalk").collection("data");
  let data = JSON.parse(body.text());

  if (data != null) {
    
    data.forEach(record => {
      // for some reason dates dont survive being sent through
      if(record.time) {
        record.time = new Date(record.time);
        record.dt = Math.floor(record.time.getTime()/1000);
      }
      // clean up sme un-needed fields
      if(record.expiry) {
        delete record.expiry;
      }
      if(record.uid) {
        delete record.uid;
      }
      if(record.context) {
        let i = record.context.search('mmsi') + 5;
        if (i >= 5) {
        let str = record.context.substring(i, i + 9);
          record.mmsi = Number(str)
        }
      }
    });
    
    collection.insertMany(data)
      .then( result => {
        
        // send back the result
        const message = { 'result': 'ok', 'text': `saved ${result.insertedIds.length} records` };
        response.setStatusCode(200);
        response.setHeader("Content-Type","application/json");
        response.setBody(JSON.stringify(message));
          
      })
      .catch(error => {
        console.error(`error: ${error}`);
      });
  }
  
};
