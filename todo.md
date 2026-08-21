# Todo

Work.

## Blocked on the peers

- `ResponsiveActionRenderOptions.cleanBreakpoint` copies five of the nine members `ActionRenderOptions` declares,
  so `name`, `defaultConfirm`, `defaultReject` and `passthroughAttrs` are absent from what
  `getRenderOptionsForBreakpoint()` answers - not only at a breakpoint that states them, but at the base as well.
  Every reader gets them by going around the resolution instead: `<df-actions>` reads `action.value.passthroughAttrs`
  and `defaultActionColor(action.value)`, and `df-modal.component.vue`'s `renderOptions()` casts the raw value for
  the two flags. That is why the dialog cannot use the peer's own resolver, and why `{ md: { defaultReject: true } }`
  is silently inert.
- `DfInputHint` and `DfLabel` declare their props inline, so neither has a name `DfInputComponentProps` exports.
  `VuetifyInputsComponentBuilder` therefore has nine methods for eleven exported components, and a layout wanting
  either falls to `generic('df-input-hint', props)` with `props: any`.
- There is no tag-name to component map. `<component-render>` looks a component up as `props.components[name]`, a
  plain object lookup rather than Vue's resolver, so `src/modal/df-api.component.vue` hard-codes a nine-name import
  list and the object beside it, and the builder's tag literals agree with what renders by coincidence.
- `<modal-view>`'s component map grows with the peer. `df-list` is on vuetify-inputs' own list, and a dialog cannot
  render one until the map names it.

- `@dynamicforms/vue-forms` `docs/api/actions.md:95-120` states one shape of an abort: the value a trigger answers
  with. `supr` is `walk()` bound directly (`src/actions/actions-map.ts:147`) and carries no catch of its own, so a
  mid-chain handler meets an abort as a throw and only the outermost caller meets it as a value. The two shapes
  are the right ones - inside the chain an exception unwinds, as JS does, and the public edge answers a value -
  but only the second is written down, and no spec covers an inner handler aborting under an outer one.
- `@dynamicforms/vue-forms` `ActionsMap.run()` catches synchronously, so an `async` handler's rejection passes it
  untouched: `execute()` rejects where the same abort from a synchronous handler resolves with the exception. Any
  handler that awaits `supr` - which is every handler wrapping an asynchronous executor - has to catch the abort
  itself to keep the documented contract, which is what `src/modal/api.ts:186-193` does.

## The layout builder

- `column.ts:152-153` accepts a number for `offset` and `order` and nothing else, while `types.ts:58-59` declares
  both as `number | 'auto' | boolean`. `<v-col>` takes `[String, Number]` for each and emits `order-${value}`, so
  `order: 'first'` and `order: 'last'` are real Vuetify classes the filter drops silently: the value type-checks,
  reaches `ColBase.cleanBreakpoint`, and is gone. Either the filter widens to what `<v-col>` takes or the declared type
  narrows to what the filter keeps. `column.spec.ts` pins the current drop, so whichever way it goes the spec
  changes with it.
- `isValidClass`, identical in `row.ts:131-132` and `column.ts:155-156`, accepts any non-array object-like value,
  so `{ active: 'yes' }` and a `Date` pass although `RowProps` / `ColumnProps` declare `Record<string, boolean>`.
  It is lax rather than over-strict - nothing valid is lost - and what it lets through reaches `<v-row>` /
  `<v-col>` as a class binding Vue then has to make sense of.

## The generated layout

- `src/modal/df-api.component.vue:100-109` renders every `Form.Field` as `<df-input>` whatever it holds: a boolean
  gets a text input, a field carrying choices gets no `<df-select>`, a date gets no picker. The component to draw
  is the field's to state - `field.extra.component`, falling back to `dfInput` - rather than a type-to-component
  table here, which would put `@dynamicforms/vuetify-inputs`' catalogue in this repository and go stale as it
  grows. It needs a key on vue-forms' `Extras`, so it reaches the peer or is augmented here.
- `src/modal/df-api.component.vue:112` collects a member that is neither an `Action` nor a `Field` into a warning
  and draws nothing for it, so a nested `Group` or `List` validates and counts towards `form.valid` off screen.
  Laying a `Group` out recursively answers the easy half; a `List` has no answer without a row template, so the
  rule would be harder to state than the warning is.
