/**
 * Resolves the tree at one edge of every declared peer range, so that CI measures the range this package
 * promises rather than the one version its lockfile happens to name.
 *
 *   node scripts/install-peer-edge.mjs floor    the lowest published version each range admits
 *   node scripts/install-peer-edge.mjs latest   the highest
 *
 * The lockfile gives the main jobs the opposite property, and both are wanted: it pins what a developer
 * resolved, so CI runs what the developer ran - and a peer released after that resolution is then first met by
 * whoever runs `npm update`. This is what meets it first instead.
 *
 * It rewrites package.json and deletes package-lock.json in the working directory. Run it in a throwaway
 * checkout, which is what a CI job is.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';

const edge = process.argv[2];
if (edge !== 'floor' && edge !== 'latest') {
  console.error('usage: node scripts/install-peer-edge.mjs floor|latest');
  process.exit(2);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const peers = Object.entries(pkg.peerDependencies ?? {});

if (edge === 'floor') {
  // A peer is pinned through devDependencies: `overrides` refuses to name a package the manifest already
  // declares, and a direct dependency is what decides the version an auto-installed peer resolves to.
  for (const [name, range] of peers) {
    const versions = execFileSync('npm', ['view', `${name}@${range}`, 'version'], { encoding: 'utf8' })
      .trim()
      .split('\n')
      // one line per satisfying version, lowest first: a bare version where the range admits only one, and
      // `name@version 'version'` where it admits several
      .map((line) => (line.match(/'([^']+)'\s*$/)?.[1] ?? line).trim())
      .filter(Boolean);
    if (!versions.length) throw new Error(`no published version of ${name} satisfies ${range}`);
    pkg.devDependencies[name] = versions[0];
  }
  writeFileSync('package.json', `${JSON.stringify(pkg, null, 2)}\n`);
}

// no lockfile, so every range resolves afresh - which for `latest` is the whole of what this job does
rmSync('package-lock.json', { force: true });
execFileSync('npm', ['install', '--no-audit', '--no-fund'], { stdio: 'inherit' });

console.log(`\nResolved at the ${edge} of every declared peer range:`);
for (const [name, range] of peers) {
  const { version } = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
  console.log(`  ${name.padEnd(34)} ${version.padEnd(10)} (declared ${range})`);
}
