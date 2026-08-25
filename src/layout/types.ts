import { BreakpointNames } from '@dynamicforms/vuetify-inputs';

import { FormBuilder, FormJSONResponsive } from '../core/form-layout';

// the props and emits of the two render components live here, not in their SFCs: `<script setup>` has no exports,
// and a consumer wrapping either component needs a name for the types it forwards

/** Props of `<form-render>`. */
export interface FormRenderProps {
  /** the layout to render, either as a builder or as its serialization */
  layout: FormBuilder | FormJSONResponsive;
  /** component name to component definition; `<form-render>` adds itself to it under `FormBuilderName` */
  components?: Record<string | symbol, any>;
}

/** Emits of `<form-render>`. */
export interface FormRenderEmits {
  /**
   * fires with the currently resolved breakpoint, once immediately and again on every change. A resolved layout
   * can rearrange which row/column holds a `teleportAnchor()` cell, which forces Vue to recreate that cell's
   * `<div :id>` rather than patch it in place; a `<Teleport :to>` only re-resolves its target when the `to`
   * string itself changes, so it otherwise keeps pointing at the element that just got removed. Key a consumer's
   * `<Teleport>` on this value to force it to remount and re-resolve alongside the anchor.
   */
  breakpoint: [breakpoint: BreakpointNames];
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
