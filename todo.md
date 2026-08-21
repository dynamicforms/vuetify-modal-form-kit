# Todo

Work. The decisions that have to be made before some of it can be done are in `gaps.md`.

## Blocked on the peers

- `ResponsiveActionRenderOptions.cleanBreakpoint` copies five of the members `ActionRenderOptions` declares and
  drops `name`, `defaultConfirm`, `defaultReject` and `passthroughAttrs`, so a breakpoint stating one of those four
  states nothing. This library reads all four off the value rather than through the resolved options, which is why
  it does not notice; a caller writing `{ md: { defaultConfirm: true } }` gets no error and no effect.
- `DfInputHint` and `DfLabel` declare their props inline, so neither has a name `DfInputComponentProps` exports.
  `VuetifyInputsComponentBuilder` therefore has nine methods for eleven exported components, and a layout wanting
  either falls to `generic('df-input-hint', props)` with `props: any`.
- There is no tag-name to component map. `<component-render>` looks a component up as `props.components[name]`, a
  plain object lookup rather than Vue's resolver, so `src/modal/df-api.component.vue` hard-codes a nine-name import
  list and the object beside it, and the builder's tag literals agree with what renders by coincidence.
- `<modal-view>`'s component map grows with the peer. `df-list` is on vuetify-inputs' own list, and a dialog cannot
  render one until the map names it.

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
