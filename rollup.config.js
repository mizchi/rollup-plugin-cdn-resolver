import "ts-node/register";
import commonjs from "rollup-plugin-commonjs";
import fetch from "isomorphic-unfetch";
import url from 'url';
import { transform } from "@babel/core"
import resolve from  "version-resolver";

module.exports = {
  input: "src/index.js",
  output: {
    file: 'dist/bundle.js',
    format: 'umd'
  },
  plugins: [
    cdn(),
    // commonjs()
    commonjs({
      // include: /^https:\/\/cdn\.jsdelivr\.net/
    })
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
function cdn() {
  return {
    async resolveId(id, importer) {
      resolved = resolved || await resolve(pkg.dependencies);
      console.log("[id]",id, "from", importer);

      // TODO: xxx/yyy pattern
      // TODO: .json
      // TODO: .wasm

      if (!id.startsWith(".")) {
        // CDN handler start
        const [pkgName, ...pkgPaths] = id.split("/");
        const resPkgName = Object.keys(resolved.resDependencies).find(n => n.split("@")[0] === pkgName);
        if (resPkgName) {
          const [name, version] = resPkgName.split("@");
          const pkgPath = pkgPaths.join("/") || resolved.resDependencies[resPkgName].main || "index.js";
          const cdnPath = `${cdnPrefix}/${name}@${version}/${pkgPath}`;
          return cdnPath.endsWith(".js") ? cdnPath : cdnPath + ".js";
        }

        if (resolved.appDependencies[id]) {
          const pkg = resolved.appDependencies[pkgName];
          const version = pkg.version;
          const pkgPath = pkgPaths.join("/") || pkg.module || pkg.main || "index.js";
          const cdnPath = `${cdnPrefix}/${id}@${version}/${pkgPath}`;
          return cdnPath.endsWith(".js") ? cdnPath : cdnPath + ".js";
        }

        if (id.startsWith(cdnPrefix)) {
          return id;
        }
      }

    },
    async load(id) {
      console.log("[load]", id);
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
                  console.log("TODO: target with pass", target);
                  // react-dom/server
                  // handle relative path
                  if (target.startsWith(".")) {
                    const resolved = url.resolve(id, target);
                    if (resolved.endsWith(".js")) {
                      path.node.arguments[0].value = resolved;
                    } else {
                      path.node.arguments[0].value = resolved + ".js";
                    }
                  }
                }
                // console.log("callee", path.node.callee.name)
              }
            }
          }]
        });
        return out.code;
      }
    },
  }
}