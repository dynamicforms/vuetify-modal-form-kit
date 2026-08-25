import { Ref, useId } from 'vue';

import type { FormBuilder } from '../form-builder';
import { ComponentJSON, ComponentProps, FormBuilderName } from '../types';

export class Component<T extends Record<string, any> = Record<string, any>> {
  name: string | symbol;

  props?: ComponentProps<T>;

  constructor(name: string | symbol, props?: ComponentProps<T>) {
    this.name = name;
    this.props = props;
  }

  /**
   * Lifts a serialized component into a Component and leaves an existing one alone.
   *
   * `props` passes through by reference and is never inspected: a nested layout is either a FormBuilder or the
   * JSON it serializes to, and the <form-render> that receives it takes both.
   */
  static fromJSON(json: ComponentJSON | Component): Component {
    if (json instanceof Component) return json;
    return new Component(json.name, json.props ?? undefined);
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

  /**
   * Renders a <div> anchor sized to `display: contents` so it takes no part in the grid's flex layout, and writes
   * its id into `idRef` so a <Teleport :to> in the consumer's template can target it by a real JS symbol. A
   * populated `idRef` is reused as-is rather than replaced: the same field redeclared across breakpoints - each
   * breakpoint mutually exclusive with the others at render time - passes the same ref to stay one stable
   * <Teleport> target. Two different fields must not share a ref: the layout that resolves for one breakpoint
   * would then carry the same id twice, and a <Teleport :to> only ever reaches the first element bearing it.
   */
  teleportAnchor(idRef: Ref<string>): this {
    // useId() types as `string | undefined` at the declared vue peer floor (3.5.2); it returns a string once
    // called inside an active component instance, which the fluent chain that reaches this method guarantees.
    if (!idRef.value) idRef.value = useId() as string;
    return this.generic('div', { id: idRef.value, style: 'display: contents' });
  }
}
