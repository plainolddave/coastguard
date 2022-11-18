import React, { useEffect, useState } from "react";
import * as dayjs from 'dayjs'

function Clock() { 

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

export default Clock;
