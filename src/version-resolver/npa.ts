// npm-package-arg
import semver from "semver";
import validatePackageName from "validate-npm-package-name";

const hasSlashes = /[/]/;
const isURL = /^(?:git[+])?[a-z]+:/i;
const isFilename = /[.](?:tgz|tar.gz|tar)$/i;

export default function npa(arg: any, where?: any): any {
  let name;
  let spec;
  if (typeof arg === "object") {
    if (arg instanceof Result && (!where || where === arg.where)) {
      return arg;
    } else if (arg.name && arg.rawSpec) {
      return resolve(arg.name, arg.rawSpec, where || arg.where);
    } else {
      return npa(arg.raw, where || arg.where);
    }
  }
  const nameEndsAt =
    arg[0] === "@" ? arg.slice(1).indexOf("@") + 1 : arg.indexOf("@");
  const namePart = nameEndsAt > 0 ? arg.slice(0, nameEndsAt) : arg;
  if (isURL.test(arg)) {
    spec = arg;
  } else if (
    namePart[0] !== "@" &&
    (hasSlashes.test(namePart) || isFilename.test(namePart))
  ) {
    spec = arg;
  } else if (nameEndsAt > 0) {
    name = namePart;
    spec = arg.slice(nameEndsAt + 1);
  } else {
    const valid = validatePackageName(arg);
    if (valid.validForOldPackages) {
      name = arg;
    } else {
      spec = arg;
    }
  }
  return resolve(name, spec, where, arg);
}

function resolve(name: string, spec: any, where: any, arg?: any) {
  const res = new Result({
    raw: arg,
    name: name,
    rawSpec: spec,
    fromArgument: arg != null
  });

  if (name) {
    res.setName(name);
  }

  return fromRegistry(res);
}

function invalidPackageName(name: string, valid: validatePackageName.Result) {
  const err = new Error(
    // @ts-ignore
    `Invalid package name "${name}": ${valid.errors.join("; ")}`
  );
  // @ts-ignore
  err.code = "EINVALIDPACKAGENAME";
  return err;
}

function invalidTagName(name: string) {
  const err = new Error(
    `Invalid tag name "${name}": Tags may not have any characters that encodeURIComponent encodes.`
  );
  // @ts-ignore
  err.code = "EINVALIDTAGNAME";
  return err;
}

class Result {
  type: any;
  registry: any;
  where: any;
  name: any;
  raw: any;
  escapedName: any;
  scope: any;
  rawSpec: string;
  saveSpec: any;
  fetchSpec: any;
  gitRange: any;
  gitCommittish: any;
  hosted?: boolean;

  constructor(opts: {
    fromArgument: boolean;
    type?: string;
    registry?: any;
    where?: any;
    raw?: string;
    name?: string;
    rawSpec?: string;
    saveSpec?: string;
    fetchSpec?: string;
    gitRange?: any;
    gitCommittish?: boolean;
    hosted?: boolean;
  }) {
    this.type = opts.type;
    this.registry = opts.registry;
    this.where = opts.where;
    if (opts.raw == null) {
      this.raw = opts.name ? opts.name + "@" + opts.rawSpec : opts.rawSpec;
    } else {
      this.raw = opts.raw;
    }
    this.name = undefined;
    this.escapedName = undefined;
    this.scope = undefined;
    this.rawSpec = opts.rawSpec == null ? "" : opts.rawSpec;
    this.saveSpec = opts.saveSpec;
    this.fetchSpec = opts.fetchSpec;
    if (opts.name) this.setName(opts.name);
    this.gitRange = opts.gitRange;
    this.gitCommittish = opts.gitCommittish;
    this.hosted = opts.hosted;
  }
  setName(name: string) {
    const valid = validatePackageName(name);
    if (!valid.validForOldPackages) {
      throw invalidPackageName(name, valid);
    }
    this.name = name;
    this.scope = name[0] === "@" ? name.slice(0, name.indexOf("/")) : undefined;
    // scoped packages in couch must have slash url-encoded, e.g. @foo%2Fbar
    this.escapedName = name.replace("/", "%2f");
    return this;
  }
}

function fromRegistry(res: any) {
  res.registry = true;
  const spec = res.rawSpec === "" ? "latest" : res.rawSpec;
  // no save spec for registry components as we save based on the fetched
  // version, not on the argument so this can't compute that.
  res.saveSpec = null;
  res.fetchSpec = spec;
  const version = semver.valid(spec, true);
  const range = semver.validRange(spec, true);
  if (version) {
    res.type = "version";
  } else if (range) {
    res.type = "range";
  } else {
    if (encodeURIComponent(spec) !== spec) {
      throw invalidTagName(spec);
    }
    res.type = "tag";
  }
  return res;
}
