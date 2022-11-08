import React, { useMemo } from "react";
import * as dayjs from 'dayjs'

function Legend({
    map = null,
    colors = new Map(),
    fromDate = new Date(),
    toDate = new Date(),
    ...restProps }) {

    const displayLegend = useMemo(
        () => (
            <table className="center">
                <thead><tr><td></td><td></td></tr></thead>
                <tbody>
                    <tr>
                        <td className="sidebar-label left">From</td>
                        <td className="sidebar-label left">{dayjs(fromDate).format("D MMM YYYY")}</td>
                    </tr>
                    <tr><td>&nbsp;</td><td></td></tr>
                    <tr>
                        <td className="sidebar-label left">To</td>
                        <td className="sidebar-label left">{dayjs(toDate).format("D MMM YYYY")}</td>
                    </tr>
                    <tr><td>&nbsp;</td><td></td></tr>
                    {Array.from(colors.values()).map((value, index) =>
                        <tr key={`lg_${value.label}`}>
                            <td><img className="sidebar-icon" src={value.icon.url} alt="" /></td>
                            <td className="sidebar-label left">{value.label}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        ),
        [colors],
    );

    return (
        <div className="page">
            {displayLegend}
        </div>
    )
}

export default Legend;

//style = "width:20px;height:20px;"