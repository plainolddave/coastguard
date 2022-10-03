import axios from "axios"
const API_ENDPOINT = "https://proxy.cors.sh/https://data.mongodb-api.com/app/data-xplts/endpoint/fleet_activity";
const API_CONFIG = {
    headers: {
        'api-key': 'ge7IDbWs23g84J2smkY82GP0waJUjRz1YngcZPQkmL0zpfUTx8meeOS3Rk7RCvcR',
        'Accept': 'application/json'
    }
}

export async function handler(event, context) {

    try {

        if (event.httpMethod !== "GET") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        //let url = `${API_ENDPOINT}?path=${event.queryStringParameters.field || "vessels"}`;
        //if (event.queryStringParameters.from) { url += `&from=${event.queryStringParameters.from}` };
        //if (event.queryStringParameters.to) { url += `&to=${event.queryStringParameters.to}` };
        //url += `&limit=${event.queryStringParameters.limit || "1000"}`;

        const response = await axios.get(API_ENDPOINT, API_CONFIG);
        const data = JSON.stringify(response.data);
/*        console.log(`url: ${url} response: ${data}`) */

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
