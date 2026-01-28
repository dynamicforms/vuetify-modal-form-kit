import { BreakpointNames, responsiveBreakpoints, ResponsiveRenderOptions } from '@dynamicforms/vuetify-inputs';
import { BreakpointsJSON } from '@dynamicforms/vuetify-inputs';
import { isArray, isBoolean, isNumber, isObjectLike, isString } from 'lodash-es';

import { Column } from './column';
import { ComponentBuilderBase, VuetifyInputsComponentBuilder } from './component';
import {
  ColumnPropsPartial,
  ComponentProps,
  RowJSON,
  RowJSONResponsive,
  RowPropsPartial,
  TwelveDivisible,
} from './types';

class RowBase implements ComponentProps {
  props: RowPropsPartial;

  columns: Column[] = [];

  constructor(props?: RowPropsPartial) {
    this.props = props ?? {};
  }

  col(colProps?: ColumnPropsPartial, colCallback?: (col: Column) => Column): this {
    const column = new Column(colProps);
    colCallback?.(column);
    this.columns.push(column);
    return this;
  }

  /**
   * @param cols specifies how many columns we have designed this row to have. each column will be 12 / cols wide
   * @return returns a proxy that allows to immediately from the row object add components into their own
   * columns e.g. new FormBuilder().row((row) => row.simple.generic(...) will create a layout with one column and within
   * it your generic component. You may call the ComponentBuilder's methods as many times as you want
   * to generate more columns with components
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): T {
    const res = new Proxy({} as T, {
      get:
        (target: T, prop: string | symbol) =>
        (...args: any[]) => {
          this.col({ cols: 12 / cols }, (col) => col.component((cmpt: any) => cmpt[prop](...args)));
          return res;
        },
    });
    return res;
  }

  toJSON(breakpoint?: BreakpointNames): RowJSON {
    return { props: this.props, columns: this.columns.map((col) => col.toJSON(breakpoint)) };
  }
}

export class Row extends ResponsiveRenderOptions<RowBase> {
  constructor(props?: RowPropsPartial) {
    super({ props } as BreakpointsJSON<RowBase>);
  }

  col(colProps?: ColumnPropsPartial, colCallback?: (col: Column) => Column): this {
    this._value.col(colProps, colCallback);
    return this;
  }

  breakpoint(breakpoint: BreakpointNames, rowCallback: (row: RowBase) => RowBase): this {
    if (!this._value[breakpoint]) this._value[breakpoint] = new RowBase();
    rowCallback(this._value[breakpoint]);
    return this;
  }

  /**
   * @param cols specifies how many columns we have designed this row to have. each column will be 12 / cols wide
   * @return returns a proxy that allows to immediately from the row object add components into their own
   * columns e.g. new FormBuilder().row((row) => row.simple.generic(...) will create a layout with one column and within
   * it your generic component. You may call the ComponentBuilder's methods as many times as you want
   * to generate more columns with components
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): T {
    return this._value.simple<T>(cols);
  }

  toJSON(breakpoint?: BreakpointNames): RowJSONResponsive {
    if (breakpoint != null) {
      const res = this.getOptionsForBreakpoint(breakpoint);
      return { props: res.props, columns: res.columns.map((col) => col.toJSON(breakpoint)) };
    }
    const res: RowJSONResponsive = {
      props: this._value.props,
      columns: this._value.columns.map((col) => col.toJSON()),
    };
    responsiveBreakpoints.forEach((bp) => {
      if (this._value[bp]) res[bp] = this._value[bp].toJSON();
    });
    return res;
  }

  protected cleanBreakpoint(bp?: RowBase, defaultIfEmpty: boolean = false): RowBase | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result: RowPropsPartial = {};
    const AllowedAlign = ['start', 'center', 'end', 'baseline', 'stretch'];
    const AllowedAlignContent = ['start', 'center', 'end', 'stretch', 'space-between', 'space-around', 'space-evenly'];
    const AllowedJustify = ['start', 'center', 'end', 'space-between', 'space-around', 'space-evenly'];

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

    const baseKeys = ['align', 'align-content', 'justify'];
    const validKeys = new Set<string>([
      ...baseKeys,
      ...responsiveBreakpoints.flatMap((b) => baseKeys.map((k) => `${k}-${b}`)),
      'dense',
      'no-gutters',
      'class',
      'style',
    ]);

    const bpProps: RowPropsPartial = (bp ?? {}).props ?? {};
    Object.keys(bpProps).forEach((key) => {
      const val = bpProps[key as keyof RowPropsPartial];
      if (!validKeys.has(key) || val === undefined) return;

      if (key === 'dense') {
        if (isBoolean(val)) result[key] = val as any;
      } else if (key === 'noGutters') {
        if (isBoolean(val)) result[key] = val as any;
      } else if (key === 'class') {
        if (isValidClass(val)) result[key] = val as any;
      } else if (key === 'style') {
        if (isValidStyle(val)) result[key] = val as any;
      } else if (key.startsWith('align')) {
        if (isString(val) && AllowedAlign.includes(val)) (<any>result)[key] = val;
      } else if (key.startsWith('align-content')) {
        if (isString(val) && AllowedAlignContent.includes(val)) (<any>result)[key] = val;
      } else if (key.startsWith('justify')) {
        if (isString(val) && AllowedJustify.includes(val)) (<any>result)[key] = val;
      }
    });

    const res = new RowBase(result);
    res.columns = [...(bp?.columns ?? [])];
    return res;
  }
}
