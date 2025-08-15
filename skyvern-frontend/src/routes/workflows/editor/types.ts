import { WorkflowParameterValueType } from "../types/workflowTypes";

export type SkyvernCredential = {
  key: string;
  description?: string | null;
  parameterType: "credential";
  credentialId: string;
};

export function parameterIsSkyvernCredential(
  parameter: CredentialParameterState,
): parameter is SkyvernCredential {
  return "credentialId" in parameter;
}

export type CredentialParameterState = SkyvernCredential;

export type ParametersState = Array<
  | {
      key: string;
      parameterType: "workflow";
      dataType: WorkflowParameterValueType;
      description?: string | null;
      defaultValue: unknown;
    }
  | {
      key: string;
      parameterType: "context";
      sourceParameterKey: string;
      description?: string | null;
    }
  | CredentialParameterState
>;
