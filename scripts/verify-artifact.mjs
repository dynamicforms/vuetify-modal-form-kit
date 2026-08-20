/**
 * Loads the built ESM artifact and exercises it, so that what the package publishes is checked rather than what
 * the source compiles to under the test runner. The specs import `src/`; nothing else reaches `dist/`.
 *
 * Run after `npm run build`.
 */
import { strict as assert } from 'node:assert';
import { registerHooks } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { JSDOM } from 'jsdom';

// The artifact imports Vuetify components, and those import their own stylesheets. A bundler resolves a `.css`
// import; node does not, and refuses the extension. Nothing here renders, so an empty module is all it needs.
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith('.css')) return { format: 'module', shortCircuit: true, source: 'export default {};' };
    return nextLoad(url, context);
  },
});

// The artifact reaches its peers, and two of them touch the DOM as they load: Vuetify reads `window`, and
// CKEditor - which @dynamicforms/vuetify-inputs pulls in for its RTF editor - builds an element at module scope.
// Nothing below renders; this is what lets the module graph load at all outside a browser.
const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
// Everything the window carries that this process does not: node defines a few of these as getters of its own,
// so each is defined rather than assigned.
for (const name of Object.getOwnPropertyNames(dom.window)) {
  if (name in globalThis && name !== 'navigator') continue;
  const value = dom.window[name];
  if (typeof value === 'function' || typeof value === 'object') {
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  }
}
Object.defineProperty(globalThis, 'window', { value: dom.window, configurable: true, writable: true });

const artifact = pathToFileURL(resolve('dist/dynamicforms-vuetify-modal-form-kit.js')).href;
const m = await import(artifact);

// the export list, stated here so that dropping one is a failed build rather than a consumer's report
const expected = [
  'ComponentRender',
  'DfModal',
  'DialogSize',
  'DynamicFormsModalFormKit',
  'FormBuilder',
  'FormBuilderBodyProp',
  'FormLayout',
  'FormRender',
  'ModalView',
  'defaultDialogSize',
  'modal',
];
const missing = expected.filter((name) => !(name in m));
assert.equal(missing.length, 0, `the artifact is missing exports: ${missing.join(', ')}`);

// the layout classes are reached through the FormLayout namespace, which is the only place they are exported
const expectedInNamespace = [
  'Column',
  'Component',
  'ComponentBuilderBase',
  'FormBuilder',
  'FormBuilderBodyProp',
  'FormBuilderName',
  'Row',
  'VuetifyInputsComponentBuilder',
];
const missingInNamespace = expectedInNamespace.filter((name) => !(name in m.FormLayout));
assert.equal(missingInNamespace.length, 0, `FormLayout is missing: ${missingInNamespace.join(', ')}`);

// a layout end to end: the fluent builder, a breakpoint, a nested form, and the JSON round trip
const address = new m.FormBuilder();
address.simple(2).dfInput({ label: 'City' }).dfInput({ label: 'ZIP' });

const layout = new m.FormBuilder();
layout.simple(2).dfInput({ label: 'First name' }).dfInput({ label: 'Last name' });
layout.row({}, (row) => row.col({ cols: 12 }, (col) => col.component((c) => c.nestedForm(address))));
layout.breakpoint('md', (form) => {
  form.simple(1).dfTextArea({ label: 'Notes' });
  return form;
});

const json = layout.toJSON();
assert.equal(json.rows.length, 2, 'two columns per row, so two inputs make one row and the nested form a second');
assert.equal(json.rows[0].columns[0].components[0].props.label, 'First name', 'a component keeps its props');
assert.ok(json.md, 'a declared breakpoint is serialized');

// the JSON reads back into the same layout: <form-render> takes either, and has to render the same thing
assert.deepEqual(m.FormBuilder.fromJSON(json).toJSON(), json, 'the layout survives a JSON round trip');

// a breakpoint states only what it changes, and resolves against the base
const md = layout.getOptionsForBreakpoint('md');
assert.equal(md.rows.length, 1, 'the md breakpoint states rows of its own');

// the dialog stack, without a view to render it
assert.equal(m.modal.isInstalled(), false, 'no <modal-view> is mounted here');
assert.equal(m.DialogSize.fromString('lg'), m.DialogSize.LARGE, 'a size identifier resolves');
assert.equal(m.DialogSize.isDefined('nonsense'), false, 'and one that names no size is refused');

console.log('artifact ok');
