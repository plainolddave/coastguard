import React, { useState, useEffect } from "react"
import { Route, Routes, Outlet, Navigate, useLocation } from "react-router-dom";
import { usePageVisibility } from 'react-page-visibility';
import HideCursorOnIdle from "./Common/HideCursorOnIdle";
import { Log } from "./Common/Utils"
import Dashboard from "./Dashboard";
import History from "./History";
import "./App.css"

export const VisibilityContext = React.createContext();

function App() {

    const [pageNow, setPageNow] = useState("none");
    const location = useLocation();
    const visible = usePageVisibility();

    useEffect(() => {
        let newPage = "none";
        if (visible) {
            newPage = location.pathname;
        }
        setPageNow(newPage);
        Log("App", `visible: ${visible} page: ${newPage}`);
    }, [location, visible]);

    return (
        <>
            <Routes>
                <Route path="/" element={<Outlet />}>
                    <Route index element={<Navigate to="dashboard" />} />
                    <Route path="dashboard" element={<Dashboard isVisible={(pageNow === "/dashboard" ? true : false)} />} />
                    <Route path="history" element={<History isVisible={(pageNow === "/history" ? true : false)} />} />
                    <Route path="*" element={<Navigate to="dashboard" />} />
                </Route>
            </Routes>
            <HideCursorOnIdle />
        </>
    );
}

export default App;
