import { useEffect, useRef, useState } from "react";
import { LoginForm } from "@/routes/login/LoginForm";
import { RegisterForm } from "@/routes/register/RegisterForm";

function GradientGrid() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.12)" />
        </pattern>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      <circle cx="25%" cy="15%" r="240" fill="url(#glow)" />
      <circle cx="85%" cy="35%" r="200" fill="url(#glow)" />
      <circle cx="50%" cy="80%" r="260" fill="url(#glow)" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-cyan-400"
    >
      <path d="M11 2l1.5 5.5L18 9l-5.5 1.5L11 16l-1.5-5.5L4 9l5.5-1.5L11 2z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-emerald-400"
    >
      <path d="M12 2l8 4v6c0 5-3.5 9.74-8 10-4.5-.26-8-5-8-10V6l8-4z" />
    </svg>
  );
}

function IconPuzzle() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5 text-violet-400"
    >
      <path d="M10 3a2 2 0 104 0h4v4a2 2 0 100 4v4h-4a2 2 0 10-4 0H6v-4a2 2 0 100-4V3h4z" />
    </svg>
  );
}

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const modalShown = showLogin || showRegister;
  const [modalMounted, setModalMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Handle enter/exit animations
  useEffect(() => {
    if (modalShown) {
      setModalMounted(true);
      // allow next paint to apply transition
      requestAnimationFrame(() => setModalOpen(true));
    } else if (modalMounted) {
      setModalOpen(false);
      const t = setTimeout(() => setModalMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [modalShown]);

  // Focus management + focus trap + Esc to close
  useEffect(() => {
    if (!modalMounted) return;
    const node = panelRef.current;
    if (!node) return;

    // Focus the first focusable element
    const focusableSelector = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const focusables = Array.from(node.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
    );
    if (focusables.length) {
      focusables[0]?.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (!panelRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowLogin(false);
        setShowRegister(false);
        return;
      }
      if (e.key === 'Tab') {
        const els = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusableSelector)).filter(
          (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
        );
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (active === first || !panelRef.current.contains(active)) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [modalMounted]);
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <GradientGrid />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400/10 ring-1 ring-cyan-400/30">
            <span className="text-lg font-bold text-cyan-300">S</span>
          </div>
          <span className="text-lg font-semibold text-slate-200">Skyvern</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#showcase" className="hover:text-white">
            Showcase
          </a>
          <a href="#about" className="hover:text-white">
            About
          </a>
          <button
            onClick={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
            className="rounded-md bg-cyan-500 px-4 py-2 font-medium text-slate-900 hover:bg-cyan-400"
          >
            Login
          </button>
        </nav>
        <button
          onClick={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
          className="md:hidden text-cyan-300"
        >
          Login
        </button>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto mt-8 w-full max-w-7xl px-6 pb-12 pt-10 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <h1 className="text-balance bg-gradient-to-b from-white to-slate-300 bg-clip-text text-4xl font-semibold leading-tight text-transparent md:text-6xl">
              Autonomy for your browser workflows
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300/80">
              Build, run, and scale secure, AI-powered automations on any
              website. Private by default, fast by design.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
                className="rounded-md bg-white px-5 py-3 font-medium text-slate-900 hover:bg-slate-100"
              >
                Get started
              </button>
              <a
                href="#features"
                className="rounded-md border border-slate-700 px-5 py-3 text-slate-300 hover:border-slate-600 hover:text-white"
              >
                Explore features
              </a>
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
                className="rounded-md border border-slate-700 px-5 py-3 text-slate-300 hover:border-slate-600 hover:text-white"
              >
                Register
              </button>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <IconSpark />
                  <span className="text-sm font-medium text-slate-200">Fast setup</span>
                </div>
                <p className="text-sm text-slate-400">Start automating in minutes with modern defaults.</p>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <IconShield />
                  <span className="text-sm font-medium text-slate-200">Private</span>
                </div>
                <p className="text-sm text-slate-400">Your data stays within your environment.</p>
              </div>
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <IconPuzzle />
                  <span className="text-sm font-medium text-slate-200">Composable</span>
                </div>
                <p className="text-sm text-slate-400">Mix blocks to create powerful workflows.</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl bg-cyan-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 shadow-2xl">
              <img
                className="h-full w-full object-cover"
                alt="automation hero"
                src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=1400&q=80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto w-full max-w-7xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: "Visual agent",
              desc: "Reason over the page visually, no brittle selectors.",
              img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
            },
            {
              title: "Workflow blocks",
              desc: "Compose navigation, extraction, code, and API blocks.",
              img: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
            },
            {
              title: "Observability",
              desc: "Replay sessions, inspect artifacts, and track runs.",
              img: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="group overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40"
            >
              <div className="h-44 overflow-hidden">
                <img
                  className="h-full w-full scale-100 object-cover transition-transform duration-500 group-hover:scale-105"
                  src={f.img}
                  alt={f.title}
                />
              </div>
              <div className="space-y-2 p-5">
                <h3 className="text-lg font-semibold text-slate-100">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">Built for real work</h2>
          <p className="mt-2 text-slate-400">A few looks from the field.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["photo-1519389950473-47ba0277781c", "photo-1556157382-97eda2d62296", "photo-1472289065668-ce650ac443d2", "photo-1541560052-77ec1bbc09c3", "photo-1496307042754-b4aa456c4a2d", "photo-1498050108023-c5249f4df085"].map(
            (id) => (
              <div key={id} className="overflow-hidden rounded-xl border border-slate-800/60">
                <img
                  className="h-48 w-full object-cover"
                  alt="showcase"
                  src={`https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`}
                />
              </div>
            ),
          )}
        </div>
      </section>

      <footer id="about" className="relative z-10 border-t border-slate-800/60 bg-slate-950/40">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-slate-400 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <span className="text-sm font-bold text-cyan-300">S</span>
            </div>
            <span>Skyvern</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              className="hover:text-white"
              onClick={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
            >
              Sign in
            </button>
            <a href="https://docs.openalgo.in/" target="_blank" rel="noreferrer" className="hover:text-white">
              Docs
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {modalMounted && (
        <div
          className={
            "fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-200 " +
            (modalOpen ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0")
          }
          role="dialog"
          aria-modal
          onClick={() => {
            // Click outside closes
            setShowLogin(false);
            setShowRegister(false);
          }}
        >
          <div
            className={
              "relative w-full max-w-md rounded-lg border border-slate-700 bg-white p-6 text-slate-900 shadow-2xl transition-all duration-200 " +
              (modalOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-2")
            }
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              aria-label="Close"
              className="absolute right-3 top-3 rounded p-1 text-slate-500 hover:bg-slate-100"
              onClick={() => {
                setShowLogin(false);
                setShowRegister(false);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="mt-2 flex flex-col items-center">
              {showLogin && (
                <LoginForm
                  onSwitchToRegister={() => {
                    setShowLogin(false);
                    setShowRegister(true);
                  }}
                  onClose={() => {
                    setShowLogin(false);
                    setShowRegister(false);
                  }}
                />)
              }
              {showRegister && (
                <RegisterForm
                  onSwitchToLogin={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                  }}
                />)
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { LandingPage };
