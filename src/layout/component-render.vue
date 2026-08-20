<template>
  <!-- if component is a nested form-builder: the renderer registers itself in the component map under
       FormBuilderName, so this has to be settled before the map is consulted -->
  <form-renderer v-if="isFormBuilder && FormRenderer" :layout="nestedLayout" :components="components" />

  <!-- If the component is found in the provided component list -->
  <component :is="resolvedComponent" v-else-if="resolvedComponent" v-bind="cProps">{{ cBody }}</component>

  <!-- try a globally registered component -->
  <component :is="stringComponentName" v-else v-bind="cProps">{{ cBody }}</component>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { FormBuilderBodyProp, FormBuilderName, FormJSONResponsive } from '../core/form-layout/types';

interface ComponentRenderProps {
  name: string | symbol;
  props?: Record<string | symbol, any>;
  components?: Record<string | symbol, any>;
}

const props = withDefaults(defineProps<ComponentRenderProps>(), { props: () => ({}), components: () => ({}) });

const stringComponentName = computed(() => {
  const uname = <symbol | string>props.name;
  return typeof uname === 'symbol' ? uname.description || 'SymbolComponent' : uname;
});
const cProps = computed(() => props.props);
const cBody = computed(() => cProps.value?.[FormBuilderBodyProp]);
const resolvedComponent = computed(() => props.components[props.name] || null);

// a computed, not a read at setup: <component-render> is public and can be handed a `components` map that gains
// the renderer later, and a map read once would leave the nested form rendering `undefined`
const FormRenderer = computed(() => props.components[FormBuilderName]);
const isFormBuilder = computed(() => props.name === FormBuilderName);
// a nested form arrives as the layout of a form of its own, on the `layout` prop rather than spread as attrs
const nestedLayout = computed(() => <FormJSONResponsive>(<unknown>cProps.value));
</script>
