// eslint-disable-next-line max-classes-per-file
import { BreakpointNames, responsiveBreakpoints, ResponsiveRenderOptions } from '@dynamicforms/vuetify-inputs';
import { isArray, isObjectLike } from 'lodash-es';

import { type ComponentBuilderBase, VuetifyInputsComponentBuilder } from './component';
import { Row } from './row';
import { ComponentProps, FormJSON, FormJSONResponsive, RowPropsPartial, TwelveDivisible } from './types';

export type SimpleProxy<T extends ComponentBuilderBase> = T & {
  simple: (cols?: TwelveDivisible) => SimpleProxy<T>;
};

class FormBase implements ComponentProps {
  rows: Row[] = [];

  row(rowProps: RowPropsPartial, rowCallback: (row: Row) => Row): this {
    const row = new Row(rowProps);
    rowCallback(row);
    this.rows.push(row);
    return this;
  }

  /**
   * @param cols specifies how many columns we want per row. each column will be 12/cols wide with cols columns per row
   * @return returns a proxy that allows to immediately from the FormBuilder object add components into their own
   * rows and columns e.g. new FormBuilder().simple.generic(...) will create a layout with one row, column and within
   * it your generic component. You may call the ComponentBuilder's methods as many times as you want
   * to generate more rows and columns with components
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): SimpleProxy<T> {
    let currentRow: Row | null = null;
    let componentsInCurrentRow = 0;

    const res = new Proxy({} as SimpleProxy<T>, {
      get: (target: SimpleProxy<T>, prop: string | symbol) => {
        if (prop === 'simple') {
          return (newCols: TwelveDivisible = 1) => this.simple<T>(newCols);
        }
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
    return { rows: this.rows.map((row) => row.toJSON(breakpoint)) } as FormJSON;
  }
}

// eslint-disable-next-line import/prefer-default-export
export class FormBuilder extends ResponsiveRenderOptions<FormBase> {
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
   * rows and columns e.g. new FormBuilder().simple.generic(...) will create a layout with one row, column and within
   * it your generic component. You may call the ComponentBuilder's methods as many times as you want
   * to generate more rows and columns with components
   */
  simple<T extends ComponentBuilderBase = VuetifyInputsComponentBuilder>(cols: TwelveDivisible = 1): SimpleProxy<T> {
    return this._value.simple<T>(cols);
  }

  toJSON(breakpoint?: BreakpointNames): FormJSONResponsive {
    if (breakpoint != null) {
      const res = this.getOptionsForBreakpoint(breakpoint);
      return { rows: res.rows.map((row) => row.toJSON(breakpoint)) };
    }
    const res: FormJSONResponsive = { rows: this._value.rows.map((row) => row.toJSON()) };
    responsiveBreakpoints.forEach((bp) => { if (this._value[bp]) res[bp] = this._value[bp].toJSON(); });
    return res;
  }

  // eslint-disable-next-line class-methods-use-this
  protected cleanBreakpoint(bp?: FormBase, defaultIfEmpty: boolean = false): FormBase | null {
    if ((!bp || !isObjectLike(bp)) && !defaultIfEmpty) return null;

    const result = new FormBase();
    if (defaultIfEmpty) result.rows = [];

    if (bp) {
      if (isArray(bp.rows)) result.rows = bp.rows;
    }

    return result.rows.length || defaultIfEmpty ? result : null;
  }
}
