import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { defineComponent, markRaw, nextTick, ref, Ref } from 'vue';
import { createVuetify } from 'vuetify';

import { FormBuilder, FormJSONResponsive, useTeleportAnchor } from '../core/form-layout';

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

    it('emits the resolved breakpoint once on mount and again on every change', async () => {
      setViewportWidth(1400);

      const wrapper = render(responsiveForm());
      expect(wrapper.emitted('breakpoint')?.[0]).toEqual(['lg']);

      setViewportWidth(400);
      await nextTick();
      expect(wrapper.emitted('breakpoint')?.[1]).toEqual(['xs']);

      wrapper.unmount();
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

  describe('duplicate component ids', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    it('warns when two components in the same rendered layout share an id', () => {
      const form = new FormBuilder();
      form.row({}, (row) =>
        row
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'A', id: 'dup' })))
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'B', id: 'dup' }))),
      );

      const wrapper = render(form);

      expect(warn).toHaveBeenCalled();
      expect(warn.mock.calls[0][0]).toContain('dup');

      wrapper.unmount();
    });

    it('does not warn when ids are unique', () => {
      const form = new FormBuilder();
      form.row({}, (row) =>
        row
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'A', id: 'one' })))
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'B', id: 'two' }))),
      );

      const wrapper = render(form);

      expect(warn).not.toHaveBeenCalled();

      wrapper.unmount();
    });

    it('does not warn for the same id reused across mutually exclusive breakpoints', () => {
      const form = new FormBuilder();
      form.row({}, (row) =>
        row.col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'A', id: 'shared' }))),
      );
      form.breakpoint('sm', (bpForm) =>
        bpForm.row({}, (row) =>
          row.col({ cols: 12 }, (col) =>
            col.component((cmpt) => cmpt.generic('my-input', { label: 'A', id: 'shared' })),
          ),
        ),
      );

      setViewportWidth(1400);
      const wrapper = render(form);

      expect(warn).not.toHaveBeenCalled();

      wrapper.unmount();
      setViewportWidth(defaultWidth);
    });
  });

  describe('teleport-anchored content', () => {
    // Teleport resolves its target through the real document, so the host has to be attached to it - a detached
    // mount (the default) leaves querySelector unable to find an anchor <form-render> renders perfectly well.
    // `keyed` binds the Teleport's own :key to the breakpoint <form-render> emits, forcing it to remount and
    // re-resolve its target when a breakpoint switch moves the anchor to a fresh DOM element.
    function renderWithTeleport(toBinding: string, buildForm?: (anchorId: Ref<string>) => FormBuilder, keyed = false) {
      // teleportAnchor() calls Vue's useId(), which needs an active component instance - building the form has
      // to happen inside Host's own setup(), the same way a consumer builds it inside their own <script setup>
      const anchor = useTeleportAnchor();

      const Host = defineComponent({
        components: { FormRender },
        setup() {
          const form = buildForm
            ? buildForm(anchor.id)
            : new FormBuilder().row({}, (row) =>
                row.col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(anchor.id))),
              );
          const breakpoint = ref();
          return { form, anchor, target: anchor.target, breakpoint };
        },
        template: keyed
          ? `
            <div>
              <form-render :layout="form" @breakpoint="breakpoint = $event" />
              <Teleport :key="breakpoint" :to="${toBinding}" defer><input data-test="teleported" /></Teleport>
            </div>
          `
          : `
            <div>
              <form-render :layout="form" />
              <Teleport :to="${toBinding}" defer><input data-test="teleported" /></Teleport>
            </div>
          `,
      });

      const wrapper = mount(Host, { attachTo: document.body, global: { stubs, plugins: [createVuetify()] } });
      return { wrapper, anchor };
    }

    it('delivers the template content into a target exposed as a bare setup binding', () => {
      // `target` is itself the top-level setup binding here, so Vue unwraps it in the template on its own
      const { wrapper, anchor } = renderWithTeleport('target');

      const input = wrapper.find('[data-test="teleported"]');
      expect(input.exists()).toBe(true);
      expect(input.element.parentElement).toBe(wrapper.find(`#${anchor.id.value}`).element);

      wrapper.unmount();
    });

    it('needs .value when the target is read off the anchor object rather than exposed directly', () => {
      // this is the shape the docs recommend - useTeleportAnchor()'s return value kept as one named object -
      // where `anchor` itself, not `anchor.target`, is the top-level binding Vue can unwrap
      const { wrapper, anchor } = renderWithTeleport('anchor.target.value');

      const input = wrapper.find('[data-test="teleported"]');
      expect(input.exists()).toBe(true);
      expect(input.element.parentElement).toBe(wrapper.find(`#${anchor.id.value}`).element);

      wrapper.unmount();
    });

    describe('across a breakpoint that moves the anchor to a different position', () => {
      // swapping which column holds the anchor forces Vue to unmount the old <div :id> (now a 'my-input' sits at
      // its old array index) and mount a fresh one elsewhere, rather than patch the existing element in place
      function movingAnchorForm(anchorId: Ref<string>) {
        const form = new FormBuilder();
        form.row({}, (row) =>
          row
            .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(anchorId)))
            .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'Other' }))),
        );
        form.breakpoint('sm', (bpForm) =>
          bpForm.row({}, (row) =>
            row
              .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('my-input', { label: 'Other' })))
              .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.teleportAnchor(anchorId))),
          ),
        );
        return form;
      }

      afterEach(() => {
        setViewportWidth(defaultWidth);
      });

      it('orphans the teleported content once the anchor moves, when the Teleport is not keyed', async () => {
        setViewportWidth(400);
        const { wrapper } = renderWithTeleport('anchor.target.value', movingAnchorForm);
        expect(wrapper.find('[data-test="teleported"]').exists()).toBe(true);

        setViewportWidth(1400);
        await nextTick();

        expect(document.querySelector('[data-test="teleported"]')).toBeFalsy();

        wrapper.unmount();
      });

      it('stays attached to the current anchor across the switch when keyed on the breakpoint', async () => {
        setViewportWidth(400);
        const { wrapper, anchor } = renderWithTeleport('anchor.target.value', movingAnchorForm, true);
        expect(wrapper.find('[data-test="teleported"]').exists()).toBe(true);

        setViewportWidth(1400);
        await nextTick();

        const input = wrapper.find('[data-test="teleported"]');
        expect(input.exists()).toBe(true);
        expect(input.element.parentElement).toBe(wrapper.find(`#${anchor.id.value}`).element);

        wrapper.unmount();
      });
    });
  });
});
