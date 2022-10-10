import React, { useEffect, useState } from "react";
import * as dayjs from 'dayjs'

/**
 * Displays time and date
 *
 * @returns {JSX.Element} Clock component
 */
function Clock() { // { sunrise, sunset }) {

    const [dateNow, setDateNow] = useState(new Date());

    useEffect(() => {
        const clockInterval = setInterval(() => {
            setDateNow(new Date());
        }, 1000);
        return () => {
            clearInterval(clockInterval);
        };
    }, []);

    return (
        <div className="wrapper clock">
            <div className="label">{dayjs(dateNow).format("ddd D MMMM YYYY")}</div>
            <div className="numeral">{dayjs(dateNow).format("HH:mm:ss")}</div>
        </div>
    );
}
//{/*<div class="label">{`sunrise ${dayjs(sunrise).format("HH:mm")} sunset ${dayjs(sunset).format("HH:mm")}`}</div>*/ }

//Clock.defaultProps = {
//    sunrise: new Date(2022, 1, 1, 0, 0, 0, 0),
//    sunset: new Date(2022, 1, 1, 0, 0, 0, 0)
//}

export default Clock;
