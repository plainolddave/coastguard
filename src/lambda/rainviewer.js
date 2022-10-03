import axios from "axios"
export async function handler(event, context) {
    try {
        const response = await axios.get("https://api.rainviewer.com/public/maps.json", { headers: { Accept: "application/json" } })
        const data = response.data
        return {
            statusCode: 200,
            body: JSON.stringify({ msg: data })
        }
    } catch (err) {
        console.log(err) // output to netlify function log
        return {
            statusCode: 500,
            body: JSON.stringify({ msg: err.message })
        }
    }
}
