export type AnyJson = Record<string, any> | null | undefined;

export function coalesce<T = any>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v as T;
  }
  return null;
}

export function extractProfileFromResponse(data: AnyJson) {
  if (!data || typeof data !== "object") return null;
  const user = (data as any).user ?? (data as any).account ?? (data as any).profile ?? null;

  const name = coalesce<string>(
    user?.name,
    (data as any).name,
    user?.fullName,
    user?.full_name,
    (data as any).fullName,
    (data as any).full_name,
    user?.displayName,
    (data as any).displayName,
  );

  const email = coalesce<string>(
    user?.email,
    (data as any).email,
    user?.user_email,
    (data as any).user_email,
  );

  const licenseType = coalesce<string>(
    (data as any).licenseType,
    (data as any).license_type,
    (data as any).license?.type,
    (data as any).license?.licenseType,
  );

  const market = coalesce<string>(
    (data as any).market,
    user?.market,
    (data as any).license?.market,
  );

  const plan = coalesce<string>(
    (data as any).plan,
    (data as any).license?.plan,
    (data as any).subscription?.plan,
  );

  if (name || email || licenseType || market || plan) {
    return { name, email, licenseType, market, plan } as {
      name: string | null;
      email: string | null;
      licenseType: string | null;
      market: string | null;
      plan: string | null;
    };
  }
  return null;
}

