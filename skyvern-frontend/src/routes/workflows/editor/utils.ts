import { WorkflowApiResponse } from "@/routes/workflows/types/workflowTypes";
import {
  isDisplayedInWorkflowEditor,
  WorkflowEditorParameterTypes,
  WorkflowParameterTypes,
  WorkflowParameterValueType,
} from "../types/workflowTypes";
import { ParametersState } from "./types";

const getInitialParameters = (workflow: WorkflowApiResponse) => {
  return workflow.workflow_definition.parameters
    .filter((parameter) => isDisplayedInWorkflowEditor(parameter))
    .map((parameter) => {
      if (parameter.parameter_type === WorkflowParameterTypes.Workflow) {
        if (
          parameter.workflow_parameter_type ===
          WorkflowParameterValueType.CredentialId
        ) {
          return {
            key: parameter.key,
            parameterType: WorkflowEditorParameterTypes.Credential,
            credentialId: parameter.default_value as string,
            description: parameter.description,
          };
        }
        return {
          key: parameter.key,
          parameterType: WorkflowEditorParameterTypes.Workflow,
          dataType: parameter.workflow_parameter_type,
          defaultValue: parameter.default_value,
          description: parameter.description,
        };
      } else if (parameter.parameter_type === WorkflowParameterTypes.Context) {
        return {
          key: parameter.key,
          parameterType: WorkflowEditorParameterTypes.Context,
          sourceParameterKey: parameter.source.key,
          description: parameter.description,
        };
      } else if (
        parameter.parameter_type === WorkflowParameterTypes.Credential
      ) {
        return {
          key: parameter.key,
          parameterType: WorkflowEditorParameterTypes.Credential,
          credentialId: parameter.credential_id,
          description: parameter.description,
        };
      }
      return undefined;
    })
    .filter(Boolean) as ParametersState;
};

export { getInitialParameters };
