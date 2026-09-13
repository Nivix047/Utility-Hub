import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Grid2X2, ShieldCheck } from "lucide-react";
import { apps } from "./registry";
export default function Hub() {
  const [route, setRoute] = useState(location.hash.slice(1));
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const change = () => setRoute(location.hash.slice(1));
    addEventListener("hashchange", change);
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => {
      removeEventListener("hashchange", change);
      clearInterval(timer);
    };
  }, []);
  const app = apps.find((a) => a.id === route);
  const App = app?.component;
  useEffect(() => {
    document.title = app ? `${app.name} · Utility Hub` : "Utility Hub";
    document.getElementById("page-title")?.focus();
  }, [app]);
  return (
    <div className="shell">
      <header className="status">
        <span>
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </header>
      <div className="topbar">
        <a className="brand" href="#">
          <span>
            <Grid2X2 size={20} />
          </span>
          Utility Hub<span className="version">PERSONAL WORKSPACE</span>
        </a>
      </div>
      {App ? (
        <main className="app-page">
          <a className="back" href="#">
            <ArrowLeft size={17} /> Home
          </a>
          <h1 id="page-title" tabIndex={-1}>
            {app.name}
          </h1>
          <Suspense fallback={<p>Opening calculator…</p>}>
            <App />
          </Suspense>
        </main>
      ) : (
        <main className="home">
          <div className="intro">
            <div>
              <p className="eyebrow">YOUR EVERYDAY, SIMPLIFIED</p>
              <h1 id="page-title" tabIndex={-1}>
                A little hub.
                <br />A lot less busywork.
              </h1>
              <p className="subtitle">
                Your useful little apps, together in one place.
                <br />
                Pick a tool and make room for what matters.
              </p>
            </div>
            <div className="date-widget">
              <span>
                {now.toLocaleDateString("en-US", { weekday: "long" })}
              </span>
              <strong>{now.getDate()}</strong>
              <span>
                {now.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <div>
                <span className="sun">✳</span> A fresh start, every day.
              </div>
            </div>
          </div>
          <div className="section-label">
            <h2>
              Your apps <span>{apps.length.toString().padStart(2, "0")}</span>
            </h2>
            <span>Small tools. Big difference.</span>
          </div>
          <div className="app-grid">
            {apps.map((a) => (
              <a className="app-tile" key={a.id} href={`#${a.id}`}>
                <span className="app-icon" aria-hidden="true">
                  <a.icon size={42} strokeWidth={1.5} />
                  <span className="icon-spark">↗</span>
                </span>
                <strong>{a.name}</strong>
                <span>{a.category}</span>
              </a>
            ))}
          </div>
          <div className="feature">
            <div className="feature-symbol">
              <ShieldCheck size={25} />
            </div>
            <div>
              <span className="eyebrow">ONE LESS THING TO DO</span>
              <h3>Renewals, without the extra steps.</h3>
              <p>Compare premiums and create notes in seconds.</p>
            </div>
            <a href="#renewal" aria-label="Open Renewal Calculator">
              <ArrowUpRight size={24} />
            </a>
          </div>
          <div className="page-dot" aria-hidden="true" />
        </main>
      )}
      <footer>
        {!App && <span>Made for your day-to-day.</span>}
        <a href="#">
          <Grid2X2 size={15} /> Home
        </a>
        <span>
          UTILITY HUB <span className="footer-mark">✳</span>
        </span>
      </footer>
    </div>
  );
}
