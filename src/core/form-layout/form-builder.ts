// eslint-disable-next-line max-classes-per-file
import { BreakpointNames, responsiveBreakpoints, ResponsiveRenderOptions } from '@dynamicforms/vuetify-inputs';
import { isArray, isObjectLike } from 'lodash-es';

import { Row } from './row';
import { ComponentProps, FormJSON, FormJSONResponsive, RowPropsPartial } from './types';

class FormBase implements ComponentProps {
  rows: Row[] = [];

  row(rowProps: RowPropsPartial, rowCallback: (row: Row) => Row): this {
    const row = new Row(rowProps);
    rowCallback(row);
    this.rows.push(row);
    return this;
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
