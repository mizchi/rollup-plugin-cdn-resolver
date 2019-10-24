// import foo from './foo';
// import bar from './bar';
// import lazy from 'lazy';
// // import React from "https://cdn.jsdelivr.net/npm/react@16.11.0/index.js"
// import React from "react"

// console.log("hello", foo, lazy, bar, React);

import React from "react";
// import ReactDOM from "react-dom";
// ReactDOM.render(React.createElement("div", {id: "x"}, "hello"), document.querySelector(".main"));

import ReactDOMServer from "react-dom/server";
ReactDOMServer.renderToString(React.createElement("div", {id: "x"}, "hello"));
