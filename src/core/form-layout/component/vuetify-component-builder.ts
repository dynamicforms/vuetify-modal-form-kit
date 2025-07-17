import { DfInputComponentProps } from '@dynamicforms/vuetify-inputs';

import { ComponentBuilderBase } from './component';

// eslint-disable-next-line import/prefer-default-export
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

  dfRtfEditor(props: Partial<DfInputComponentProps.DfRtfEditorProps>) {
    return this.generic('df-rtf-editor', props);
  }

  dfSelect(props: Partial<DfInputComponentProps.DfSelectProps>) {
    return this.generic('df-select', props);
  }

  dfTextArea(props: Partial<DfInputComponentProps.DfTextAreaProps>) {
    return this.generic('df-text-area', props);
  }
}
