import { BreakpointNames, responsiveBreakpoints, ResponsiveRenderOptions } from '@dynamicforms/vuetify-inputs';
import { BreakpointsJSON } from '@dynamicforms/vuetify-inputs';
import { isArray, isBoolean, isNumber, isObjectLike, isString } from 'lodash-es';

import { Column } from './column';
import { ComponentBuilderBase, VuetifyInputsComponentBuilder } from './component';
import { isRuntimeProbe } from './simple-proxy';
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

  // undefined until a column is added: a breakpoint holding an empty list states that the row has no columns
  // there, while one that states nothing about them inherits the columns below it
  columns?: Column[];

  constructor(props?: RowPropsPartial) {
    this.props = props ?? {};
  }

  col(colProps?: ColumnPropsPartial, colCallback?: (col: Column) => Column): this {
    const column = new Column(colProps);
    colCallback?.(column);
    (this.columns ??= []).push(column);
    return this;
  }

  /**
   * @param cols specifies how many columns we have designed this row to have. each column will be 12 / cols wide
   * @return returns a proxy that allows to immediately from the row object add components into their own
   * columns, e.g. `row.simple(2).generic(...)` will add your generic component into a column 6 wide. You may call
   * the ComponentBuilder's methods as many times as you want to generate more columns with components. Unlike
   * `FormBuilder.simple()`, the proxy this returns does not restart: `simple` on it is a component-adding call
   * like any other name.
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): T {
    const res = new Proxy({} as T, {
      get: (target: T, prop: string | symbol) => {
        if (isRuntimeProbe(prop)) return undefined;
        return (...args: any[]) => {
          this.col({ cols: 12 / cols }, (col) => col.component((cmpt: any) => cmpt[prop](...args)));
          return res;
        };
      },
    });
    return res;
  }

  toJSON(breakpoint?: BreakpointNames): RowJSON {
    return { props: this.props, columns: (this.columns ?? []).map((col) => col.toJSON(breakpoint)) };
  }
}

// a serialized row names `props`, `columns` or a breakpoint; RowProps declares none of those keys, so the two
// shapes cannot be mistaken for one another. A row whose JSON states nothing at the base and only overrides a
// breakpoint names none of the first two, which is why the breakpoints count.
function isRowJSON(data?: RowPropsPartial | RowJSONResponsive): data is RowJSONResponsive {
  if (!isObjectLike(data)) return false;
  const keys = <object>data;
  return 'props' in keys || 'columns' in keys || responsiveBreakpoints.some((bp) => bp in keys);
}

export class Row extends ResponsiveRenderOptions<RowBase> {
  constructor(props?: RowPropsPartial);
  constructor(json: RowJSONResponsive);
  constructor(data?: RowPropsPartial | RowJSONResponsive) {
    super(<BreakpointsJSON<RowBase>>(<unknown>(isRowJSON(data) ? data : { props: data })));
  }

  /**
   * Lifts a serialized row - the base and every breakpoint it declares - into a Row, and leaves an existing one
   * alone.
   */
  static fromJSON(json: RowJSONResponsive | Row): Row {
    return json instanceof Row ? json : new Row(json);
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
   * columns, e.g. `row.simple(2).generic(...)` will add your generic component into a column 6 wide. You may call
   * the ComponentBuilder's methods as many times as you want to generate more columns with components. Unlike
   * `FormBuilder.simple()`, the proxy this returns does not restart: `simple` on it is a component-adding call
   * like any other name.
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): T {
    return this._value.simple<T>(cols);
  }

  toJSON(breakpoint?: BreakpointNames): RowJSONResponsive {
    if (breakpoint != null) {
      const res = this.getOptionsForBreakpoint(breakpoint);
      return { props: res.props, columns: (res.columns ?? []).map((col) => col.toJSON(breakpoint)) };
    }
    const res: RowJSONResponsive = {
      props: this._value.props,
      columns: (this._value.columns ?? []).map((col) => col.toJSON()),
    };
    responsiveBreakpoints.forEach((bp) => {
      const value = this._value[bp];
      if (!value) return;
      // a breakpoint that states nothing about the columns must not serialize an empty list: read back, that
      // would state that the row has no columns there
      res[bp] = value.columns ? value.toJSON() : { props: value.props };
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
      'noGutters',
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
        // align-content before align: the former also starts with the latter
      } else if (key.startsWith('align-content')) {
        if (isString(val) && AllowedAlignContent.includes(val)) (<any>result)[key] = val;
      } else if (key.startsWith('align')) {
        if (isString(val) && AllowedAlign.includes(val)) (<any>result)[key] = val;
      } else if (key.startsWith('justify')) {
        if (isString(val) && AllowedJustify.includes(val)) (<any>result)[key] = val;
      }
    });

    const res = new RowBase(result);
    // undefined, not [], where the breakpoint holds no columns - an empty list would state that it has none.
    // Serialized columns are lifted here, which is the one funnel both the constructor and every
    // getOptionsForBreakpoint call pass through; a Column already in the list is left as it is.
    res.columns = bp?.columns ? bp.columns.map((col) => Column.fromJSON(col)) : undefined;
    return res;
  }
}
