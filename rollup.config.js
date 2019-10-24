import "ts-node/register";
import builtins from 'rollup-plugin-node-builtins';
import commonjs from "rollup-plugin-commonjs";
import fetch from "isomorphic-unfetch";
import url from 'url';
import { transform } from "@babel/core"
import resolve from  "version-resolver";

// TODO: .json

module.exports = {
  input: "./src/index.js",
  output: {
    file: 'dist/bundle.js',
    format: 'umd'
  },
  plugins: [
    cdn(),
    commonjs({}),
    builtins()
  ]
}

const pkg = {
  dependencies: {
    "react": "16.*.*",
    "react-dom": "16.*.*"
  }
}

const cdnPrefix = "https://cdn.jsdelivr.net/npm"
let resolved;

function addJsExt(p) {
  return p.endsWith(".js") ? p : p + ".js";
}

function cdn() {
  return {
    async resolveId(id, _importer) {
      // console.log("[id]",id, "from", importer);
      resolved = resolved || await resolve(pkg.dependencies);

      if (!id.startsWith(".")) {
        const [pkgName, ...pkgPaths] = id.split("/");
        const resPkgName = Object.keys(resolved.resDependencies).find(n => n.split("@")[0] === pkgName);
        if (resPkgName) {
          const [name, version] = resPkgName.split("@");
          const pkgPath = pkgPaths.join("/") || resolved.resDependencies[resPkgName].main || "index.js";
          const cdnPath = `${cdnPrefix}/${name}@${version}/${pkgPath}`;
          return addJsExt(cdnPath);
        }

        if (resolved.appDependencies[pkgName]) {
          const pkg = resolved.appDependencies[pkgName];
          const version = pkg.version;
          const pkgPath = pkgPaths.join("/") || pkg.module || pkg.main || "index.js";
          const cdnPath = `${cdnPrefix}/${pkgName}@${version}/${pkgPath}`;
          return addJsExt(cdnPath);
        }

        if (id.startsWith(cdnPrefix)) {
          return id;
        }
      }
    },

    async load(id) {
      // console.log("[load]", id);
      if (id.startsWith(cdnPrefix)) {
        const res = await fetch(id);
        const code = await res.text();

        const out = transform(code, {
          babelrc: false,
          plugins: [{
            visitor: {
              CallExpression(path) {
                if (path.node.callee.name === "require") {
                  const target = path.node.arguments[0].value;
                  if (target.startsWith(".")) {
                    const resolved = url.resolve(id, target);
                    if (resolved.endsWith(".js")) {
                      path.node.arguments[0].value = resolved;
                    } else {
                      path.node.arguments[0].value = resolved + ".js";
                    }
                  }
                }
              }
            }
          }]
        });
        return out.code;
      }
    },
  }
}