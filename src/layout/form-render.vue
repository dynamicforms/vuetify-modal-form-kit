<!-- FormRenderer.vue -->
<template>
  <div class="form-layout">
    <v-row v-for="(row, rowIndex) in layoutToRender.rows" :key="rowIndex">
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

const responsiveLayout = computed(() =>
  props.layout instanceof FormBuilder ? props.layout : new FormBuilder(props.layout as any),
);
const display = useDisplay();
const layoutToRender = computed(() => {
  const breakpoint = getBreakpointName(display);
  return responsiveLayout.value.getOptionsForBreakpoint(breakpoint).toJSON();
});
const componentsWithMe = computed(() => ({ ...props.components, [FormBuilderName]: getCurrentInstance()?.type }));
</script>
