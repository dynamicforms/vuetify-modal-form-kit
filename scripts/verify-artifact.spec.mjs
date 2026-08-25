/**
 * Loads the built ESM artifact and exercises it, so that what the package publishes is checked rather than what
 * the source compiles to. Every other spec imports `src/`; nothing else reaches `dist/`.
 *
 * It runs under a config of its own - `npm run verify:artifact`, after `npm run build` - because `npm test` runs
 * before there is a `dist/` to load, and because the artifact reaches its peers: Vuetify and the CKEditor that
 * @dynamicforms/vuetify-inputs pulls in both touch the DOM and their own stylesheets as they load, which is what
 * the jsdom environment and Vite's resolution are for.
 */
import { describe, expect, it } from 'vitest';

import * as m from '../dist/dynamicforms-vuetify-modal-form-kit.js';

describe('the published artifact', () => {
  it('exports what the package documents', () => {
    // stated here, so that dropping one is a failed build rather than a consumer's report
    expect(Object.keys(m).sort()).toEqual([
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
      'useTeleportAnchor',
    ]);
  });

  it('reaches the layout classes through the FormLayout namespace', () => {
    // they are exported nowhere else, and the readme says so
    for (const name of [
      'Column',
      'Component',
      'ComponentBuilderBase',
      'FormBuilder',
      'FormBuilderBodyProp',
      'FormBuilderName',
      'Row',
      'VuetifyInputsComponentBuilder',
    ]) {
      expect(m.FormLayout, name).toHaveProperty(name);
    }
  });

  it('builds a layout, nests one inside it, and survives the JSON round trip', () => {
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
    // two columns per row, so the two inputs make one row and the nested form a second
    expect(json.rows).toHaveLength(2);
    expect(json.rows[0].columns[0].components[0].props.label).toBe('First name');
    expect(json.md).toBeDefined();

    // <form-render> takes the builder or the JSON, and has to render the same thing from either
    expect(m.FormBuilder.fromJSON(json).toJSON()).toEqual(json);

    // a breakpoint states rows of its own
    expect(layout.getOptionsForBreakpoint('md').rows).toHaveLength(1);
  });

  it('answers for the dialog stack with no view mounted', () => {
    expect(m.modal.isInstalled()).toBe(false);
    expect(m.DialogSize.fromString('lg')).toBe(m.DialogSize.LARGE);
    expect(m.DialogSize.isDefined('nonsense')).toBe(false);
  });
});
