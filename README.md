# rollup-plguin-cdn-resolver

Run rollup bundler with CDN (jsdelivr/unpkg).

You can run this in browser.

## Install

```bash
# npm
npm install rollup-plguin-cdn-resolver -D
# yarn
yarn add rollup-plguin-cdn-resolver --dev
```

## Example

```js
import path from "path";
import { rollup } from "rollup";
import builtins from "rollup-plugin-node-builtins";
import commonjs from "rollup-plugin-commonjs";
import cdnResolver from "rollup-plugin-cdn-resolver";

const code = `
import React from "react";
import ReactDOMServer from "react-dom/server";
const result = ReactDOMServer.renderToString(React.createElement("div", {id: "x"}, "hello"));
console.log(result);
`;

const pkg = {
  private: true,
  dependencies: {
    react: "16.*.*",
    "react-dom": "16.*.*"
  }
};

async function main() {
  const bundle = await rollup({
    input: "./index.js",
    plugins: [
      virtual({ "./index.js": code }),
      cdnResolver({ pkg }),
      commonjs({}),
      builtins()
    ]
  });
  const gen = await bundle.generate({
    format: "iife"
  });
  console.log(gen.output[0].code); // Generated code
}

main();
```

## Related projects

- https://github.com/mjackson/rollup-plugin-url-resolve
- https://github.com/stackblitz/core/tree/master/turbo-resolver

## LICENSE

MIT
