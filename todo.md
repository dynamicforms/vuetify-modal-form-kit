# Todo

Work.

## The layout builder

- `isValidClass`, in `prop-validators.ts:13`, accepts any non-array object-like value, so `{ active: 'yes' }` and a
  `Date` pass although `RowProps` / `ColumnProps` declare `Record<string, boolean>`. It is lax rather than
  over-strict - nothing valid is lost - and what it lets through reaches `<v-row>` / `<v-col>` as a class binding
  Vue then has to make sense of. Vue's class binding reads any truthy value as "on", so tightening rejects
  something that renders.

## The generated layout

- `src/modal/df-api.component.vue:103` collects a member that is neither an `Action` nor a `Field` into a warning
  and draws nothing for it, so a nested `Group` or `List` validates and counts towards `form.valid` off screen.
  Laying a `Group` out recursively answers the easy half; a `List` has no answer without a row template, so the
  rule would be harder to state than the warning is.
