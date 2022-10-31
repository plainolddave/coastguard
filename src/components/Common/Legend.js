import React, { useMemo } from "react";

function Legend({
    map = null,
    colors = new Map(),
    ...restProps }) {

    const displayLegend = useMemo(
        () => (
            <table className="center">
                <thead><tr><td></td><td></td></tr></thead>
                <tbody>
                    {Array.from(colors.values()).map((value, index) =>
                        <tr key={`lg_${value.label}`}>
                            <td><img className="sidebar-icon" src={value.icon.url} alt="" /></td>
                            <td className="sidebar-label">{value.label}</td>
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