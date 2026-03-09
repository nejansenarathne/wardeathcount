import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';

import DetailsPage from './DetailsPage';
import { subscribeToLatest, timeAgo } from './firebase';

// ── CasualtyMonitor ───────────────────────────────────────────────────────────
const CasualtyMonitor = () => {
  const navigate = useNavigate();

  // War start timer
  const startDate = new Date('2026-02-28T00:00:00');
  const [elapsed, setElapsed] = useState(new Date() - startDate);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(new Date() - startDate), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (ms) => ({
    days:    Math.floor(ms / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((ms / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((ms / (1000 * 60)) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  });
  const { days, hours, minutes, seconds } = formatTime(elapsed);

  // Firebase live data
  const [warData, setWarData] = useState(null);
  const [fbError, setFbError] = useState(false);

  useEffect(() => {
    const unsub = subscribeToLatest(
      (data) => setWarData(data),
      ()     => setFbError(true)
    );
    return () => unsub();
  }, []);

  const totalDeaths   = warData?.total_killed        ?? 0;
  const totalInjured  = warData?.total_injured       ?? 0;
  const iranKills     = warData?.killed_by_iran      ?? 0;
  const usIsraelKills = warData?.killed_by_us_israel ?? 0;
  const usIsraelInjured = warData?.injured_by_iran ?? 0;
  const iranInjured = warData?.injured_by_us_israel ?? 0;
  const lastUpdated   = warData?.last_updated;
  const imageTimestamp = warData?.image_timestamp;

  const updatedLabel = lastUpdated
    ? `UPDATED ${timeAgo(lastUpdated).toUpperCase()}`
    : warData === null ? "LOADING..." : fbError ? "FIREBASE ERROR" : "WAITING FOR DATA";

  return (
    <div className="monitor-container">
      <div className="top-section">
        <header className="top-pill">
          <span className="live-dot"></span>
          {window.innerWidth < 768
            ? "LIVE · SINCE FEB 28, 2026"
            : "LIVE · OPERATION EPIC FURY · SINCE FEB 28, 2026"}
        </header>
        <h2 className="sub-title">REAL-TIME CASUALTY MONITOR</h2>
        <h1 className="main-title">Conflict Death Count</h1>
        <div className="source-tag">
          SOURCE: <a href={warData?.source_url ?? "https://www.aljazeera.com"} target="_blank" rel="noreferrer">ALJAZEERA</a>
          {" "}— {updatedLabel}
        </div>
      </div>

      <div className="center-section">
        <div className="data-card">
          <div className="casualty-count">
            {totalDeaths > 0 ? totalDeaths.toLocaleString() : "—"}
          </div>
          <div className="injured-box">
            TOTAL INJURED: <span className="injured-val">
              {totalInjured > 0 ? totalInjured.toLocaleString() : "—"}
            </span>
          </div>
          <div className="data-label">TOTAL ESTIMATED FATALITIES</div>

          <div className="timer-row">
            {[{val: days, label: "DAYS"}, {val: hours, label: "HRS"},
              {val: minutes, label: "MIN"}, {val: seconds, label: "SEC"}
            ].map(({ val, label }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <span className="separator">:</span>}
                <div className="time-block">
                  <div className="time-box">{String(val).padStart(2, '0')}</div>
                  <span className="label">{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-wrapper">
        <button className="see-more-btn" onClick={() => navigate('/details')}>
          SEE MORE DETAIL
        </button>
        <div className="bottom-table">
          <div className="stat-col left-border">
            <span className="stat-label">ATTACKS BY IRAN</span>
            <span className="stat-value-blue">
              {iranKills > 0 ? iranKills.toLocaleString() : "—"}
            </span>
            <span className="stat-value-blue-injured">
              {iranInjured > 0 ? iranInjured.toLocaleString() : "—"}
            </span>
          </div>
          <div className="stat-col">
            <span className="stat-label">ATTACKS BY US-ISRAEL</span>
            <span className="stat-value-red">
              {usIsraelKills > 0 ? usIsraelKills.toLocaleString() : "—"}
            </span>
            <span className="stat-value-red-injured">
              {usIsraelInjured > 0 ? usIsraelInjured.toLocaleString() : "—"}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"        element={<CasualtyMonitor />} />
        <Route path="/details" element={<DetailsPage />}     />
      </Routes>
    </Router>
  );
}
