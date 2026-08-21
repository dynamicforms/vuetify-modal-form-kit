import { BreakpointNames, BreakpointsJSON, DfInputComponentTag } from '@dynamicforms/vuetify-inputs';

/**
 * The tag of a component `@dynamicforms/vuetify-inputs` draws with, which is what a field states in order to be
 * drawn as something other than `df-input`. It is re-exported so that the `Extras` augmentation declaring that
 * key names a type the emitted declarations import rather than one they only mention.
 */
export type { DfInputComponentTag };

export const FormBuilderName = Symbol('FormBuilder');
export const FormBuilderBodyProp = Symbol('FormBuilderBodyProp');

type BaseBkpt = BreakpointNames | 'base';

export interface FormJSON {
  rows: RowJSON[];
}
// what a form breakpoint serializes to: it states only what it changes, so a missing `rows` inherits the list
// from the breakpoint below it, while an empty one states that the form has no rows there
export type FormJSONBreakpoint = Partial<FormJSON>;
export type FormJSONResponsive = BreakpointsJSON<FormJSON, FormJSONBreakpoint>;

// row declarations
interface CSSProperties {
  [key: string]: string | number;
}

type Align = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type AlignProps = { [K in BaseBkpt as K extends 'base' ? 'align' : `align-${K}`]?: Align };

type AlignContent = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
type AlignContentProps = {
  [K in BaseBkpt as K extends 'base' ? 'align-content' : `align-content-${K}`]?: AlignContent;
};

type Justify = 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
type JustifyProps = { [K in BaseBkpt as K extends 'base' ? 'justify' : `justify-${K}`]?: Justify };

export interface RowProps extends AlignProps, AlignContentProps, JustifyProps {
  dense?: boolean;
  noGutters?: boolean;
  class?: string | Record<string, boolean> | string[];
  style?: string | CSSProperties | (string | CSSProperties)[];
}

export type RowPropsPartial = Partial<RowProps>;

export interface RowJSON {
  props: RowPropsPartial;
  columns: ColumnJSON[];
}
// what a row breakpoint serializes to: it states only what it changes, so a missing `columns` inherits the list
// from the breakpoint below it, while an empty one states that the row has no columns there
export type RowJSONBreakpoint = Omit<RowJSON, 'columns'> & { columns?: ColumnJSON[] };
export type RowJSONResponsive = BreakpointsJSON<RowJSON, RowJSONBreakpoint>;

// column declaractions

// no `cols-<bp>` variant: v-col takes per-breakpoint widths as the props sm/md/lg/xl/xxl, so a `cols-md` key would
// only ever land as an inert DOM attribute. Per-breakpoint widths go through Column.breakpoint().
interface ColsProps {
  cols?: number | 'auto' | boolean;
}
// v-col renders each of these into the class `offset-<value>` / `order-<value>`, so what they take is what
// Vuetify's stylesheet declares a class for: a number, and for `order` the two named positions besides
type OffsetProps = { [K in BaseBkpt as K extends 'base' ? 'offset' : `offset-${K}`]?: number };
type OrderProps = { [K in BaseBkpt as K extends 'base' ? 'order' : `order-${K}`]?: number | 'first' | 'last' };

export interface ColumnProps extends ColsProps, OffsetProps, OrderProps {
  alignSelf?: 'start' | 'end' | 'center' | 'auto' | 'baseline' | 'stretch';
  class?: string | Record<string, boolean> | string[];
  style?: string | CSSProperties | (string | CSSProperties)[];
}
export type ColumnPropsPartial = Partial<ColumnProps>;

export interface ColumnJSON {
  props: ColumnPropsPartial;
  components: ComponentJSON[];
}
// what a column breakpoint serializes to: it states only what it changes, so a missing `components` inherits the
// list from the breakpoint below it, while an empty one states that the column has none there
export type ColumnJSONBreakpoint = Omit<ColumnJSON, 'components'> & { components?: ComponentJSON[] };
export type ColumnJSONResponsive = BreakpointsJSON<ColumnJSON, ColumnJSONBreakpoint>;

// component declarations
export type ComponentProps<T extends Record<string | symbol, any> = Record<string | symbol, any>> = T & {
  toJSON?: (breakpoint?: BreakpointNames) => any;
};

export interface ComponentJSON<T extends ComponentProps = ComponentProps> {
  name: string | symbol;
  props: T | null;
}

export type TwelveDivisible = 1 | 2 | 3 | 4 | 6 | 12;
