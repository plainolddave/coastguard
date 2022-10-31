import React from "react";

function Loader({ isLoading = false }) {

    const loaderStyle = {
        display: (isLoading ? "grid" : "none")
    };

    return (
        <div className="loader-wrapper" style={loaderStyle}>
            <div className="loader-background"></div>
            <div className="loader-spinner">
                <div className="loader-div solid">
                    <div className="loader-div solid">
                        <div className="loader-div solid">
                            <div className="loader-div solid">
                                <div className="loader-div solid">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Loader;