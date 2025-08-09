import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClient } from "@/api/AxiosClient";
import { useAuthStore } from "@/store/AuthStore";
import { licenseServerUrl } from "@/util/env";
import { generateMachineId } from "@/util/machineFingerprint";

function LoginPage() {
  const [licenseKey, setLicenseKey] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const machineId = generateMachineId();
    const payload = {
      licenseKey,
      machineId,
      productId: 1,
    };
    const { data: licenseData } = await axios.post(
      `${licenseServerUrl}/api/license/validate`,
      payload,
    );
    if (String(licenseData.valid).toLowerCase() !== "true") {
      alert("Invalid license");
      return;
    }
    const client = await getClient(null);
    const { data } = await client.post("/auth/login", {
      license_key: licenseKey,
    });
    setAuth(data.access_token, data.organizationID);
    navigate("/dashboard");
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
        <button type="submit" className="rounded bg-blue-600 p-2 text-white">
          Sign in
        </button>
        <Link to="/register" className="text-center text-sm underline">
          Need a license? Register
        </Link>
      </form>
    </div>
  );
}

export { LoginPage };
