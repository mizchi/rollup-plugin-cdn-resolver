import fetch from "isomorphic-unfetch";
import url from "url";
import hash from "object-hash";
import { transform } from "@babel/core";
import resolve from "./version-resolver";

export type CDNCache = {
  get(k: string): Promise<string>;
  set(k: string, v: string): Promise<void>;
  clear(): Promise<void>;
};

export default function cdnResolverPlugin(options: {
  host?: string;
  pkg: {
    dependencies: any;
    private?: boolean;
    name?: string;
    devDependencies?: any;
    peerDependencies?: any;
  };
  cache?: CDNCache;
}) {
  const host = options.host || "https://cdn.jsdelivr.net/npm";
  const pkg = options.pkg;
  const cache = options.cache || ((new Map() as any) as CDNCache);

  return {
    async resolveId(id: string, importer: string) {
      return resolveUrl(id, importer, host, pkg);
    },
    async load(id: string) {
      if (id.startsWith(host)) {
        const cached = await cache.get(id);
        if (cached) {
          return cached;
        }

        const code = await load(id);
        const out = transform(code, {
          babelrc: false,
          plugins: [rewriteToCdn(id)]
        });
        await cache.set(id, out.code);
        return out.code;
      }
    }
  };
}

// babel plugin
function rewriteToCdn(id: string) {
  return {
    visitor: {
      CallExpression(path) {
        // @ts-ignore
        if (path.node.callee.name === "require") {
          // @ts-ignore
          const target = path.node.arguments[0].value;
          if (target.startsWith(".")) {
            const resolved = url.resolve(id, target);
            // @ts-ignore
            path.node.arguments[0].value = addJsExt(resolved);
          }
        }
      }
    }
  };
}

// File loader with cache
const __file_cache: { [key: string]: string } = {};
async function load(id: string) {
  if (__file_cache[id]) {
    return __file_cache[id];
  }
  // TODO: handle json on fail js
  const res = await fetch(id);
  const code = await res.text();
  __file_cache[id] = code;
  return code;
}

function addJsExt(p: string) {
  return p.endsWith(".js") ? p : p + ".js";
}

// Package resolver with cache
const __pkgResolveCache: { [key: string]: any } = {};
async function resolveUrl(
  id: string,
  _importer: string,
  host: string,
  pkg: { dependencies: { [key: string]: string } }
) {
  const cacheKey = hash(pkg);
  let resolvedPkg = __pkgResolveCache[cacheKey];
  if (resolvedPkg == null) {
    __pkgResolveCache[cacheKey] = await resolve(pkg);
    resolvedPkg = __pkgResolveCache[cacheKey];
  }

  const [pkgName, ...pkgPaths] = id.split("/");
  const resPkgName = Object.keys(resolvedPkg.resDependencies).find(
    n => n.split("@")[0] === pkgName
  );
  if (resPkgName) {
    const [name, version] = resPkgName.split("@");
    const pkgPath =
      pkgPaths.join("/") ||
      resolvedPkg.resDependencies[resPkgName].module ||
      resolvedPkg.resDependencies[resPkgName].main ||
      "index.js";
    const cdnPath = `${host}/${name}@${version}/${pkgPath}`;
    return addJsExt(cdnPath);
  }

  if (resolvedPkg.appDependencies[pkgName]) {
    const pkg = resolvedPkg.appDependencies[pkgName];
    const version = pkg.version;
    const pkgPath = pkgPaths.join("/") || pkg.module || pkg.main || "index.js";
    const cdnPath = `${host}/${pkgName}@${version}/${pkgPath}`;
    return addJsExt(cdnPath);
  }

  if (id.startsWith(host)) {
    return id;
  }
}
