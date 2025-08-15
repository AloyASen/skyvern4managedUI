import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollAreaViewport } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Cross2Icon } from "@radix-ui/react-icons";
import { useState } from "react";
import { CredentialParameterSourceSelector } from "../../components/CredentialParameterSourceSelector";
import { SourceParameterKeySelector } from "../../components/SourceParameterKeySelector";
import {
  WorkflowEditorParameterType,
  WorkflowParameterValueType,
} from "../../types/workflowTypes";
import { WorkflowParameterInput } from "../../WorkflowParameterInput";
import { parameterIsSkyvernCredential, ParametersState } from "../types";
import { getDefaultValueForParameterType } from "../workflowEditorUtils";
// External providers removed; only Skyvern credentials are supported

type Props = {
  type: WorkflowEditorParameterType;
  onClose: () => void;
  onSave: (value: ParametersState[number]) => void;
  initialValues: ParametersState[number];
};

const workflowParameterTypeOptions = [
  { label: "string", value: WorkflowParameterValueType.String },
  { label: "float", value: WorkflowParameterValueType.Float },
  { label: "integer", value: WorkflowParameterValueType.Integer },
  { label: "boolean", value: WorkflowParameterValueType.Boolean },
  { label: "file", value: WorkflowParameterValueType.FileURL },
  { label: "credential", value: WorkflowParameterValueType.CredentialId },
  { label: "JSON", value: WorkflowParameterValueType.JSON },
];

function header(type: WorkflowEditorParameterType) {
  if (type === "workflow") {
    return "Edit Input Parameter";
  }
  if (type === "credential") {
    return "Edit Credential Parameter";
  }
  // External providers removed
  return "Edit Context Parameter";
}

function WorkflowParameterEditPanel({
  type,
  onClose,
  onSave,
  initialValues,
}: Props) {
  const [key, setKey] = useState(initialValues.key);
  const isSkyvernCredential =
    initialValues.parameterType === "credential" &&
    parameterIsSkyvernCredential(initialValues);
  const [credentialId, setCredentialId] = useState(
    isSkyvernCredential ? initialValues.credentialId : "",
  );
  const [description, setDescription] = useState(
    initialValues.description ?? "",
  );
  const [parameterType, setParameterType] =
    useState<WorkflowParameterValueType>(
      initialValues.parameterType === "workflow"
        ? initialValues.dataType
        : "string",
    );

  const [defaultValueState, setDefaultValueState] = useState<{
    hasDefaultValue: boolean;
    defaultValue: unknown;
  }>(
    initialValues.parameterType === "workflow"
      ? {
          hasDefaultValue: initialValues.defaultValue !== null,
          defaultValue: initialValues.defaultValue ?? null,
        }
      : {
          hasDefaultValue: false,
          defaultValue: null,
        },
  );

  const [sourceParameterKey, setSourceParameterKey] = useState<
    string | undefined
  >(
    initialValues.parameterType === "context"
      ? initialValues.sourceParameterKey
      : undefined,
  );

  // External provider fields removed

  return (
    <ScrollArea>
      <ScrollAreaViewport className="max-h-[500px]">
        <div className="space-y-4 p-1">
          <header className="flex items-center justify-between">
            <span>{header(type)}</span>
            <Cross2Icon className="h-6 w-6 cursor-pointer" onClick={onClose} />
          </header>
          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Key</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {type === "workflow" && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Value Type</Label>
                <Select
                  value={parameterType}
                  onValueChange={(value) => {
                    setParameterType(value as WorkflowParameterValueType);
                    setDefaultValueState((state) => {
                      return {
                        ...state,
                        defaultValue: getDefaultValueForParameterType(
                          value as WorkflowParameterValueType,
                        ),
                      };
                    });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {workflowParameterTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={defaultValueState.hasDefaultValue}
                    onCheckedChange={(checked) => {
                      if (!checked) {
                        setDefaultValueState({
                          hasDefaultValue: false,
                          defaultValue: null,
                        });
                        return;
                      }
                      setDefaultValueState({
                        hasDefaultValue: true,
                        defaultValue:
                          getDefaultValueForParameterType(parameterType),
                      });
                    }}
                  />
                  <Label className="text-xs text-slate-300">
                    Use Default Value
                  </Label>
                </div>
                {defaultValueState.hasDefaultValue && (
                  <WorkflowParameterInput
                    onChange={(value) => {
                      if (
                        parameterType === "file_url" &&
                        typeof value === "object" &&
                        value &&
                        "s3uri" in value
                      ) {
                        setDefaultValueState((state) => {
                          return {
                            ...state,
                            defaultValue: value,
                          };
                        });
                        return;
                      }
                      setDefaultValueState((state) => {
                        return {
                          ...state,
                          defaultValue: value,
                        };
                      });
                    }}
                    type={parameterType}
                    value={defaultValueState.defaultValue}
                  />
                )}
              </div>
            </>
          )}
          {type === "credential" && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Credential</Label>
              <CredentialParameterSourceSelector
                value={credentialId}
                onChange={(value) => setCredentialId(value)}
              />
            </div>
          )}
          {type === "context" && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Source Parameter</Label>
              <SourceParameterKeySelector
                value={sourceParameterKey}
                onChange={setSourceParameterKey}
              />
            </div>
          )}
          {/* External provider sections removed */}
          {/* Only Skyvern credential selector is supported */}
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (!key) {
                  toast({
                    variant: "destructive",
                    title: "Failed to save parameter",
                    description: "Key is required",
                  });
                  return;
                }
                if (type === "workflow") {
                  if (
                    parameterType === "json" &&
                    typeof defaultValueState.defaultValue === "string"
                  ) {
                    try {
                      JSON.parse(defaultValueState.defaultValue);
                    } catch (e) {
                      toast({
                        variant: "destructive",
                        title: "Failed to save parameter",
                        description: "Invalid JSON for default value",
                      });
                      return;
                    }
                  }
                  const defaultValue =
                    parameterType === "json" &&
                    typeof defaultValueState.defaultValue === "string"
                      ? JSON.parse(defaultValueState.defaultValue)
                      : defaultValueState.defaultValue;
                  onSave({
                    key,
                    parameterType: "workflow",
                    dataType: parameterType,
                    description,
                    defaultValue: defaultValueState.hasDefaultValue
                      ? defaultValue
                      : null,
                  });
                }
                // Skyvern-only credentials
                if (type === "credential") {
                  if (!credentialId) {
                    toast({
                      variant: "destructive",
                      title: "Failed to save parameter",
                      description: "Credential is required",
                    });
                    return;
                  }
                  onSave({
                    key,
                    parameterType: "credential",
                    credentialId,
                    description,
                  });
                }
                // External providers removed; only Skyvern credential, workflow, and context parameters are supported
                if (type === "context") {
                  if (!sourceParameterKey) {
                    toast({
                      variant: "destructive",
                      title: "Failed to save parameter",
                      description: "Source parameter key is required",
                    });
                    return;
                  }
                  onSave({
                    key,
                    parameterType: "context",
                    sourceParameterKey,
                    description,
                  });
                }
                if (type === "credential") {
                  if (!credentialId) {
                    toast({
                      variant: "destructive",
                      title: "Failed to save parameter",
                      description: "Credential is required",
                    });
                    return;
                  }
                  onSave({
                    key,
                    parameterType: "credential",
                    credentialId,
                    description,
                  });
                }
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </ScrollAreaViewport>
    </ScrollArea>
  );
}

export { WorkflowParameterEditPanel };
