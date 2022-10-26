import React from "react";
import { IconContext } from "react-icons";
import { Link } from "react-router-dom";
import Icon from "./../Common/Icon"

function Next({ link, icon, classes, styles }) {
    return (
        <div className={classes}>
            <Link className="next-link" to={link}>
                <IconContext.Provider value={styles}>
                    <Icon name={icon} />
                </IconContext.Provider>
            </Link>
        </div>
    );
}

Next.defaultProps = {
    link: "",
    icon: "Bug",
    classes: "wrapper right",
    styles: {
        color: "#FFF",
        size: "30px"
    }
}

export default Next;
