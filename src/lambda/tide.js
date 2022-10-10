import axios from "axios"
const API_ENDPOINT = "https://ap-southeast-2.aws.data.mongodb-api.com/app/signalk-jtrvz/endpoint/tide";
const API_CONFIG = {
    headers: {
        'api-key': 'Eik2e3WiQpKligCnVUJEOPtav9oUUwN8Ai4qEUmICdSc27Q9R6BmAiP94kaNekKi',
        'Accept': 'application/json'
    }
}
export async function handler(event, context) {

    try {

        if (event.httpMethod !== "GET") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        let url = API_ENDPOINT + `?limit=${event.queryStringParameters.limit || "1000"}`;
        if (event.queryStringParameters.station) { url += `&station=${event.queryStringParameters.station}` };
        if (event.queryStringParameters.offset) { url += `&offset=${event.queryStringParameters.offset}` };
        if (event.queryStringParameters.from) { url += `&from=${event.queryStringParameters.from}` };
        if (event.queryStringParameters.to) { url += `&to=${event.queryStringParameters.to}` };

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