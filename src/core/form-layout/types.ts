import { BreakpointNames } from '@dynamicforms/vuetify-inputs';

export const FormBuilderName = Symbol('FormBuilder');
export const FormBuilderBodyProp = Symbol('FormBuilderBodyProp');

type BaseBkpt = BreakpointNames | 'base';

export interface FormJSON {
  rows: RowJSON[];
}
export type FormJSONResponsive = FormJSON & {
  [key in BreakpointNames]?: FormJSON;
};

// row declarations
interface CSSProperties { [key: string]: string | number; }

type Align = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
type AlignProps = { [K in BaseBkpt as K extends 'base' ? 'align' : `align-${K}`]?: Align };

type AlignContent = 'start' | 'center' | 'end' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly';
type AlignContentProps = {
  [K in BaseBkpt as K extends 'base' ? 'align-content' : `align-content-${K}`]?: AlignContent
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
export type RowJSONResponsive = RowJSON & {
  [key in BreakpointNames]?: RowJSON;
};

// column declaractions

type ColsProps = { [K in BaseBkpt as K extends 'base' ? 'cols' : `cols-${K}`]?: number | 'auto' | boolean; };
type OffsetProps = { [K in BaseBkpt as K extends 'base' ? 'offset' : `offset-${K}`]?: number | 'auto' | boolean; };
type OrderProps = { [K in BaseBkpt as K extends 'base' ? 'order' : `order-${K}`]?: number | 'auto' | boolean; };

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
export type ColumnJSONResponsive = ColumnJSON & {
  [key in BreakpointNames]?: ColumnJSON;
};

// component declarations
export type ComponentProps<T extends Record<string | symbol, any> = Record<string | symbol, any>> = T & {
  toJSON?: (breakpoint?: BreakpointNames) => any;
};

export interface ComponentJSON<T extends ComponentProps = ComponentProps> {
  name: string | symbol;
  props: T;
}

export type TwelveDivisible = 1 | 2 | 3 | 4 | 6 | 12;
