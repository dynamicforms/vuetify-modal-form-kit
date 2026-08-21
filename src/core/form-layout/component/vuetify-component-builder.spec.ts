import { dfInputComponentsByTag, Label } from '@dynamicforms/vuetify-inputs';
import { vi } from 'vitest';

import { Column } from '../column';
import { FormBuilder } from '../form-builder';
import { FormBuilderName } from '../types';

import { Component } from './component';
import { VuetifyInputsComponentBuilder } from './vuetify-component-builder';

interface ShorthandCase {
  method: string;
  componentName: string;
  props: Record<string, any>;
  invoke: (builder: VuetifyInputsComponentBuilder, props: any) => VuetifyInputsComponentBuilder;
}

const shorthands: ShorthandCase[] = [
  {
    method: 'dfActions',
    componentName: 'df-actions',
    props: { actions: [], buttonSize: 'large' },
    invoke: (builder, props) => builder.dfActions(props),
  },
  {
    method: 'dfCheckbox',
    componentName: 'df-checkbox',
    props: { label: 'Active', allowNull: true },
    invoke: (builder, props) => builder.dfCheckbox(props),
  },
  {
    method: 'dfColor',
    componentName: 'df-color',
    props: { label: 'Background', clearable: true },
    invoke: (builder, props) => builder.dfColor(props),
  },
  {
    method: 'dfDateTime',
    componentName: 'df-date-time',
    props: { label: 'Valid from', inputType: 'date' },
    invoke: (builder, props) => builder.dfDateTime(props),
  },
  {
    method: 'dfFile',
    componentName: 'df-file',
    props: { label: 'Attachment' },
    invoke: (builder, props) => builder.dfFile(props),
  },
  {
    method: 'dfInput',
    componentName: 'df-input',
    props: { label: 'Name', inputType: 'text' },
    invoke: (builder, props) => builder.dfInput(props),
  },
  {
    method: 'dfInputHint',
    componentName: 'df-input-hint',
    props: { message: 'Two letters or more', messageClasses: 'text-caption' },
    invoke: (builder, props) => builder.dfInputHint(props),
  },
  {
    method: 'dfLabel',
    componentName: 'df-label',
    props: { label: new Label('Name'), allowWrap: true },
    invoke: (builder, props) => builder.dfLabel(props),
  },
  {
    method: 'dfRtfEditor',
    componentName: 'df-rtf-editor',
    props: { label: 'Body' },
    invoke: (builder, props) => builder.dfRtfEditor(props),
  },
  {
    method: 'dfSelect',
    componentName: 'df-select',
    props: { label: 'Country', choices: [{ id: 1, text: 'Slovenia' }] },
    invoke: (builder, props) => builder.dfSelect(props),
  },
  {
    method: 'dfTextArea',
    componentName: 'df-text-area',
    props: { label: 'Notes', rows: 5 },
    invoke: (builder, props) => builder.dfTextArea(props),
  },
];

describe('VuetifyInputsComponentBuilder', () => {
  it.each(shorthands)('$method builds a $componentName component', ({ componentName, props, invoke }) => {
    const addCallback = vi.fn();
    const builder = new VuetifyInputsComponentBuilder(addCallback);

    invoke(builder, props);

    expect(addCallback).toHaveBeenCalledTimes(1);
    const component = addCallback.mock.calls[0][0];
    expect(component).toBeInstanceOf(Component);
    expect(component.name).toBe(componentName);
    expect(component.props).toBe(props);
    expect(component.toJSON()).toEqual({ name: componentName, props });
  });

  it.each(shorthands)('$method returns the builder so calls chain', ({ props, invoke }) => {
    const builder = new VuetifyInputsComponentBuilder(vi.fn());

    expect(invoke(builder, props)).toBe(builder);
  });

  it('should pass every component of a chain to the callback in order', () => {
    const addCallback = vi.fn();
    const builder = new VuetifyInputsComponentBuilder(addCallback);

    const result = shorthands.reduce((current, { props, invoke }) => invoke(current, props), builder);

    expect(result).toBe(builder);
    expect(addCallback).toHaveBeenCalledTimes(shorthands.length);
    expect(addCallback.mock.calls.map(([component]) => component.name)).toEqual(
      shorthands.map(({ componentName }) => componentName),
    );
    expect(addCallback.mock.calls.map(([component]) => component.props)).toEqual(shorthands.map(({ props }) => props));
  });

  it.each(Object.keys(dfInputComponentsByTag))('byTag builds a %s', (tag) => {
    const addCallback = vi.fn();
    const builder = new VuetifyInputsComponentBuilder(addCallback);
    const props = { label: 'Name' };

    expect(builder.byTag(tag, props)).toBe(builder);

    const component = addCallback.mock.calls[0][0];
    expect(component.name).toBe(tag);
    expect(component.props).toBe(props);
  });

  it('byTag builds what the method of the same tag builds', () => {
    const props = { label: 'Active' };
    const viaTag = vi.fn();
    const viaMethod = vi.fn();

    new VuetifyInputsComponentBuilder(viaTag).byTag('df-checkbox', props);
    new VuetifyInputsComponentBuilder(viaMethod).dfCheckbox(props);

    expect(viaTag.mock.calls[0][0].toJSON()).toEqual(viaMethod.mock.calls[0][0].toJSON());
  });

  it.each(['generic', 'constructor', 'to-string', 'nested-form'])(
    'byTag builds the component named %s rather than reaching a member of its own',
    (tag) => {
      const addCallback = vi.fn();
      const builder = new VuetifyInputsComponentBuilder(addCallback);
      const props = { label: 'Active' };

      // the tag is data - a field states it, or a payload does - so a name the builder happens to carry is a
      // component name like any other and must not be called as a method
      expect(builder.byTag(tag, props)).toBe(builder);
      expect(addCallback).toHaveBeenCalledOnce();
      expect(addCallback.mock.calls[0][0].toJSON()).toEqual({ name: tag, props });
    },
  );

  it('byTag builds a tag no method owns, so a component the peer gains still reaches the layout', () => {
    const addCallback = vi.fn();
    const builder = new VuetifyInputsComponentBuilder(addCallback);
    const props = { label: 'Lines' };

    expect(builder.byTag('df-list', props)).toBe(builder);

    expect(addCallback.mock.calls[0][0].toJSON()).toEqual({ name: 'df-list', props });
  });

  it('should build nested form components with the FormBuilder symbol name', () => {
    const addCallback = vi.fn();
    const builder = new VuetifyInputsComponentBuilder(addCallback);
    const form = new FormBuilder();

    expect(builder.nestedForm(form)).toBe(builder);

    const component = addCallback.mock.calls[0][0];
    expect(component.name).toBe(FormBuilderName);
    expect(component.props).toBe(form);
  });

  it('should be the builder a column uses when none is given', () => {
    const column = new Column({ cols: 12 });

    column.component((builder) => builder.dfInput({ label: 'Name' }).dfTextArea({ label: 'Notes' }));

    expect(column.toJSON()).toEqual({
      props: { cols: 12 },
      components: [
        { name: 'df-input', props: { label: 'Name' } },
        { name: 'df-text-area', props: { label: 'Notes' } },
      ],
    });
  });
});
