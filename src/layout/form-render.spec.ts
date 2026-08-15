import { mount } from '@vue/test-utils';
import { markRaw } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder } from '../core/form-layout';

import FormRender from './form-render.vue';

const stubs = {
  VRow: { inheritAttrs: false, template: '<div class="row" v-bind="$attrs"><slot /></div>' },
  VCol: { inheritAttrs: false, template: '<div class="col" v-bind="$attrs"><slot /></div>' },
};

const myInput = markRaw({ props: ['label'], template: '<input :placeholder="label" />' });

function render(layout: FormBuilder) {
  return mount(FormRender, {
    props: { layout, components: { 'my-input': myInput } },
    global: { stubs, plugins: [createVuetify()] },
  });
}

describe('FormRender', () => {
  it('passes row and column props on to the grid', () => {
    const form = new FormBuilder();
    form.row({ dense: true, justify: 'space-between' }, (row) =>
      row.col({ cols: 6, offset: 2 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'City' }))),
    );

    const wrapper = render(form);

    expect(wrapper.find('.row').attributes('dense')).toBe('true');
    expect(wrapper.find('.row').attributes('justify')).toBe('space-between');
    expect(wrapper.find('.col').attributes('cols')).toBe('6');
    expect(wrapper.find('.col').attributes('offset')).toBe('2');
    expect(wrapper.find('input').attributes('placeholder')).toBe('City');

    wrapper.unmount();
  });
});
