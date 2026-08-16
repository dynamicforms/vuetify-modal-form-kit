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

import { FormBuilder, FormBuilderName, FormJSONResponsive } from '../core/form-layout';

import ComponentRenderer from './component-render.vue';

interface FormRenderProps {
  layout: FormBuilder | FormJSONResponsive;
  components?: Record<string | symbol, any>;
}

const props = withDefaults(defineProps<FormRenderProps>(), { components: () => ({}) });

const responsiveLayout = computed(() => FormBuilder.fromJSON(props.layout));
const display = useDisplay();
const layoutToRender = computed(() => {
  const breakpoint = getBreakpointName(display);
  // the breakpoint has to reach toJSON as well: it is what row- and column-level breakpoint overrides are
  // resolved against, and getOptionsForBreakpoint only resolves the form-level ones
  return responsiveLayout.value.getOptionsForBreakpoint(breakpoint).toJSON(breakpoint);
});
const componentsWithMe = computed(() => ({ ...props.components, [FormBuilderName]: getCurrentInstance()?.type }));
</script>
