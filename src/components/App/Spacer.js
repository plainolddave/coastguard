import React from "react";

/**
 * Simple spacer, that can be adjusted by name using CSS
 **/
function Spacer({ height, width }) {
    return (
        <div
            className="wrapper" style={{height: height, width: width}}> 
        </div>
    );
}

Spacer.defaultProps = {
    height: "10px",
    width: "100%"
}

export default Spacer;
