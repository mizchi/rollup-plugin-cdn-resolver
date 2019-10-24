// Run pure js
import foo from './foo';
import bar from './bar';

console.log("hello", foo, bar);

// Run react
import React from "react";
import ReactDOMServer from "react-dom/server";

const result = ReactDOMServer.renderToString(React.createElement("div", {id: "x"}, "hello"));
console.log(result);
