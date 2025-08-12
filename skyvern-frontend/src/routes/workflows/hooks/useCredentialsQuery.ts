import { getClient } from "@/api/AxiosClient";
import { CredentialApiResponse } from "@/api/types";
import { useCredentialGetter } from "@/hooks/useCredentialGetter";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/AuthStore";

type QueryReturnType = Array<CredentialApiResponse>;
type UseQueryOptions = Omit<
  Parameters<typeof useQuery<QueryReturnType>>[0],
  "queryKey" | "queryFn"
>;

type Props = UseQueryOptions;

function useCredentialsQuery(props: Props = {}) {
  const credentialGetter = useCredentialGetter();
  const organizationID = useAuthStore((s) => s.organizationID);

  return useQuery<Array<CredentialApiResponse>>({
    // Include org in the key to avoid cross-license cache bleed
    queryKey: ["credentials", organizationID],
    queryFn: async () => {
      const client = await getClient(credentialGetter);
      const params = new URLSearchParams();
      params.set("page_size", "25");
      return client.get("/credentials", { params }).then((res) => res.data);
    },
    ...props,
  });
}

export { useCredentialsQuery };
