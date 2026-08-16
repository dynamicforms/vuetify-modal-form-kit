import {
  BreakpointNames,
  BreakpointsJSON,
  responsiveBreakpoints,
  ResponsiveRenderOptions,
} from '@dynamicforms/vuetify-inputs';
import { isArray, isBoolean, isNumber, isObjectLike, isString } from 'lodash-es';

import { Component, ComponentBuilderBase, VuetifyInputsComponentBuilder } from './component';
import { ColumnJSON, ColumnJSONResponsive, ColumnPropsPartial, ComponentProps } from './types';

class ColBase implements ComponentProps {
  props: ColumnPropsPartial;

  // undefined until something is added: a breakpoint that holds an empty list states that the column has no
  // components there, while one that states nothing about them inherits the ones below it. `cols` is left out
  // for the same reason - v-col defaults it to false on its own, and stating a width the caller never gave
  // would override the one the column inherits at every breakpoint.
  components?: Component[];

  constructor(props?: ColumnPropsPartial) {
    this.props = props ?? {};
  }

  component<T extends ComponentBuilderBase>(
    BuilderClass: { new (addCallback: (component: Component) => void): T },
    builderCallback: (builder: T) => T,
  ): this;
  component(builderCallback: (builder: VuetifyInputsComponentBuilder) => VuetifyInputsComponentBuilder): this;
  component<T extends ComponentBuilderBase>(param1: any, param2?: any): this {
    let BuilderClass: { new (addCallback: (component: Component) => void): T };
    let builderCallback: (builder: T) => T;
    if (param2) {
      BuilderClass = param1;
      builderCallback = param2;
    } else {
      BuilderClass = <{ new (addCallback: (component: Component) => void): T }>(<unknown>VuetifyInputsComponentBuilder);
      builderCallback = param1;
    }
    const builder = new BuilderClass((component: Component) => {
      (this.components ??= []).push(component);
    });
    builderCallback(builder);
    return this;
  }

  /**
   * @return returns a proxy that allows to immediately from the column object add components, e.g.
   * new FormBuilder().row((row) => row.col((col) => col.simple.generic(...) will add one component into this column.
   * You may call the ComponentBuilder's methods as many times as you want to generate components
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(): T {
    const res = new Proxy({} as T, {
      get:
        (target: T, prop: string | symbol) =>
        (...args: any[]) => {
          this.component((cmpt: any) => cmpt[prop](...args));
          return res;
        },
    });
    return res;
  }

  toJSON(): ColumnJSON {
    return {
      props: this.props,
      components: (this.components ?? []).map((cmpt) => cmpt.toJSON()),
    };
  }
}

// a serialized column names its own `props` and `components`; ColumnProps declares neither key, so the two shapes
// cannot be mistaken for one another
function isColumnJSON(data?: ColumnPropsPartial | ColumnJSONResponsive): data is ColumnJSONResponsive {
  return isObjectLike(data) && ('props' in <object>data || 'components' in <object>data);
}

export class Column extends ResponsiveRenderOptions<ColBase> {
  constructor(props?: ColumnPropsPartial);
  constructor(json: ColumnJSONResponsive);
  constructor(data?: ColumnPropsPartial | ColumnJSONResponsive) {
    super(<BreakpointsJSON<ColBase>>(<unknown>(isColumnJSON(data) ? data : { props: data })));
  }

  /**
   * Lifts a serialized column - the base and every breakpoint it declares - into a Column, and leaves an
   * existing one alone.
   */
  static fromJSON(json: ColumnJSONResponsive | Column): Column {
    return json instanceof Column ? json : new Column(json);
  }

  component<T extends ComponentBuilderBase>(
    BuilderClass: { new (addCallback: (component: Component) => void): T },
    builderCallback: (builder: T) => T,
  ): this;
  component(builderCallback: (builder: VuetifyInputsComponentBuilder) => VuetifyInputsComponentBuilder): this;
  component<T extends ComponentBuilderBase>(param1: any, param2?: any): this {
    this._value.component<T>(param1, param2);
    return this;
  }

