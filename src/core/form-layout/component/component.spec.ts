import { vi } from 'vitest';

import { Column } from '../column';

import { Component, ComponentBuilderBase } from './component';

describe('Component', () => {
  it('should create a component with string name', () => {
    const component = new Component('VTextField', { label: 'Test' });

    expect(component.toJSON()).toEqual({
      name: 'VTextField',
      props: { label: 'Test' },
    });
  });

  it('should create a component with symbol name', () => {
    const symbolName = Symbol('TestComponent');
    const component = new Component(symbolName, { label: 'Test' });

    expect(component.toJSON()).toEqual({
      name: symbolName,
      props: { label: 'Test' },
    });
  });

  it('should handle empty props', () => {
    const component = new Component('VDivider', {});

    expect(component.toJSON()).toEqual({
      name: 'VDivider',
      props: {},
    });
  });

  it('should handle complex props', () => {
    const props = {
      label: 'Test',
      color: 'primary',
      rules: ['required'],
      on: {
        change: () => {},
        blur: () => {},
      },
      class: ['my-class', { 'conditional-class': true }],
    };

    const component = new Component('VTextField', props);

    expect(component.toJSON()).toEqual({
      name: 'VTextField',
      props,
    });
  });

  it('should not modify props during serialization', () => {
    const props = { label: 'Test', value: 'Initial' };
    const component = new Component('VTextField', props);

    const json = component.toJSON();
    component.props!.value = 'Changed';

    // The JSON should have the original props, not the modified ones
    expect(json.props).toEqual({ label: 'Test', value: 'Initial' });
    // But the component instance should reference the same object
    expect(component.props!.value).toBe('Changed');
  });

  it('should handle object with toJSON method as props', () => {
    const propsWithToJSON = {
      value: 'test',
      toJSON() {
        return { serialized: this.value };
      },
    };

    const component = new Component('Custom', propsWithToJSON);

    expect(component.toJSON()).toEqual({
      name: 'Custom',
      props: { serialized: 'test' },
    });
  });
});

// Test for custom component builder implementation
describe('Custom ComponentBuilder', () => {
  // Create a custom builder class
  class CustomComponentBuilder extends ComponentBuilderBase {
    // Add a method for button components
    button(label: string, color: string = 'primary'): this {
      return this.generic('VBtn', { label, color });
    }

    // Add a method for labeled text fields with optional validation
    labeledField(label: string, required: boolean = false): this {
      return this.generic('VTextField', {
        label,
        required,
        rules: required ? ['required'] : [],
      });
    }
  }

  it('should use custom component builder', () => {
    const column = new Column({ cols: 12 });

    // Use our custom builder class
    column.component(CustomComponentBuilder, (builder) => builder.button('Save').button('Cancel', 'error'));

    // Check results
    const json = column.toJSON();
    expect(json.components.length).toBe(2);

    // Verify first button
    expect(json.components[0].name).toBe('VBtn');
    expect(json.components[0].props).toEqual({
      label: 'Save',
      color: 'primary',
    });

    // Verify second button
    expect(json.components[1].name).toBe('VBtn');
    expect(json.components[1].props).toEqual({
      label: 'Cancel',
      color: 'error',
    });
  });

  it('should properly pass components in callback', () => {
    const mockAddCallback = vi.fn();
    const builder = new CustomComponentBuilder(mockAddCallback);

    builder.button('Button 1').labeledField('Name', true);

    expect(mockAddCallback).toHaveBeenCalledTimes(2);

    // Check first call
    const firstCall = mockAddCallback.mock.calls[0][0];
    expect(firstCall).toBeInstanceOf(Component);
    expect(firstCall.name).toBe('VBtn');
    expect(firstCall.props).toEqual({ label: 'Button 1', color: 'primary' });

    // Check second call
    const secondCall = mockAddCallback.mock.calls[1][0];
    expect(secondCall).toBeInstanceOf(Component);
    expect(secondCall.name).toBe('VTextField');
    expect(secondCall.props).toEqual({
      label: 'Name',
      required: true,
      rules: ['required'],
    });
  });

  it('should work with existing ComponentBuilderBase API', () => {
    const column = new Column({ cols: 12 });

    column.component(CustomComponentBuilder, (builder) =>
      builder.generic('VCheckbox', { label: 'Active' }).labeledField('Address').button('Submit'),
    );

    const json = column.toJSON();
    expect(json.components.length).toBe(3);

    // Check first component (generic)
    expect(json.components[0].name).toBe('VCheckbox');
    expect(json.components[0].props).toEqual({ label: 'Active' });

    // Check second component (our custom one)
    expect(json.components[1].name).toBe('VTextField');
    expect(json.components[1].props).toEqual({
      label: 'Address',
      required: false,
      rules: [],
    });

    // Check third component (our custom one)
    expect(json.components[2].name).toBe('VBtn');
    expect(json.components[2].props).toEqual({
      label: 'Submit',
      color: 'primary',
    });
  });
});
