import type { Action } from '@dynamicforms/vuetify-inputs';
import { Action as InputsAction } from '@dynamicforms/vuetify-inputs';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { h, nextTick } from 'vue';

import { DynamicFormsModalFormKit } from '../index';

import modal, { currentModal } from './api';
import { defaultDialogActions } from './dialog-actions';
import { setDfModalDefaults } from './modal-defaults';
import { translate, translateStrings } from './translations';

function drawn() {
  return currentModal.value!.props.drawn.actions as Record<string, Action>;
}

async function closeCurrent(promise: Promise<string> & { close: (value: string) => void }) {
  promise.close('close');
  await nextTick();
  await nextTick();
  await promise;
}

describe('the default dialog actions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setDfModalDefaults({ actions: undefined });
    translateStrings((key) => key);
  });

  it("give message() a close action that is the dialog's confirm and reject", async () => {
    const promise = modal.message('Done', 'saved');
    const { close } = drawn();

    expect(close.name).toBe('close');
    expect(close.label).toBe('Close');
    expect(close.icon).toBe('mdi-close');
    expect(close.defaultConfirm).toBe(true);
    expect(close.defaultReject).toBe(true);
    await closeCurrent(promise);
  });

  it('give yesNo() a green check and a red x', async () => {
    const promise = modal.yesNo('Delete', 'sure?');
    const { yes, no } = drawn();

    expect([yes.name, yes.label, yes.icon, yes.defaultConfirm, yes.passthroughAttrs]).toEqual([
      'yes',
      'Yes',
      'mdi-check',
      true,
      { color: 'success' },
    ]);
    expect([no.name, no.label, no.icon, no.defaultReject, no.passthroughAttrs]).toEqual([
      'no',
      'No',
      'mdi-close',
      true,
      { color: 'error' },
    ]);
    await closeCurrent(promise);
  });

  it('are replaced one by one by the factories setDfModalDefaults states', async () => {
    const ok = new InputsAction({ value: { name: 'yes', label: 'Sure' } });
    setDfModalDefaults({ actions: { yes: () => ok } });

    const promise = modal.yesNo('Delete', 'sure?');
    expect(drawn().yes).toBe(ok);
    expect(drawn().no.icon).toBe(defaultDialogActions.no().icon);
    await closeCurrent(promise);
  });

  it("are labelled with the library's translations, under df_modal by default", async () => {
    translateStrings((key) => ({ 'df_modal.Close': 'Zapri' })[key] ?? key);
    const promise = modal.message('Done', 'saved');

    expect(drawn().close.label).toBe('Zapri');
    await closeCurrent(promise);
  });
});

describe('the translate option', () => {
  it("translates the library's strings for the app it is installed in", () => {
    const t = vi.fn((key: string) => ({ 'df_modal.Yes': 'Ja', 'labels.No': 'Ne' })[key] ?? key);
    const read = () => h('span', `${translate('Yes')} ${translate('No')}`);

    const app = mount({ render: read }, { global: { plugins: [[DynamicFormsModalFormKit, { translate: t }]] } });
    expect(app.text()).toBe('Ja No');

    const named = mount(
      { render: read },
      { global: { plugins: [[DynamicFormsModalFormKit, { translate: t, translateNamespace: 'labels' }]] } },
    );
    // a key the function does not translate keeps its English default
    expect(named.text()).toBe('Yes Ne');
    app.unmount();
    named.unmount();
  });
});
