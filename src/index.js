//import * as serviceWorker from './serviceWorker';
//// If you want your app to work offline and load faster, you can change
//// unregister() to register() below. Note this comes with some pitfalls.
//// Learn more about service workers: http://bit.ly/CRA-PWA
//serviceWorker.unregister();

import React from "react"
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from "react-router-dom";
import App from './components/App';
import './index.css';

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

root.render(
    <Router>
        <App />
    </Router>
);

//root.render(
//    <StrictMode>
//        <Router>
//            <App />
//        </Router>
//    </StrictMode>,
//);
