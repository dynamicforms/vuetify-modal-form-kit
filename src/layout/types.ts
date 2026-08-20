import { FormBuilder, FormJSONResponsive } from '../core/form-layout';

// the props of the two render components live here, not in their SFCs: `<script setup>` has no exports, and a
// consumer wrapping either component needs a name for the props type it forwards

/** Props of `<form-render>`. */
export interface FormRenderProps {
  /** the layout to render, either as a builder or as its serialization */
  layout: FormBuilder | FormJSONResponsive;
  /** component name to component definition; `<form-render>` adds itself to it under `FormBuilderName` */
  components?: Record<string | symbol, any>;
}

/** Props of `<component-render>`. */
export interface ComponentRenderProps {
  /** the name to look up in `components`; `FormBuilderName` renders a nested form */
  name: string | symbol;
  /** what is bound onto the resolved component; `FormBuilderBodyProp` in it becomes the default slot. A serialized
   * component that carries none states `null`, which is what `ComponentJSON` holds and what reaches this prop. */
  props?: Record<string | symbol, any> | null;
  /** component name to component definition; a name missing from it resolves against globally registered components */
  components?: Record<string | symbol, any>;
}
