type Props = {
  onSwitchToLogin?: () => void;
};

function RegisterForm({ onSwitchToLogin }: Props) {
  const portal = import.meta.env.VITE_LICENSE_SERVER_URL;
  return (
    <div className="w-96 space-y-4 text-center">
      <p>
        Register for Skyvern using the licensing console available at{" "}
        <a href={portal} className="text-blue-600" target="_blank" rel="noreferrer">
          {portal}
        </a>
        . After creating and activating a product license key, return here to sign in with that key.
      </p>
      {onSwitchToLogin && (
        <button onClick={onSwitchToLogin} className="rounded bg-blue-600 px-4 py-2 text-white">
          Go to sign in
        </button>
      )}
    </div>
  );
}

export { RegisterForm };
