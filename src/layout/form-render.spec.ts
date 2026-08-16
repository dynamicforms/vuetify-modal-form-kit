import { mount } from '@vue/test-utils';
import { markRaw } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder, FormJSONResponsive } from '../core/form-layout';

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

function render(layout: FormBuilder | FormJSONResponsive) {
  return mount(FormRender, {
    props: { layout, components: { 'my-input': myInput } },
    global: { stubs, plugins: [createVuetify()] },
  });
}

// the acceptance test for JSON layouts: a form and its own serialization have to produce the same DOM
function expectSameHtml(form: FormBuilder) {
  const fromBuilder = render(form);
  const fromJSON = render(form.toJSON());

  expect(fromJSON.html()).toBe(fromBuilder.html());

  fromJSON.unmount();
  fromBuilder.unmount();
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

    function formWithARowBreakpoint() {
      const form = new FormBuilder();
      form.row({ justify: 'start' }, (row) =>
        row
          .breakpoint('sm', (bpRow) => {
            bpRow.props.dense = true;
            return bpRow;
          })
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'Zip' }))),
      );
      return form;
    }

    it('renders a column breakpoint from JSON the way it renders it from the builder', () => {
      setViewportWidth(1400);
      expectSameHtml(responsiveForm());
    });

    it('renders a row breakpoint from JSON the way it renders it from the builder', () => {
      setViewportWidth(1400);
      expectSameHtml(formWithARowBreakpoint());
    });

    it('renders a form breakpoint from JSON the way it renders it from the builder', () => {
      setViewportWidth(1400);

      const form = new FormBuilder();
      form.row({}, (row) =>
        row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'Base' }))),
      );
      form.breakpoint('sm', (bpForm) =>
        bpForm.row({}, (row) =>
          row.col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'Small' }))),
        ),
      );

      expectSameHtml(form);
    });
  });

  describe('given a plain JSON layout', () => {
    it('renders it the way it renders the builder it came from', () => {
      const form = new FormBuilder();
      form.row({ dense: true, justify: 'space-between' }, (row) =>
        row.col({ cols: 6, offset: 2 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'City' }))),
      );

      expectSameHtml(form);
    });

    it('renders a layout written by hand', () => {
      const wrapper = render({
        rows: [{ props: { dense: true }, columns: [{ props: { cols: 4 }, components: [] }] }],
      });

      expect(wrapper.find('.row').attributes('dense')).toBe('true');
      expect(wrapper.find('.col').attributes('cols')).toBe('4');

      wrapper.unmount();
    });

    it('renders an empty form', () => {
      const wrapper = render(new FormBuilder().toJSON());

      expect(wrapper.find('.row').exists()).toBe(false);

      wrapper.unmount();
    });
  });

  describe('nested forms', () => {
    function nestedIn(inner: FormBuilder) {
      const outer = new FormBuilder();
      outer.row({}, (row) => row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.nestedForm(inner))));
      return outer;
    }

    function innerForm(label: string) {
      const inner = new FormBuilder();
      inner.row({}, (row) =>
        row.col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label }))),
      );
      return inner;
    }

    it('renders the inner form as a form of its own', () => {
      const wrapper = render(nestedIn(innerForm('Zip')));

      expect(wrapper.findAll('.form-layout').length).toBe(2);
      expect(wrapper.findAll('.col').map((col) => col.attributes('cols'))).toEqual(['12', '6']);
      expect(wrapper.find('input').attributes('placeholder')).toBe('Zip');

      wrapper.unmount();
    });

    it('renders the inner form from JSON the way it renders it from the builder', () => {
      expectSameHtml(nestedIn(innerForm('Zip')));
    });

    it('renders a form nested two levels deep', () => {
      const outer = nestedIn(nestedIn(innerForm('Zip')));

      const wrapper = render(outer);

      expect(wrapper.findAll('.form-layout').length).toBe(3);
      expect(wrapper.find('input').attributes('placeholder')).toBe('Zip');

      wrapper.unmount();
    });

    it('renders a form nested two levels deep from JSON', () => {
      expectSameHtml(nestedIn(nestedIn(innerForm('Zip'))));
    });

    describe('at a breakpoint', () => {
      afterEach(() => {
        setViewportWidth(defaultWidth);
      });

      function nestedResponsiveForm() {
        const inner = new FormBuilder();
        inner.row({}, (row) =>
          row.col({ cols: 8 }, (col) =>
            col
              .breakpoint('sm', (bpCol) => {
                bpCol.props.cols = 12;
                return bpCol;
              })
              .component((cmpt) => cmpt.generic('my-input', { label: 'Street' })),
          ),
        );
        return nestedIn(inner);
      }

      it('resolves the inner form breakpoints below it', () => {
        setViewportWidth(400);

        const wrapper = render(nestedResponsiveForm());

        expect(wrapper.findAll('.col')[1].attributes('cols')).toBe('8');

        wrapper.unmount();
      });

      it('resolves the inner form breakpoints above it', () => {
        setViewportWidth(1400);

        const wrapper = render(nestedResponsiveForm());

        expect(wrapper.findAll('.col')[1].attributes('cols')).toBe('12');

        wrapper.unmount();
      });

      it('resolves them the same way from JSON', () => {
        setViewportWidth(1400);
        expectSameHtml(nestedResponsiveForm());
      });
    });
  });
});
