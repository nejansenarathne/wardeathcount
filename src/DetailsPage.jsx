import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Tooltip } from 'react-tooltip';
import './DetailsPage.css';

import { subscribeToLatest, formatUpdatedTime, timeAgo } from './firebase';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const DetailsPage = () => {
  const navigate = useNavigate();

  // Live Firebase data
  const [warData,  setWarData]  = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsub = subscribeToLatest((data) => {
      setWarData(data);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, []);

  // Derive display values
  const countries    = warData?.countries             ?? [];
  const allInvolved  = warData?.all_countries_involved ?? [];
  const lastUpdated  = warData?.last_updated;
  const imageTs      = warData?.image_timestamp;

  // Map country name → data for fast lookup
  const countryIndex = Object.fromEntries(
    countries.map(c => [c.name, c])
  );

  const getCountryStatus = (geoName) => {
    const data      = countryIndex[geoName];
    const isInvolved = allInvolved.includes(geoName);
    if (data && data.killed > 0) return { type: 'killed',   data };
    if (isInvolved)              return { type: 'involved', data: null };
    return                              { type: 'none',     data: null };
  };

  return (
    <div className="details-main-container">

      {/* HEADER */}
      <div className="details-header">
        <button className="see-more-btn" onClick={() => navigate('/')}>
          BACK TO HOME
        </button>
        <h1 className="details-title">Global Operational Map</h1>
        <div className="source-tag-detail">
          SOURCE:{" "}
          <a href={warData?.source_url ?? "https://www.aljazeera.com"}
            target="_blank" rel="noreferrer">
            ALJAZEERA
          </a>
          {" "}—{" "}
          {loading
            ? "LOADING..."
            : lastUpdated
              ? `UPDATED ${timeAgo(lastUpdated).toUpperCase()}`
              : "WAITING FOR DATA"}
        </div>
      </div>

      {/* MAP */}
      <div className="map-view-wrapper">
        <div className="map-legend-mobile">
          <div className="legend-item"><span className="dot red"></span> KILLED</div>
          <div className="legend-item"><span className="dot orange"></span> INVOLVED</div>
          <div className="legend-item"><span className="dot grey"></span> NO DATA</div>
        </div>

        <ComposableMap
          projectionConfig={{ scale: 120, center: [0, 0] }}
          className="main-map-svg"
          width={800}
          height={400}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const status = getCountryStatus(geo.properties.name);
                let fillColor = "rgba(255, 255, 255, 0.05)";
                if (status.type === 'killed')   fillColor = "#f85149";
                if (status.type === 'involved') fillColor = "rgba(255, 166, 87, 0.4)";

                const tooltipContent = status.type === 'killed'
                  ? [
                      status.data.name,
                      `Military: ${status.data.military_killed ?? 0}`,
                      `Civilian: ${status.data.civilian_killed ?? 0}`,
                      `Total: ${status.data.killed}`,
                      status.data.killed_by_iran ? 'iran' : 'us',
                    ].join('|')
                  : geo.properties.name;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    data-tooltip-id="map-tooltip"
                    data-tooltip-content={tooltipContent}
                    style={{
                      default: {
                        fill: fillColor, outline: "none",
                        stroke: "rgba(255,255,255,0.1)", strokeWidth: 0.5,
                      },
                      hover: {
                        fill: status.type === 'none'
                          ? "rgba(255,255,255,0.1)"
                          : fillColor,
                        outline: "none", cursor: "default",
                      },
                      pressed: { fill: fillColor, outline: "none", pointerEvents: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

        <Tooltip
          id="map-tooltip"
          className="clean-tooltip"
          render={({ content }) => {
            if (!content) return null;
            const parts = content.split('|');
            if (parts.length === 1) return <div className="t-name-only">{parts[0]}</div>;
            const [name, mil, civ, total, type] = parts;
            return (
              <div className={`vertical-info ${type === 'iran' ? 't-iran' : 't-us'}`}>
                <div className="t-name">{name}</div>
                <div className="t-row">{mil}</div>
                <div className="t-row">{civ}</div>
                <div className="t-total">{total}</div>
              </div>
            );
          }}
        />
      </div>

      {/* TABLE */}
      <div className="details-table-section">
        <div className="centered-table-wrapper">
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px 0',
              fontFamily:'monospace', opacity:0.5, letterSpacing:2 }}>
              LOADING DATA...
            </div>
          ) : countries.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0',
              fontFamily:'monospace', opacity:0.4, letterSpacing:2 }}>
              NO DATA YET — RUN THE SCRAPER FIRST
            </div>
          ) : (
            <table className="impact-table">
              <thead>
                <tr>
                  <th className="align-left">COUNTRY</th>
                  <th className="align-center">MILITARY</th>
                  <th className="align-center">CIVILIAN</th>
                  <th className="align-center">INJURED</th>
                  <th className="align-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {countries.map((c, i) => (
                  <tr key={i} className="table-row-grid">
                    <td className="align-left country-name">{c.name.toUpperCase()}</td>
                    <td className="align-center">{c.military_killed ?? 0}</td>
                    <td className="align-center">{c.civilian_killed ?? 0}</td>
                    <td className="align-center val-injured">
                      {(c.injured ?? 0).toLocaleString()}
                    </td>
                    <td className={`align-right total-val ${c.killed_by_iran ? 'val-iran' : 'val-us'}`}>
                      {(c.killed ?? 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};

export default DetailsPage;
