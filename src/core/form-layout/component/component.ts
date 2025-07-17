// eslint-disable-next-line max-classes-per-file
import type { FormBuilder } from '../form-builder';
import { ComponentJSON, ComponentProps, FormBuilderName } from '../types';

export class Component<T extends Record<string, any> = Record<string, any>> {
  name: string | symbol;

  props?: ComponentProps<T>;

  constructor(name: string | symbol, props?: ComponentProps<T>) {
    this.name = name;
    this.props = props;
  }

  toJSON(): ComponentJSON {
    return {
      name: this.name,
      props: this.props ? { ...(this.props.toJSON?.() ?? this.props) } : null,
    };
  }
}

export interface ComponentBuilderInterface<T = any> {
  generic<P extends ComponentProps = ComponentProps>(name: string | symbol, props: P): T;
}

export class ComponentBuilderBase implements ComponentBuilderInterface<ComponentBuilderBase> {
  constructor(private addCallback: (component: Component) => void) {}

  generic<P extends ComponentProps = ComponentProps>(name: string | symbol, props: P): this {
    const component = new Component<P>(name, props);
    this.addCallback(component);
    return this;
  }

  nestedForm(form: FormBuilder): this {
    return this.generic(FormBuilderName, form);
  }
}
