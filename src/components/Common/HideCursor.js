import { useEffect, useState, useRef } from 'react';
import * as dayjs from 'dayjs'

const settings = {
    cursorIsHidden: {
        visibility: "visible",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        width: "100vw",
        backgroundColor: "transparent",
        cursor: "none",
        margin: 0,
        padding: 0,
        border: 0,
        zIndex: 9999
    },
    cursorIsVisible: {
        visibility: "hidden",
        cursor: "auto"
    },
    idleTimeoutMillis: 5000
}

// Hide the cursor if no mouse movements have been detected for an interval
function HideCursorOnIdle({
    idleMillis = settings.idleTimeoutMillis,
    ...restProps }) {

    const [cursorIsVisible, setCursorIsVisible] = useState(false);
    const mousePos = useRef({ x: 0, y: 0, timestamp: dayjs() });
    const mouseIdleTimer = useRef(null);

    useEffect(() => {
        const handleMouseMove = (event) => {
            if (mousePos.current.x !== event.clientX || mousePos.current.y !== event.clientY) {
                mousePos.current = { x: event.clientX, y: event.clientY, timestamp: dayjs() };
                setCursorIsVisible(true);
                //console.log(`cursor: on x: ${mousePos.current.x} y: ${mousePos.current.y}`);
 
                if (mouseIdleTimer.current) {
                    clearInterval(mouseIdleTimer.current);
                    mouseIdleTimer.current = null;
                }

                mouseIdleTimer.current = setTimeout(() => {
                    //console.log(`cursor: off`);
                    setCursorIsVisible(false);
                }, idleMillis);

            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            //console.log(`cursor: exit`);
            if (mouseIdleTimer.current) {
                clearInterval(mouseIdleTimer.current);
            }
            window.removeEventListener(
                'mousemove',
                handleMouseMove
            );
        };
    }, [idleMillis]);

    return (
        <div style={cursorIsVisible ? settings.cursorIsVisible : settings.cursorIsHidden}></div>
    )
}

export default HideCursorOnIdle;
