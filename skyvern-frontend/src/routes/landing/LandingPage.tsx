import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between p-4 shadow">
        <h1 className="text-xl font-bold">Skyvern</h1>
        <Link to="/login" className="text-blue-600">
          Login
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-semibold">
            Automation for Professionals
          </h2>
          <p className="text-gray-600">
            Manage workflows securely in your private environment.
          </p>
        </div>
      </main>
    </div>
  );
};

export { LandingPage };
