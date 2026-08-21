import {
  BreakpointNames,
  BreakpointsJSON,
  responsiveBreakpoints,
  ResponsiveRenderOptions,
} from '@dynamicforms/vuetify-inputs';
import { isArray, isObjectLike } from 'lodash-es';

import { type ComponentBuilderBase, VuetifyInputsComponentBuilder } from './component';
import { Row } from './row';
import { isRuntimeProbe } from './simple-proxy';
import { ComponentProps, FormJSON, FormJSONResponsive, RowPropsPartial, TwelveDivisible } from './types';

export type SimpleProxy<T extends ComponentBuilderBase> = T & {
  simple: (cols?: TwelveDivisible) => SimpleProxy<T>;
};

class FormBase implements ComponentProps {
  // undefined until a row is added: a breakpoint holding an empty list states that the form has no rows there,
  // while one that states nothing about them inherits the rows below it
  rows?: Row[];

  row(rowProps: RowPropsPartial, rowCallback: (row: Row) => Row): this {
    const row = new Row(rowProps);
    rowCallback(row);
    (this.rows ??= []).push(row);
    return this;
  }

  /**
   * @param cols specifies how many columns we want per row. each column will be 12/cols wide with cols columns per row
   * @return returns a proxy that allows to immediately from the FormBuilder object add components into their own
   * rows and columns, e.g. `new FormBuilder().simple().generic(...)` will create a layout with one row, column and
   * within it your generic component. You may call the ComponentBuilder's methods as many times as you want
   * to generate more rows and columns with components. `simple` on the returned proxy restarts the layout at a
   * new column count; a row's and a column's proxy answer it as a component-adding call like any other name.
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): SimpleProxy<T> {
    let currentRow: Row | null = null;
    let componentsInCurrentRow = 0;

    const res = new Proxy({} as SimpleProxy<T>, {
      get: (target: SimpleProxy<T>, prop: string | symbol) => {
        if (prop === 'simple') {
          return (newCols: TwelveDivisible = 1) => this.simple<T>(newCols);
        }
        if (isRuntimeProbe(prop)) return undefined;
        return (...args: any[]) => {
          if (!currentRow || componentsInCurrentRow >= cols) {
            this.row({}, (row) => {
              currentRow = row;
              return row;
            });
            componentsInCurrentRow = 0;
          }
          currentRow!.col({ cols: 12 / cols }, (col) => col.component((cmpt: any) => cmpt[prop](...args)));
          componentsInCurrentRow++;
          return res;
        };
      },
    });
    return res;
  }

  toJSON(breakpoint?: BreakpointNames): FormJSON {
    return { rows: (this.rows ?? []).map((row) => row.toJSON(breakpoint)) } as FormJSON;
  }
}

export class FormBuilder extends ResponsiveRenderOptions<FormBase> {
  // FormJSON names its rows the way FormBase does, so a serialized layout goes straight in: the base constructor
  // runs it, and every breakpoint it declares, through cleanBreakpoint
  constructor(layout?: FormJSONResponsive) {
    super(<BreakpointsJSON<FormBase>>(<unknown>layout));
  }

  /**
   * Lifts a serialized layout - the base and every breakpoint it declares, rows, columns and components alike -
   * into a FormBuilder, and leaves an existing one alone.
   */
  static fromJSON(json?: FormJSONResponsive | FormBuilder): FormBuilder {
    return json instanceof FormBuilder ? json : new FormBuilder(json);
  }

  row(rowProps: RowPropsPartial, rowCallback: (row: Row) => Row): this {
    this._value.row(rowProps, rowCallback);
    return this;
  }

  breakpoint(breakpoint: BreakpointNames, formCallback: (form: FormBase) => FormBase): this {
    if (!this._value[breakpoint]) this._value[breakpoint] = new FormBase();
    formCallback(this._value[breakpoint]);
    return this;
  }

  /**
   * @param cols specifies how many columns we want per row. each column will be 12/cols wide with cols columns per row
   * @return returns a proxy that allows to immediately from the FormBuilder object add components into their own
   * rows and columns, e.g. `new FormBuilder().simple().generic(...)` will create a layout with one row, column and
   * within it your generic component. You may call the ComponentBuilder's methods as many times as you want
   * to generate more rows and columns with components. `simple` on the returned proxy restarts the layout at a
   * new column count; a row's and a column's proxy answer it as a component-adding call like any other name.
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): SimpleProxy<T> {
    return this._value.simple<T>(cols);
  }

  toJSON(breakpoint?: BreakpointNames): FormJSONResponsive {
    if (breakpoint != null) {
      const res = this.getOptionsForBreakpoint(breakpoint);
      return { rows: (res.rows ?? []).map((row) => row.toJSON(breakpoint)) };
    }
    const res: FormJSONResponsive = { rows: (this._value.rows ?? []).map((row) => row.toJSON()) };
    responsiveBreakpoints.forEach((bp) => {
      // a form breakpoint is nothing but its rows, so one that states nothing about them is left out entirely:
      // serializing an empty list would state that the form has no rows there
      if (this._value[bp]?.rows) res[bp] = this._value[bp].toJSON();
    });
    return res;
  }

  protected cleanBreakpoint(bp?: FormBase, defaultIfEmpty: boolean = false): FormBase | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result = new FormBase();
    // the base carries the field even when it holds nothing: the merge takes its field set from what
    // defaultIfEmpty returns. A breakpoint leaves it undefined instead, so that it states nothing about the
    // rows rather than emptying the ones it inherits.
    if (defaultIfEmpty) result.rows = [];

    if (bp) {
      // a serialized layout holds plain objects where the builder API holds Rows; lifting them here covers every
      // way data reaches _value, and leaves a Row that is already an instance alone
      if (isArray(bp.rows)) result.rows = bp.rows.map((row) => Row.fromJSON(row));
    }

    // a breakpoint carrying an empty list states that the form has no rows there, and is kept; one that says
    // nothing about them has no rows field at all and is dropped
    return result.rows || defaultIfEmpty ? result : null;
  }
}
