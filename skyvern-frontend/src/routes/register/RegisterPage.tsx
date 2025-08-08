import { Link } from "react-router-dom";

function RegisterPage() {
  const portal = import.meta.env.VITE_LICENSE_SERVER_URL;
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 space-y-4 text-center">
        <p>
          Register for Skyvern using the licensing console available at{" "}
          <a
            href={portal}
            className="text-blue-600"
            target="_blank"
            rel="noreferrer"
          >
            {portal}
          </a>
          . After creating and activating a product license key, return here to
          sign in with that key.
        </p>
        <Link to="/login" className="rounded bg-blue-600 px-4 py-2 text-white">
          Go to sign in
        </Link>
      </div>
    </div>
  );
}

export { RegisterPage };
