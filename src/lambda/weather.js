import axios from "axios"
const API_ENDPOINT = "https://ap-southeast-2.aws.data.mongodb-api.com/app/signalk-jtrvz/endpoint/weather";
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

        let url = `${API_ENDPOINT}?field=${event.queryStringParameters.field || "obs"}`;
        if (event.queryStringParameters.from) { url += `${url}&from=${event.queryStringParameters.from}` };
        if (event.queryStringParameters.to) { url += `${url}&to=${event.queryStringParameters.to}` };
        url += event.queryStringParameters.limit || "1";

        console.log(`get url: ${url}`) 

        const response = await axios.get(url, API_CONFIG);
        const data = response.data

        console.log(`response: ${JSON.stringify(data) }`) 

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        }

    } catch (err) {

        console.log(err) 
        return {
            statusCode: 500,
            body: JSON.stringify({ msg: err.message })
        }
    }
}
