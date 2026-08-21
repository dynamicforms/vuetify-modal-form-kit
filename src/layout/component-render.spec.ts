import { mount } from '@vue/test-utils';
import { markRaw } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder, FormBuilderBodyProp, FormBuilderName } from '../core/form-layout';

import ComponentRender from './component-render.vue';
import FormRender from './form-render.vue';
import { ComponentRenderProps } from './types';

const stubs = {
  VRow: { inheritAttrs: false, template: '<div class="row" v-bind="$attrs"><slot /></div>' },
  VCol: { inheritAttrs: false, template: '<div class="col" v-bind="$attrs"><slot /></div>' },
};

const myInput = markRaw({ props: ['label'], template: '<input :placeholder="label" />' });
const myButton = markRaw({ props: ['label'], template: '<button :title="label"><slot /></button>' });

// the globally registered counterparts of the above: <component-render> reaches these through the component name
// alone, without a `components` entry
const globalComponents = {
  'global-widget': { inheritAttrs: false, template: '<div class="global-widget"><slot /></div>' },
  SymbolComponent: { inheritAttrs: false, template: '<div class="symbol-component"><slot /></div>' },
  // what the FormBuilderName symbol resolves to by description while no renderer is in the map
  FormBuilder: { inheritAttrs: false, template: '<div class="renderer-missing" />' },
};

function render(props: ComponentRenderProps) {
  return mount(ComponentRender, {
    props,
    global: { stubs, components: globalComponents, plugins: [createVuetify()] },
  });
}

describe('ComponentRender', () => {
  describe('resolving the component name', () => {
    it('takes the component out of the map it is given', () => {
      const wrapper = render({ name: 'my-input', props: { label: 'City' }, components: { 'my-input': myInput } });

      expect(wrapper.find('input').attributes('placeholder')).toBe('City');

      wrapper.unmount();
    });

    it('resolves a name missing from the map against the globally registered components', () => {
      const wrapper = render({ name: 'global-widget', components: { 'my-input': myInput } });

      expect(wrapper.find('.global-widget').exists()).toBe(true);

      wrapper.unmount();
    });

    it('resolves a symbol name by its description', () => {
      const wrapper = render({ name: Symbol('global-widget') });

      expect(wrapper.find('.global-widget').exists()).toBe(true);

      wrapper.unmount();
    });

    it('resolves a symbol without a description as SymbolComponent', () => {
      const wrapper = render({ name: Symbol() });

      expect(wrapper.find('.symbol-component').exists()).toBe(true);

      wrapper.unmount();
    });
  });

  describe('the component body', () => {
    it('hands FormBuilderBodyProp to the default slot of a component from the map', () => {
      const wrapper = render({
        name: 'my-button',
        props: { label: 'Save it', [FormBuilderBodyProp]: 'Save' },
        components: { 'my-button': myButton },
      });

      expect(wrapper.find('button').attributes('title')).toBe('Save it');
      expect(wrapper.find('button').text()).toBe('Save');

      wrapper.unmount();
    });

    it('hands FormBuilderBodyProp to the default slot of a globally registered component', () => {
      const wrapper = render({ name: 'global-widget', props: { [FormBuilderBodyProp]: 'Save' } });

      expect(wrapper.find('.global-widget').text()).toBe('Save');

      wrapper.unmount();
    });
  });

  describe('a nested form', () => {
    function innerForm(label: string) {
      const inner = new FormBuilder();
      inner.row({}, (row) =>
        row.col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label }))),
      );
      return inner;
    }

    it('renders once the components map gains the renderer after setup', async () => {
      const wrapper = render({
        name: FormBuilderName,
        props: innerForm('Zip').toJSON(),
        components: { 'my-input': myInput },
      });

      expect(wrapper.find('.form-layout').exists()).toBe(false);
      expect(wrapper.find('.renderer-missing').exists()).toBe(true);

      await wrapper.setProps({ components: { 'my-input': myInput, [FormBuilderName]: markRaw(FormRender) } });

      expect(wrapper.find('.form-layout').exists()).toBe(true);
      expect(wrapper.find('.col').attributes('cols')).toBe('6');
      expect(wrapper.find('input').attributes('placeholder')).toBe('Zip');

      wrapper.unmount();
    });
  });
});
