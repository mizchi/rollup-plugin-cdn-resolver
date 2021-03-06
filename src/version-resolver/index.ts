import { Resolver } from "./Resolver";

export type ResolvedVersions = {
  appDependencies: { [key: string]: string };
  resDependencies: { [key: string]: string };
  warnings: string[];
};

export default async function resolvePkgVersions(pkg: {
  dependencies: {
    [key: string]: string;
  };
}): Promise<ResolvedVersions> {
  const resolver = new Resolver();
  await resolver.load(pkg.dependencies);
  await resolver.hydrate();
  return resolver.getResult();
}
