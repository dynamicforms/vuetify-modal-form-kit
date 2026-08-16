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

const defaultWidth = window.innerWidth;

// vuetify's display reads window.innerWidth when it is created, so the width has to be set before the mount
function setViewportWidth(width: number) {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
}

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

  describe('at a breakpoint', () => {
    afterEach(() => {
      setViewportWidth(defaultWidth);
    });

    function responsiveForm() {
      const form = new FormBuilder();
      form.row({}, (row) =>
        row.col({ cols: 8 }, (col) =>
          col
            .breakpoint('sm', (bpCol) => {
              bpCol.props.cols = 12;
              return bpCol;
            })
            .component((cmpt) => cmpt.generic('my-input', { label: 'Street' })),
        ),
      );
      return form;
    }

    it('renders the base layout below the breakpoint', () => {
      setViewportWidth(400);

      const wrapper = render(responsiveForm());

      expect(wrapper.find('.col').attributes('cols')).toBe('8');
      expect(wrapper.find('input').attributes('placeholder')).toBe('Street');

      wrapper.unmount();
    });

    it('renders the column breakpoint above it, components and all', () => {
      setViewportWidth(1400);

      const wrapper = render(responsiveForm());

      expect(wrapper.find('.col').attributes('cols')).toBe('12');
      expect(wrapper.find('input').attributes('placeholder')).toBe('Street');

      wrapper.unmount();
    });
  });
});
