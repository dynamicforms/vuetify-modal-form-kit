<!-- FormRenderer.vue -->
<template>
  <div class="form-layout">
    <v-row v-for="(row, rowIndex) in layoutToRender.rows" :key="rowIndex" v-bind="row.props as any">
      <v-col v-for="(column, colIndex) in row.columns" :key="colIndex" v-bind="column.props as any">
        <component-renderer
          v-for="(component, compIndex) in column.components"
          :key="compIndex"
          :name="component.name"
          :props="component.props"
          :components="componentsWithMe"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { getBreakpointName } from '@dynamicforms/vuetify-inputs';
import { computed, getCurrentInstance } from 'vue';
import { useDisplay } from 'vuetify';

import { FormBuilder, FormBuilderName, FormJSON } from '../core/form-layout';

import ComponentRenderer from './component-render.vue';
import { FormRenderProps } from './types';

const props = withDefaults(defineProps<FormRenderProps>(), { components: () => ({}) });

const responsiveLayout = computed(() => FormBuilder.fromJSON(props.layout));
const display = useDisplay();

// a <Teleport :to="'#' + id"> only ever reaches the first element bearing that id, so two components sharing one
// within what a single breakpoint renders leaves one of them permanently empty - warn about it here, once per
// resolved layout, rather than leave it a silent gap. Nested forms resolve their own breakpoint in their own
// <form-render> instance, so each checks only the ids it renders itself.
function warnDuplicateIds(layout: FormJSON) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of layout.rows) {
    for (const column of row.columns) {
      for (const component of column.components) {
        const id = component.props?.id;
        if (typeof id !== 'string' || !id) continue;
        (seen.has(id) ? duplicates : seen).add(id);
      }
    }
  }
  if (duplicates.size) {
    console.warn(
      `<form-render> is about to render more than one component with the id "${[...duplicates].join('", "')}". ` +
        'A <Teleport :to="\'#\' + id"> only ever reaches the first element bearing that id, so the others render ' +
        "as permanently empty anchors. Share a teleportAnchor() ref between a field's own breakpoint variants " +
        'only, never between two different fields.',
    );
  }
}

const layoutToRender = computed(() => {
  const breakpoint = getBreakpointName(display);
  // the breakpoint has to reach toJSON as well: it is what row- and column-level breakpoint overrides are
  // resolved against, and getOptionsForBreakpoint only resolves the form-level ones
  const resolved = responsiveLayout.value.getOptionsForBreakpoint(breakpoint).toJSON(breakpoint);
  warnDuplicateIds(resolved);
  return resolved;
});
const componentsWithMe = computed(() => ({ ...props.components, [FormBuilderName]: getCurrentInstance()?.type }));
</script>
