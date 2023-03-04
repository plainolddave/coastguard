import axios from "axios"
const API_ENDPOINT = "https://ap-southeast-2.aws.data.mongodb-api.com/app/signalk-jtrvz/endpoint/bom";

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

        let url = `${API_ENDPOINT}?field=${event.queryStringParameters.field || "all"}`;
        if (event.queryStringParameters.id) { url += `&station=${event.queryStringParameters.id}` }; // wmo id
        if (event.queryStringParameters.from) { url += `&from=${event.queryStringParameters.from}` };
        if (event.queryStringParameters.to) { url += `&to=${event.queryStringParameters.to}` };
        url += `&limit=${event.queryStringParameters.limit || "1"}`;

        let config = API_CONFIG;
        config.headers["true-client-ip"] = event.headers['x-nf-client-connection-ip'];
        config.headers["true-user-agent"] = event.headers['user-agent'];
        const response = await axios.get(url, config);
        const data = JSON.stringify(response.data);

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
