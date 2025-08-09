import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClient } from "@/api/AxiosClient";
import { useAuthStore } from "@/store/AuthStore";
import { generateMachineId } from "@/util/machineFingerprint";

function LoginPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const client = await getClient(null);
      const { data } = await client.post("/auth/login", {
        license_key: licenseKey,
        machine_id: generateMachineId(),
      });
      setAuth(data.access_token, data.organizationID);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? err?.message ?? "Login failed";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
        <input
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
          placeholder="License Key"
          className="rounded p-2 text-black"
        />
        {error && (
          <p className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={submitting}
          type="submit"
          className="flex items-center justify-center gap-2 rounded bg-blue-600 p-2 text-white disabled:opacity-50"
          aria-busy={submitting}
        >
          {submitting && (
            <svg
              className="h-4 w-4 animate-spin text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          )}
          {submitting ? "Signing in..." : "Sign in"}
        </button>
        <Link to="/register" className="text-center text-sm underline">
          Need a license? Register
        </Link>
      </form>
    </div>
  );
}

export { LoginPage };
