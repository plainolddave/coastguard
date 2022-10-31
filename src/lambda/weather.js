import axios from "axios"
const API_ENDPOINT = "https://ap-southeast-2.aws.data.mongodb-api.com/app/signalk-jtrvz/endpoint/weather";

const API_CONFIG = {
    headers: {
        'api-key': `${process.env.REACT_APP_MONGO_API_KEY}`,
        'Accept': 'application/json'
    }
} 

export async function handler(event, context) {

    try {

        if (event.httpMethod !== "GET") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        let url = `${API_ENDPOINT}?field=${event.queryStringParameters.field || "obs"}`;
        if (event.queryStringParameters.from) { url += `&from=${event.queryStringParameters.from}` };
        if (event.queryStringParameters.to) { url += `&to=${event.queryStringParameters.to}` };
        url += `&limit=${event.queryStringParameters.limit || "1"}`;

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
