/**
 * Type-checks the emitted declarations against the lowest Vue the `vue` peer range admits, which is a different
 * question from the one `peer-range (floor)` answers: that job compiles the source, this one compiles what the
 * tarball ships. `dist/index.d.ts` names Vue's own types - `DefineComponent` carries a type argument for every
 * component this package exports - and their arity moves between Vue patch releases, so a declaration file that
 * the developer's Vue accepts can still be unusable to a consumer sitting on the floor with `skipLibCheck` off.
 *
 *   node scripts/typecheck-dist-vue-floor.mjs      after `npm run build`
 *
 * It resolves a throwaway tree in the system temp directory: TypeScript, Vue pinned at the floor, and every other
 * declared peer the declarations import, at the range this package declares for it. Diagnostics raised inside
 * `node_modules` are counted and not failed on - they belong to the peers' own declaration files, which this
 * package neither emits nor can fix.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DECLARATIONS = 'dist/index.d.ts';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const declarations = readFileSync(DECLARATIONS, 'utf8');

// the peers the declarations name: the rest of the peer range has no say in whether these types resolve
const imported = new Set([...declarations.matchAll(/ from '([^']+)';/g)].map(([, source]) => source));
const peers = Object.entries(pkg.peerDependencies).filter(([name]) => imported.has(name));

const lowestSatisfying = (name, range) => {
  const versions = execFileSync('npm', ['view', `${name}@${range}`, 'version'], { encoding: 'utf8' })
    .trim()
    .split('\n')
    // one line per satisfying version, lowest first: a bare version where the range admits only one, and
    // `name@version 'version'` where it admits several
    .map((line) => (line.match(/'([^']+)'\s*$/)?.[1] ?? line).trim())
    .filter(Boolean);
  if (!versions.length) throw new Error(`no published version of ${name} satisfies ${range}`);
  return versions[0];
};

const floor = lowestSatisfying('vue', pkg.peerDependencies.vue);
console.log(`Declared Vue floor: ${floor} (from ${pkg.peerDependencies.vue})`);

const work = mkdtempSync(join(tmpdir(), 'vue-floor-'));
console.log(`Probe: ${work}`);
copyFileSync(DECLARATIONS, join(work, 'lib.d.ts'));
writeFileSync(
  join(work, 'package.json'),
  `${JSON.stringify({ name: 'vue-floor-probe', private: true, version: '1.0.0', type: 'module' }, null, 2)}\n`,
);
writeFileSync(
  join(work, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        // the point of the exercise: a consumer who checks the declarations this package ships
        skipLibCheck: false,
        noEmit: true,
        types: [],
      },
      files: ['lib.d.ts', 'probe.ts'],
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  join(work, 'probe.ts'),
  `import {
  ComponentRender,
  DfModal,
  DialogSize,
  DynamicFormsModalFormKit,
  FormBuilder,
  FormLayout,
  FormRender,
  ModalView,
  modal,
} from './lib.js';

// the components carry the type arguments whose arity is Vue's to decide
export const components = { ComponentRender, DfModal, FormRender, ModalView };
export const plugin = DynamicFormsModalFormKit;
export const size: DialogSize = DialogSize.LARGE;
export const layout = new FormBuilder();
export const row = new FormLayout.Row();
export const api = modal;
`,
);

const install = [
  `typescript@${pkg.devDependencies.typescript}`,
  `vue@${floor}`,
  ...peers.filter(([name]) => name !== 'vue').map(([name, range]) => `${name}@${range}`),
];
console.log(`Resolving: ${install.join(' ')}`);
try {
  execFileSync('npm', ['install', '--no-audit', '--no-fund', ...install], { cwd: work, stdio: 'inherit' });
} catch {
  // npm refuses a tree it cannot satisfy, and the floor is a direct dependency here: a peer of a peer that asks
  // for a Vue newer than this range admits is a disagreement between the declared ranges, not a type error
  console.error(`::error::no tree resolves with Vue ${floor}, the floor of ${pkg.peerDependencies.vue}`);
  process.exit(1);
}

let diagnostics = '';
try {
  execFileSync(join(work, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], { cwd: work, encoding: 'utf8' });
} catch (error) {
  diagnostics = `${error.stdout ?? ''}${error.stderr ?? ''}`;
}

const lines = diagnostics.split('\n').filter(Boolean);
const ours = lines.filter((line) => /^(lib\.d\.ts|probe\.ts)\(/.test(line));
const theirs = lines.filter((line) => line.startsWith('node_modules/'));

console.log(`\n${theirs.length} diagnostics in the peers' own declarations, which this package does not emit`);
if (ours.length) {
  console.log(ours.join('\n'));
  console.error(`::error::${DECLARATIONS} does not type-check against Vue ${floor}`);
  // the probe stays, so that the tsc run that reported these can be repeated over it
  process.exit(1);
}

rmSync(work, { recursive: true, force: true });
console.log(`${DECLARATIONS} type-checks against Vue ${floor}`);
