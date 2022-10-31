import React from "react";
import { Outlet } from "react-router-dom";
//import Navbar from "./Navbar";

//const Layout = () => {
//    return (
//        <>
//            <Navbar />
//            <Outlet />
//        </>
//    );
//};
const Layout = () => {
    return (
        <>
            <Outlet />
        </>
    );
};

export default Layout;