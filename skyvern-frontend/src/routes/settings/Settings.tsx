import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HiddenCopyableInput } from "@/components/ui/hidden-copyable-input";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/AuthStore";
import { useQuery } from "@tanstack/react-query";
import { getClient } from "@/api/AxiosClient";

type ApiKeysResponse = { api_keys: Array<{ token: string }> };

function Settings() {
  const organizationID = useAuthStore((s) => s.organizationID);
  const { data: apiKeyData } = useQuery<ApiKeysResponse>({
    enabled: !!organizationID,
    queryKey: ["org-api-keys", organizationID],
    queryFn: async () => {
      const client = await getClient(null);
      if (!organizationID) return { api_keys: [] } as ApiKeysResponse;
      const res = await client.get(`/organizations/${organizationID}/apikeys`);
      return res.data as ApiKeysResponse;
    },
  });
  const apiKey = apiKeyData?.api_keys?.[0]?.token ?? "API key not found";

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">Organization</CardTitle>
          <CardDescription>License-bound organization context</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center gap-4">
            <Label className="w-36 whitespace-nowrap">Organization ID</Label>
            <Input value={organizationID ?? "Not signed in"} readOnly />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="border-b-2">
          <CardTitle className="text-lg">API Key</CardTitle>
          <CardDescription>Currently active API key</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <HiddenCopyableInput value={apiKey} />
        </CardContent>
      </Card>
    </div>
  );
}

export { Settings };
