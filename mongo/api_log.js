exports = async function (source, code, headers, data) {

    const collection = context.services.get("mongodb-atlas").db("logs").collection("api");
    const doc = { 'time': new Date() };
    if (source) doc["source"] = source;
    if (code) doc["code"] = code;
    //if (headers) doc["headers"] = headers;
    if (data) doc["data"] = data;
    doc["userIp"] = headers["True-Client-Ip"];
    doc["userAgent"] = headers["True-User-Agent"];
    doc["proxyIp"] = context.request.remoteIPAddress;
    doc["proxyAgent"] = context.request.httpUserAgent;

    return collection.insertOne(doc)
        .catch(error => {
            console.error(`Log error: ${error}`);
        });

};