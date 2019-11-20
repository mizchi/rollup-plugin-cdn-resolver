import "isomorphic-unfetch";
import builtins from "rollup-plugin-node-builtins";
import commonjs from "rollup-plugin-commonjs";
import { rollup } from "rollup";
import virtual from "rollup-plugin-virtual";
import cdnResolver, { getTypings } from "../";

jest.setTimeout(1000 * 15);

// TODO: .json
const preactCode = `import { h } from "preact";
import { useState } from "preact/hooks";
console.log(h("div", null, "hello"));
`;

const reactCode = `import React from "react";
import ReactDOMServer from "react-dom/server";

const result = ReactDOMServer.renderToString(React.createElement("div", {id: "x"}, "hello"));
console.log(result);`;

it("build svelte/compiler", async () => {
  const pkg = {
    private: true,
    dependencies: {
      svelte: "3.12.1"
    }
  };

  const config = {
    input: "index.js",
    plugins: [
      virtual({
        "index.js": `import * as compiler from "svelte/compiler"; console.log("svelte", compiler);`
      }),
      cdnResolver({ pkg }),
      commonjs({}),
      builtins()
    ]
  };

  const bundle = await rollup(config as any);
  const gen = await bundle.generate({
    format: "umd"
  });
  const code = gen.output[0].code;
  // console.log("svelte", code);
  // eval(code);
});

it("build rollup", async () => {
  const pkg = {
    private: true,
    dependencies: {
      rollup: "1.27.1"
    }
  };

  const config = {
    input: "index.js",
    plugins: [
      virtual({
        "index.js": `import { rollup } from "rollup/dist/rollup.browser.es.js"; console.log("rollup", rollup);`
      }),
      cdnResolver({ pkg }),
      commonjs({}),
      builtins()
    ]
  };

  const bundle = await rollup(config as any);
  const gen = await bundle.generate({
    format: "umd"
  });
  const _code = gen.output[0].code;
});

it("bulid preact", async () => {
  const pkg = {
    private: true,
    dependencies: {
      preact: "10.0.1"
    }
  };

  const config = {
    input: "index.js",
    plugins: [
      virtual({
        "index.js": preactCode
      }),
      cdnResolver({ pkg }),
      commonjs({}),
      builtins()
    ]
  };

  const bundle = await rollup(config as any);
  const gen = await bundle.generate({
    format: "umd"
  });
  const code = gen.output[0].code;
  eval(code);
});

it("bulid react/react-dom", async () => {
  const pkg = {
    private: true,
    dependencies: {
      react: "16.*.*",
      "react-dom": "16.*.*"
    }
  };

  const config = {
    input: "index.js",
    plugins: [
      virtual({
        "index.js": reactCode
      }),
      cdnResolver({ pkg }),
      commonjs({}),
      builtins()
    ]
  };

  const bundle = await rollup(config as any);
  const gen = await bundle.generate({
    format: "umd"
  });
  const code = gen.output[0].code;
  eval(code);
  // console.log(gen.output[0].code);
});

it("resolve npm types", async () => {
  const pkg = {
    private: true,
    dependencies: {
      preact: "10.*.*",
      "@types/lodash": "4.*"
    }
  };

  const _typings = await getTypings(pkg);
  // console.log(_typings);
  // console.log(typings);

  // const config = {
  //   input: "index.js",
  //   plugins: [
  //     virtual({
  //       "index.js": reactCode
  //     }),
  //     cdnResolver({ pkg }),
  //     commonjs({}),
  //     builtins()
  //   ]
  // };

  // const bundle = await rollup(config as any);
  // const gen = await bundle.generate({
  //   format: "umd"
  // });
  // const code = gen.output[0].code;
  // eval(code);
  // console.log(gen.output[0].code);
});
