import builtins from "rollup-plugin-node-builtins";
import commonjs from "rollup-plugin-commonjs";
import path from "path";
import cdnResolver from "../lib";
import { rollup } from "rollup";

// TODO: .json

const pkg = {
  private: true,
  dependencies: {
    react: "16.*.*",
    "react-dom": "16.*.*"
  }
};

const config = {
  input: path.join(__dirname, "src/index.js"),
  output: {
    file: path.join(__dirname, "dist/bundle.js"),
    format: "umd"
  },
  plugins: [cdnResolver({ pkg }), commonjs({}), builtins()]
};

async function main() {
  const p = await rollup(config as any);
  const gen = await p.generate({
    format: "iife"
  });
  console.log(gen.output[0]);
}

main();