  breakpoint(breakpoint: BreakpointNames, colCallback: (col: ColBase) => ColBase): this {
    if (!this._value[breakpoint]) this._value[breakpoint] = new ColBase();
    colCallback(this._value[breakpoint]);
    return this;
  }

  /**
   * @return returns a proxy that allows to immediately from the column object add components, e.g.
   * new FormBuilder().row((row) => row.col((col) => col.simple.generic(...) will add one component into this column.
   * You may call the ComponentBuilder's methods as many times as you want to generate components
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(): T {
    return this._value.simple<T>();
  }

  toJSON(breakpoint?: BreakpointNames): ColumnJSONResponsive {
    if (breakpoint != null) {
      const res = this.getOptionsForBreakpoint(breakpoint);
      return {
        props: res.props,
        components: (res.components ?? []).map((cmpt) => cmpt.toJSON()),
      };
    }
    const res: ColumnJSONResponsive = {
      props: this._value.props,
      components: (this._value.components ?? []).map((cmpt) => cmpt.toJSON()),
    };
    responsiveBreakpoints.forEach((bp) => {
      const value = this._value[bp];
      if (!value) return;
      // a breakpoint that states nothing about the components must not serialize an empty list: read back, that
      // would state that the column has none there
      res[bp] = value.components ? value.toJSON() : { props: value.props };
    });
    return res;
  }

  protected cleanBreakpoint(bp?: ColBase, defaultIfEmpty: boolean = false): ColBase | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result: ColumnPropsPartial = {};

    const validAlignSelf = ['start', 'end', 'center', 'auto', 'baseline', 'stretch'];
    const isValidCols = (v: unknown): boolean => isNumber(v) || v === 'auto' || isBoolean(v);
    const isValidOffset = (v: unknown): boolean => isNumber(v);
    const isValidOrder = (v: unknown): boolean => isNumber(v);

    const isValidClass = (v: unknown): boolean =>
      isString(v) || (isArray(v) && v.every((i) => isString(i))) || (isObjectLike(v) && !Array.isArray(v));

    const isValidStyle = (v: unknown): boolean => {
      if (isString(v)) return true;
      if (isArray(v)) return v.every(isValidStyle);
      if (isObjectLike(v)) {
        return Object.entries(v as object).every(([k, val]) => isString(k) && (isString(val) || isNumber(val)));
      }
      return false;
    };

    // `offset-<bp>` and `order-<bp>` camelize onto v-col's offsetMd / orderMd props; `cols` has no such variant,
    // as v-col names per-breakpoint widths sm/md/lg/xl/xxl instead
    const responsiveKeys = ['offset', 'order'];
    const validKeys = new Set<string>([
      'cols',
      ...responsiveKeys,
      ...responsiveBreakpoints.flatMap((b) => responsiveKeys.map((k) => `${k}-${b}`)),
      'alignSelf',
      'class',
      'style',
    ]);

    const bpProps: ColumnPropsPartial = (bp ?? {}).props ?? {};
    Object.keys(bpProps).forEach((key) => {
      const val = bpProps[key as keyof ColumnPropsPartial];
      if (!validKeys.has(key)) return;

      if (key === 'alignSelf') {
        if (isString(val) && validAlignSelf.includes(val)) result[key] = val as any;
      } else if (key === 'class') {
        if (isValidClass(val)) result[key] = val as any;
      } else if (key === 'style') {
        if (isValidStyle(val)) result[key] = val as any;
      } else if (key === 'cols') {
        if (isValidCols(val)) result[key] = val as any;
      } else if (key.startsWith('offset')) {
        if (isValidOffset(val)) (<any>result)[key] = val;
      } else if (key.startsWith('order')) {
        if (isValidOrder(val)) (<any>result)[key] = val;
      }
    });

    const res = new ColBase(result);
    // undefined, not [], where the breakpoint holds no components - an empty list would state that it has none.
    // Serialized components are lifted here, which is the one funnel both the constructor and every
    // getOptionsForBreakpoint call pass through; a Component already in the list is left as it is.
    res.components = bp?.components ? bp.components.map((cmpt) => Component.fromJSON(cmpt)) : undefined;
    return res;
  }
}
