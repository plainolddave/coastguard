import axios from "axios"
const API_ENDPOINT = "https://ap-southeast-2.aws.data.mongodb-api.com/app/signalk-jtrvz/endpoint/fleet";
const API_CONFIG = {
    headers: {
        'api-key': `${REACT_APP_API_KEY}`,
        'Accept': 'application/json'
    }
}
export async function handler(event, context) {

    try {

        if (event.httpMethod !== "GET") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        let url = API_ENDPOINT + `?limit=${event.queryStringParameters.limit || "1000"}`;
        if (event.queryStringParameters.from) { url += `&from=${event.queryStringParameters.from}` };
        if (event.queryStringParameters.to) { url += `&to=${event.queryStringParameters.to}` };
        if (event.queryStringParameters.mins) { url += `&mins=${event.queryStringParameters.mins}` };
        if (event.queryStringParameters.sog) { url += `&sog=${event.queryStringParameters.sog}` };
        if (event.queryStringParameters.org) { url += `&org=${event.queryStringParameters.org}` };

        const response = await axios.get(url, API_CONFIG);
        const data = JSON.stringify(response.data);
        console.log(`url: ${url} response: ${data}`)

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
            },
            body: data
        }

    } catch (err) {

        console.log(err)
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow from anywhere 
            },
            body: JSON.stringify({ msg: err.message })
        }
    }
}