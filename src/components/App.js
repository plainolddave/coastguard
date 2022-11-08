import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { usePageVisibility } from 'react-page-visibility';
import Layout from "./Layout";
import Dashboard from "./Dashboard";
import History from "./History";
//import NotFound from "./NotFound";
import "./App.css"

function App() {

    const isVisible = usePageVisibility();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard isVisible={isVisible} />} />
                    <Route path="dashboard" element={<Dashboard isVisible={isVisible} />} />
                    <Route path="history" element={<History isVisible={isVisible} />} />
                    <Route path="*" element={<Dashboard isVisible={isVisible} />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
