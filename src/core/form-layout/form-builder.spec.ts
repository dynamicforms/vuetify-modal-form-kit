import { responsiveBreakpoints } from '@dynamicforms/vuetify-inputs';

import { FormBuilder } from './form-builder';
import { FormBuilderName, FormJSON, FormJSONResponsive } from './types';

describe('FormBuilder', () => {
  it('should create an empty form', () => {
    const fb = new FormBuilder();
    expect(fb.toJSON()).toEqual({ rows: [] });
  });

  it('should add a row', () => {
    const fb = new FormBuilder();
    fb.row({}, (row) => row);

    expect(fb.toJSON()).toEqual({ rows: [{ props: {}, columns: [] }] });
  });

  it('should add a row with columns', () => {
    const fb = new FormBuilder();
    fb.row({}, (row) => row.col({ cols: 6, offset: 0 }).col({ cols: 6, offset: 0 }));

    expect(fb.toJSON()).toEqual({
      rows: [
        {
          props: {},
          columns: [
            { props: { cols: 6, offset: 0 }, components: [] },
            { props: { cols: 6, offset: 0 }, components: [] },
          ],
        },
      ],
    });
  });

  it('should add components to columns', () => {
    const fb = new FormBuilder();
    fb.row({}, (row) =>
      row.col({ cols: 6, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Test' }))),
    );

    expect(fb.toJSON()).toEqual({
      rows: [
        {
          props: {},
          columns: [
            {
              props: { cols: 6, offset: 0 },
              components: [{ name: 'VTextField', props: { label: 'Test' } }],
            },
          ],
        },
      ],
    });
  });

  it('should handle breakpoints', () => {
    const fb = new FormBuilder();

    // Default layout
    fb.row({}, (row) => row.col({ cols: 6, offset: 0 }).col({ cols: 6, offset: 0 }));

    // Small screen layout
    fb.breakpoint('sm', (form) => form.row({}, (row) => row.col({ cols: 12, offset: 0 })));

    expect(fb.toJSON()).toEqual({
      rows: [
        {
          props: {},
          columns: [
            { props: { cols: 6, offset: 0 }, components: [] },
            { props: { cols: 6, offset: 0 }, components: [] },
          ],
        },
      ],
      sm: {
        rows: [
          {
            props: {},
            columns: [{ props: { cols: 12, offset: 0 }, components: [] }],
          },
        ],
      },
    });
    expect(fb.toJSON('xs')).toEqual({
      rows: [
        {
          props: {},
          columns: [
            { props: { cols: 6, offset: 0 }, components: [] },
            { props: { cols: 6, offset: 0 }, components: [] },
          ],
        },
      ],
    });
    expect(fb.toJSON('xl')).toEqual({
      rows: [
        {
          props: {},
          columns: [{ props: { cols: 12, offset: 0 }, components: [] }],
        },
      ],
    });
  });

  it('should allow nesting forms', () => {
    const nestedForm = new FormBuilder();
    nestedForm.row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextField', { label: 'Nested' })),
      ),
    );

    const mainForm = new FormBuilder();
    mainForm.row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) => col.component((cmpt) => cmpt.nestedForm(nestedForm))),
    );

    expect(mainForm.toJSON()).toEqual({
      rows: [
        {
          props: {},
          columns: [
            {
              props: { cols: 12, offset: 0 },
              components: [{ name: FormBuilderName, props: nestedForm.toJSON() }],
            },
          ],
        },
      ],
    });
  });

  it('should handle complex layouts', () => {
    const fb = new FormBuilder();

    // Row 1: two equal columns
    fb.row({}, (row) =>
      row
        .col({ cols: 6, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('VTextField', { label: 'First name' })),
        )
        .col({ cols: 6, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('VTextField', { label: 'Last name' })),
        ),
    );

    // Row 2: single column
    fb.row({}, (row) =>
      row.col({ cols: 12, offset: 0 }, (col) =>
        col.component((cmpt) => cmpt.generic('VTextarea', { label: 'Comments' })),
      ),
    );

    // Row 3: three equal columns
    fb.row({}, (row) =>
      row
        .col({ cols: 4, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VSelect', { label: 'Country' })))
        .col({ cols: 4, offset: 0 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
        .col({ cols: 4, offset: 0 }, (col) =>
          col.component((cmpt) => cmpt.generic('VTextField', { label: 'Postal code' })),
        ),
    );

    const json = fb.toJSON();
    expect(json.rows.length).toBe(3);
    expect(json.rows[0].columns.length).toBe(2);
    expect(json.rows[1].columns.length).toBe(1);
    expect(json.rows[2].columns.length).toBe(3);
  });

  it('should add components using simple() API', () => {
    const fb = new FormBuilder();

    fb.simple().generic('VTextField', { label: 'First Name' }).generic('VTextField', { label: 'Last Name' });

    const json = fb.toJSON();

    // Should have 2 rows
    expect(json.rows.length).toBe(2);

    // First row
    expect(json.rows[0].columns.length).toBe(1);
    expect(json.rows[0].columns[0].props).toEqual({ cols: 12 });
    expect(json.rows[0].columns[0].components.length).toBe(1);
    expect(json.rows[0].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[0].props.label).toBe('First Name');

    // Second row
    expect(json.rows[1].columns.length).toBe(1);
    expect(json.rows[1].columns[0].props).toEqual({ cols: 12 });
    expect(json.rows[1].columns[0].components.length).toBe(1);
    expect(json.rows[1].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[1].columns[0].components[0].props.label).toBe('Last Name');
  });

  it('should add components using simple(cols = 2) API', () => {
    const fb = new FormBuilder();

    fb.simple(2)
      .generic('VTextField', { label: 'First Name' })
      .generic('VTextField', { label: 'Last Name' })
      .simple(1)
      .generic('VTextField', { label: 'Comments' });

    const json = fb.toJSON();

    // Should have 2 rows
    expect(json.rows.length).toBe(2);

    // First row, first column
    expect(json.rows[0].columns.length).toBe(2);
    expect(json.rows[0].columns[0].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[0].components.length).toBe(1);
    expect(json.rows[0].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[0].components[0].props.label).toBe('First Name');

    // Second column
    expect(json.rows[0].columns[1].props).toEqual({ cols: 6 });
    expect(json.rows[0].columns[1].components.length).toBe(1);
    expect(json.rows[0].columns[1].components[0].name).toBe('VTextField');
    expect(json.rows[0].columns[1].components[0].props.label).toBe('Last Name');

    // Second row, the only column
    expect(json.rows[1].columns.length).toBe(1);
    expect(json.rows[1].columns[0].props).toEqual({ cols: 12 });
    expect(json.rows[1].columns[0].components.length).toBe(1);
    expect(json.rows[1].columns[0].components[0].name).toBe('VTextField');
    expect(json.rows[1].columns[0].components[0].props.label).toBe('Comments');
  });

  describe('fromJSON', () => {
    // every breakpoint a hydrated layout resolves to has to match the one the builder resolves to
    function expectSameLayout(fb: FormBuilder) {
      const json = fb.toJSON();
      const hydrated = FormBuilder.fromJSON(json);

      expect(hydrated.toJSON()).toEqual(json);
      responsiveBreakpoints.forEach((bp) => {
        expect(hydrated.getOptionsForBreakpoint(bp).toJSON(bp)).toEqual(fb.getOptionsForBreakpoint(bp).toJSON(bp));
      });
    }

    it('round-trips a base layout', () => {
      const fb = new FormBuilder();
      fb.row({ dense: true }, (row) =>
        row
          .col({ cols: 6, offset: 2 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Zip' }))),
      );

      expectSameLayout(fb);
    });

    it('round-trips an empty layout', () => {
      expectSameLayout(new FormBuilder());
      expect(FormBuilder.fromJSON(undefined).toJSON()).toEqual({ rows: [] });
    });

    it('round-trips a form breakpoint', () => {
      const fb = new FormBuilder();
      fb.row({}, (row) => row.col({ cols: 6 }).col({ cols: 6 }));
      fb.breakpoint('md', (form) => form.row({}, (row) => row.col({ cols: 12 })));

      expectSameLayout(fb);
    });

    it('round-trips a row breakpoint', () => {
      const fb = new FormBuilder();
      fb.row({ justify: 'start' }, (row) =>
        row
          .breakpoint('md', (bpRow) => {
            bpRow.props.dense = true;
            return bpRow;
          })
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' }))),
      );

      expectSameLayout(fb);
    });

    it('round-trips a column breakpoint', () => {
      const fb = new FormBuilder();
      fb.row({}, (row) =>
        row.col({ cols: 8 }, (col) =>
          col
            .breakpoint('md', (bpCol) => {
              bpCol.props.cols = 12;
              return bpCol;
            })
            .component((cmpt) => cmpt.generic('VTextField', { label: 'Street' })),
        ),
      );

      expectSameLayout(fb);
    });

    it('round-trips a breakpoint that states an empty list', () => {
      const fb = new FormBuilder();
      fb.row({}, (row) =>
        row
          .col({ cols: 6 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'City' })))
          .breakpoint('md', (bpRow) => {
            bpRow.columns = [];
            return bpRow;
          }),
      );

      expectSameLayout(fb);
      expect(FormBuilder.fromJSON(fb.toJSON()).getOptionsForBreakpoint('md').toJSON('md').rows[0].columns).toEqual([]);
    });

    it('round-trips a nested form', () => {
      const nested = new FormBuilder();
      nested.row({}, (row) =>
        row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Nested' }))),
      );

      const fb = new FormBuilder();
      fb.row({}, (row) => row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.nestedForm(nested))));

      expectSameLayout(fb);

      const component = FormBuilder.fromJSON(fb.toJSON()).toJSON().rows[0].columns[0].components[0];
      expect(component.name).toBe(FormBuilderName);
      expect(component.props).toEqual(nested.toJSON());
    });

    it('round-trips a doubly nested form', () => {
      const inner = new FormBuilder();
      inner.row({}, (row) =>
        row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.generic('VTextField', { label: 'Inner' }))),
      );

      const middle = new FormBuilder();
      middle.row({}, (row) => row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.nestedForm(inner))));

      const outer = new FormBuilder();
      outer.row({}, (row) => row.col({ cols: 12 }, (col) => col.component((cmpt) => cmpt.nestedForm(middle))));

      expectSameLayout(outer);

      const middleJSON = FormBuilder.fromJSON(outer.toJSON()).toJSON().rows[0].columns[0].components[0]
        .props as FormJSONResponsive;
      expect(middleJSON.rows[0].columns[0].components[0].props).toEqual(inner.toJSON());
    });

    it('inherits the rows a breakpoint says nothing about', () => {
      const fb = FormBuilder.fromJSON({
        rows: [{ props: {}, columns: [{ props: { cols: 6 }, components: [] }] }],
        md: <FormJSON>{},
      });

      expect(fb.getOptionsForBreakpoint('md').toJSON('md').rows.length).toBe(1);
    });

    it('lets a breakpoint state that the form has no rows', () => {
      const fb = FormBuilder.fromJSON({
        rows: [{ props: {}, columns: [{ props: { cols: 6 }, components: [] }] }],
        md: { rows: [] },
      });

      expect(fb.getOptionsForBreakpoint('sm').toJSON('sm').rows.length).toBe(1);
      expect(fb.getOptionsForBreakpoint('md').toJSON('md').rows).toEqual([]);
    });

    it('hands back a FormBuilder it is given', () => {
      const fb = new FormBuilder();
      expect(FormBuilder.fromJSON(fb)).toBe(fb);
    });

    it('hydrates once, not on every breakpoint resolution', () => {
      const fb = FormBuilder.fromJSON({ rows: [{ props: {}, columns: [{ props: { cols: 6 }, components: [] }] }] });

      expect(fb.getOptionsForBreakpoint('md').rows![0]).toBe(fb.getOptionsForBreakpoint('md').rows![0]);
    });
  });
});
