import { DfInputComponentProps, DfInputComponentTag } from '@dynamicforms/vuetify-inputs';

import { ComponentProps } from '../types';

import { ComponentBuilderBase } from './component';

/**
 * The component a field is drawn as. A generated layout - the one `<modal-view>` builds for a form that carries
 * none of its own - draws a field as `df-input` unless it names another tag here. The tags are
 * `@dynamicforms/vuetify-inputs`' own, so the catalogue of what can be drawn stays with the package that owns
 * the components.
 */
declare module '@dynamicforms/vue-forms' {
  interface Extras {
    component?: DfInputComponentTag;
  }
}

export class VuetifyInputsComponentBuilder extends ComponentBuilderBase {
  dfActions(props: Partial<DfInputComponentProps.DfActionsProps>) {
    return this.generic('df-actions', props);
  }

  dfCheckbox(props: Partial<DfInputComponentProps.DfCheckboxProps>) {
    return this.generic('df-checkbox', props);
  }

  dfColor(props: Partial<DfInputComponentProps.DfColorProps>) {
    return this.generic('df-color', props);
  }

  dfDateTime(props: Partial<DfInputComponentProps.DfDateTimeProps>) {
    return this.generic('df-date-time', props);
  }

  dfFile(props: Partial<DfInputComponentProps.DfFileProps>) {
    return this.generic('df-file', props);
  }

  dfInput(props: Partial<DfInputComponentProps.DfInputProps>) {
    return this.generic('df-input', props);
  }

  dfInputHint(props: Partial<DfInputComponentProps.DfInputHintProps>) {
    return this.generic('df-input-hint', props);
  }

  dfLabel(props: Partial<DfInputComponentProps.DfLabelProps>) {
    return this.generic('df-label', props);
  }

  dfRtfEditor(props: Partial<DfInputComponentProps.DfRtfEditorProps>) {
    return this.generic('df-rtf-editor', props);
  }

  dfSelect(props: Partial<DfInputComponentProps.DfSelectProps>) {
    return this.generic('df-select', props);
  }

  dfTextArea(props: Partial<DfInputComponentProps.DfTextAreaProps>) {
    return this.generic('df-text-area', props);
  }

  /**
   * The component a tag names, where the tag is a value rather than something written out - a field stating what
   * it is drawn as. Every `df*` method above states its own tag and does exactly this with it, so a tag that has
   * a method of its own and one the package gains later reach the layout the same way; what a method adds over
   * this is the props type it names.
   */
  byTag(tag: string, props: ComponentProps): this {
    return this.generic(tag, props);
  }
}
