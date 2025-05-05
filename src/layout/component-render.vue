<template>
  <!-- If the component is found in the provided component list -->
  <component :is="resolvedComponent" v-if="resolvedComponent" v-bind="cProps">{{ cBody }}</component>

  <!-- if component is a nested form-builder -->
  <form-renderer v-else-if="isFormBuilder" :layout="cProps" :components="components"/>

  <!-- try a globally registered component -->
  <component :is="stringComponentName" v-else v-bind="cProps">{{ cBody }}</component>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue';

import { FormBuilderBodyProp, FormBuilderName } from '../core/form-layout/types';

interface ComponentRenderProps {
  name: string | symbol;
  props?: Record<string | symbol, any>;
  components?: Record<string | symbol, any>;
}

const props = withDefaults(defineProps<ComponentRenderProps>(), { props: () => ({}), components: () => ({}) });

const stringComponentName = computed(() => {
  const uname = <symbol | string> props.name;
  return typeof uname === 'symbol' ? uname.description || 'SymbolComponent' : uname;
});
const cProps = computed(() => props.props);
const cBody = computed(() => cProps.value?.[FormBuilderBodyProp]);
const resolvedComponent = computed(() => props.components[props.name] || null);

const FormRenderer = unref(props.components)[FormBuilderName];
const isFormBuilder = computed(() => props.name === FormBuilderName);
</script>
