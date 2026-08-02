import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import KeralaMap from './KeralaMap';
import { collectorSocials } from './socials';

interface DistrictForecast {
  district: string;
  today: string;
  tomorrow: string;
  day_after: string;
  day_4: string;
  day_5: string;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const getAlertLabel = (color: string) => {
  switch (color) {
    case 'green': return 'Green';
    case 'yellow': return 'Yellow';
    case 'orange': return 'Orange';
    case 'red': return 'Red';
    default: return 'Unknown';
  }
};

const getAlertInsight = (color: string) => {
  switch (color) {
    case 'green': return 'No Warning: Light to moderate rain (0 - 64.4 mm). Safe for normal activities.';
    case 'yellow': return 'Watch: Isolated heavy rain (64.5 - 115.5 mm). Be updated about weather conditions.';
    case 'orange': return 'Alert: Heavy to very heavy rain (115.6 - 204.4 mm). Be prepared for disruptions.';
    case 'red': return 'Warning: Extremely heavy rain (>204.5 mm). Take action! Follow authority instructions.';
    default: return '';
  }
};

const getHolidayOutlook = (color: string) => {
  switch (color) {
    case 'green': return 'Less probability for a holiday for students.';
    case 'yellow': return 'Low probability, but monitor local announcements.';
    case 'orange': return 'Good to look out for a holiday.';
    case 'red': return 'Almost certain upon trends but not assured, looking will be good.';
    default: return 'No prediction available.';
  }
};

const generateInsights = (data: DistrictForecast[]) => {
  if (!data || data.length === 0) return { insights: ["No data available."], worst: 'green', stats: { red: 0, orange: 0, yellow: 0, green: 0 } };
  
  let todayAlerts = { red: 0, orange: 0, yellow: 0, green: 0 };
  let tomorrowAlerts = { red: 0, orange: 0, yellow: 0, green: 0 };
  let day45Alerts = { red: 0, orange: 0, yellow: 0, green: 0 };
  
  let redDistricts: string[] = [];
  let orangeDistricts: string[] = [];

  data.forEach(d => {
    if (d.today === 'red') { todayAlerts.red++; redDistricts.push(d.district); }
    else if (d.today === 'orange') { todayAlerts.orange++; orangeDistricts.push(d.district); }
    else if (d.today === 'yellow') { todayAlerts.yellow++; }
    else if (d.today === 'green') { todayAlerts.green++; }

    if (d.tomorrow === 'red') tomorrowAlerts.red++;
    else if (d.tomorrow === 'orange') tomorrowAlerts.orange++;
    else if (d.tomorrow === 'yellow') tomorrowAlerts.yellow++;
    else if (d.tomorrow === 'green') tomorrowAlerts.green++;

    if (d.day_4 === 'red' || d.day_5 === 'red') day45Alerts.red++;
    if (d.day_4 === 'orange' || d.day_5 === 'orange') day45Alerts.orange++;
  });

  let insightsList: string[] = [];

  if (todayAlerts.red > 0) {
    insightsList.push(`Critical conditions observed. ${todayAlerts.red} district(s) are on Red Alert today.`);
  } else if (todayAlerts.orange > 0) {
    insightsList.push(`Severe weather expected. ${todayAlerts.orange} district(s) are under Orange Alert today.`);
  } else if (todayAlerts.yellow > 0) {
    insightsList.push(`Moderate to heavy rainfall expected. ${todayAlerts.yellow} district(s) are on Yellow Alert today.`);
  } else {
    insightsList.push(`Generally stable weather across Kerala today. No severe alerts issued.`);
  }
  
  if (redDistricts.length > 0) {
    insightsList.push(`Most affected areas currently include ${redDistricts.slice(0, 3).join(', ')}${redDistricts.length > 3 ? ' and others' : ''}. Flash floods and waterlogging are highly probable in these zones.`);
  } else if (orangeDistricts.length > 0) {
    insightsList.push(`Key areas to watch include ${orangeDistricts.slice(0, 3).join(', ')}${orangeDistricts.length > 3 ? ' and others' : ''}. Standard monsoon precautions apply.`);
  }
  
  const todaySevere = todayAlerts.red + todayAlerts.orange;
  const tomorrowSevere = tomorrowAlerts.red + tomorrowAlerts.orange;
  if (tomorrowSevere > todaySevere) {
    insightsList.push(`Trend Analysis: Weather conditions are expected to worsen tomorrow, with severe alerts increasing from ${todaySevere} to ${tomorrowSevere} districts.`);
  } else if (tomorrowSevere < todaySevere) {
    insightsList.push(`Trend Analysis: Conditions show signs of improvement tomorrow, with severe alerts decreasing from ${todaySevere} to ${tomorrowSevere} districts.`);
  } else if (todaySevere > 0 && tomorrowSevere === todaySevere) {
    insightsList.push(`Trend Analysis: Severe weather is expected to persist into tomorrow with no immediate relief in sight.`);
  }
  
  if (day45Alerts.red > 0 || day45Alerts.orange > 0) {
    insightsList.push(`Extended Outlook: Heavy rainfall will likely continue into the late week.`);
  } else if (todayAlerts.red > 0 || todayAlerts.orange > 0) {
    insightsList.push(`Extended Outlook: Skies are expected to clear up towards the end of the 5-day forecast window.`);
  }

  let worst = 'green';
  if (todayAlerts.red > 0) worst = 'red';
  else if (todayAlerts.orange > 0) worst = 'orange';
  else if (todayAlerts.yellow > 0) worst = 'yellow';
  
  return { insights: insightsList, stats: todayAlerts, worst };
};

function Home({ data, loading, error, pinnedDistrict, tooltipHandlers, fetchRef, theme, toggleTheme }: any) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If a district is pinned and we didn't arrive here via the "Back" button, redirect to it!
    if (pinnedDistrict && !location.state?.fromNavigation) {
      navigate(`/district/${pinnedDistrict}`, { replace: true });
    }
  }, [pinnedDistrict, navigate, location]);

  const sortedData = [...data].sort((a: DistrictForecast, b: DistrictForecast) => {
    if (a.district === pinnedDistrict) return -1;
    if (b.district === pinnedDistrict) return 1;
    return 0;
  });

  return (
    <>
      <div className="header">
        <div>
          <h1>Holiday Radar</h1>
          <p>Real-time district-wise forecast parsed from IMD</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-refresh" onClick={toggleTheme}>
            {theme === 'light' ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
                Dark Mode
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
                Light Mode
              </>
            )}
          </button>
          <button className="btn-refresh" onClick={fetchRef} disabled={loading}>
            <svg className={loading ? 'spin' : ''} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="error-card">
          <h3 style={{ marginBottom: '0.25rem' }}>Error loading forecast</h3>
          <p>{error}</p>
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="loader-container">
          <svg className="spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="0"><circle cx="12" cy="12" r="10" /></svg>
          <p>Fetching latest PDF from IMD...</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          <div className="dashboard-grid">
            {sortedData.map((district) => (
              <Link 
                to={`/district/${district.district}`}
                key={district.district} 
                className="glass-card district-card"
                style={{ textDecoration: 'none' }}
              >
                <div className="district-header">
                  <span className="district-name" style={{ display: 'flex', alignItems: 'center' }}>
                    {pinnedDistrict === district.district && <span className="material-symbols-outlined" style={{color: 'var(--alert-yellow-text)', marginRight: '6px', fontSize: '1.2rem', fontVariationSettings: "'FILL' 1"}}>keep</span>}
                    {district.district}
                  </span>
                </div>
                <div className="forecast-days">
                  <div className="forecast-row">
                    <span className="day-label">Today</span>
                    <span 
                      className={`alert-badge ${district.today}`} 
                      onMouseEnter={(e) => tooltipHandlers.enter(e, district.today)}
                      onMouseMove={tooltipHandlers.move}
                      onMouseLeave={tooltipHandlers.leave}
                    >
                      <span className="alert-dot"></span>
                      {getAlertLabel(district.today)}
                    </span>
                  </div>
                  <div className="forecast-row">
                    <span className="day-label">Tomorrow</span>
                    <span 
                      className={`alert-badge ${district.tomorrow}`} 
                      onMouseEnter={(e) => tooltipHandlers.enter(e, district.tomorrow)}
                      onMouseMove={tooltipHandlers.move}
                      onMouseLeave={tooltipHandlers.leave}
                    >
                      <span className="alert-dot"></span>
                      {getAlertLabel(district.tomorrow)}
                    </span>
                  </div>
                  <div className="forecast-row">
                    <span className="day-label">Day After</span>
                    <span 
                      className={`alert-badge ${district.day_after}`} 
                      onMouseEnter={(e) => tooltipHandlers.enter(e, district.day_after)}
                      onMouseMove={tooltipHandlers.move}
                      onMouseLeave={tooltipHandlers.leave}
                    >
                      <span className="alert-dot"></span>
                      {getAlertLabel(district.day_after)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="statewide-overview" style={{ marginTop: '4rem' }}>
            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--alert-yellow-text)' }}>query_stats</span>
              Statewide Overview
            </h2>
            <div className="insight-layout">
              <div className="insight-map-col">
                <KeralaMap data={data} tooltipHandlers={tooltipHandlers} />
              </div>
              <div className="insight-text-col">
                <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: `1px solid var(--alert-${generateInsights(data).worst}-border, var(--border-light))` }}>
                  
                  {/* Subtle background glow based on the worst alert level */}
                  <div style={{
                    position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%',
                    background: `radial-gradient(circle at top right, var(--alert-${generateInsights(data).worst}-bg, transparent) 0%, transparent 50%)`,
                    opacity: 0.6, pointerEvents: 'none', zIndex: 0
                  }} />

                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.4rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--alert-green-text)', fontSize: '1.6rem' }}>auto_awesome</span>
                      AI Weather Insights
                      <span className="pulse-dot" style={Object.assign({ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block', marginLeft: 'auto' }, { '--pulse-color': `var(--alert-${generateInsights(data).worst}-text)` })}></span>
                    </h3>
                    
                    <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {generateInsights(data).insights.map((insight, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: `var(--alert-${generateInsights(data).worst}-text)`, marginTop: '2px', fontVariationSettings: "'FILL' 1" }}>stop_circle</span>
                          <span style={{ lineHeight: '1.5', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 500 }}>{insight}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '1rem' }}>
                      <div className="glass-card" style={{ padding: '1.25rem 0.5rem', textAlign: 'center', borderRadius: '12px', borderBottom: '4px solid var(--alert-red-text)', background: 'var(--bg-main)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{generateInsights(data).stats.red}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>Red</div>
                      </div>
                      <div className="glass-card" style={{ padding: '1.25rem 0.5rem', textAlign: 'center', borderRadius: '12px', borderBottom: '4px solid var(--alert-orange-text)', background: 'var(--bg-main)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{generateInsights(data).stats.orange}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>Orange</div>
                      </div>
                      <div className="glass-card" style={{ padding: '1.25rem 0.5rem', textAlign: 'center', borderRadius: '12px', borderBottom: '4px solid var(--alert-yellow-text)', background: 'var(--bg-main)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{generateInsights(data).stats.yellow}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>Yellow</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer style={{ marginTop: '4rem', padding: '2rem 0', textAlign: 'center', borderTop: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            <div>Made with <span style={{ color: '#ef4444' }}>❤️</span> by Agnel Francis Olakkengil</div>
            <div style={{ marginTop: '0.75rem' }}>
              <Link to="/about" style={{ color: 'var(--text-main)', textDecoration: 'none', borderBottom: '1px solid var(--text-main)', paddingBottom: '1px' }}>Read the Story behind this project</Link>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}

function AboutPage() {
  const navigate = useNavigate();
  return (
    <div className="about-page-view" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10 }}>
        <button className="btn-back" onClick={() => navigate(-1)} style={{ background: 'transparent' }}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back
        </button>
      </div>

      <section className="about-hero">
        <div className="hero-content-wrapper">
            <div className="about-badge">The Story</div>
            <h1 className="about-hero-title">Predicting <span className="text-gradient">Holidays</span>, Not Just Weather.</h1>
            <p className="about-hero-subtitle">
              Because sometimes the most pressing weather question isn't about survival.
            </p>
          </div>
          
          <div className="scroll-indicator">
            <span className="material-symbols-outlined">keyboard_arrow_down</span>
          </div>
        </section>

        <section className="about-flow" style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '6rem 1.5rem 4rem' }}>
          
          <div className="about-flow-item">
            <div className="about-flow-icon">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className="about-flow-text">
              <h2>The Real Question</h2>
              <p>I previously built <strong><a href="https://agnel-francis.netlify.app/work/aerisiq" target="_blank" rel="noreferrer">AerisIQ</a></strong>, an open-source on-device AI disaster management app. While critical for survival during extreme hazards, the reality is that most students checking the weather only care about one thing: <em>"Are we getting a holiday tomorrow?"</em></p>
            </div>
          </div>

          <div className="about-flow-item reverse">
            <div className="about-flow-icon alert-red">
              <span className="material-symbols-outlined">picture_as_pdf</span>
            </div>
            <div className="about-flow-text">
              <h2>The IMD Bottleneck</h2>
              <p>The India Meteorological Department (IMD) is the official trusted source the government uses to declare leaves. But they publish this vital data buried inside dense, legacy PDF tables. Have you ever tried zooming into a massive grid on your phone during a storm? It's terrible.</p>
            </div>
          </div>

          <div className="about-flow-item">
            <div className="about-flow-icon alert-green">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div className="about-flow-text">
              <h2>Automated Clarity</h2>
              <p>This dashboard is the solution. A backend engine silently downloads the public domain PDF, parses the exact color-coded tables, and a fast React frontend instantly visualizes it. It answers your most important question at a single glance.</p>
            </div>
          </div>

          <div className="about-flow-item reverse">
            <div className="about-flow-icon alert-yellow pulse">
              <span className="material-symbols-outlined">alt_route</span>
            </div>
            <div className="about-flow-text">
              <h2>A Separate Mission</h2>
              <p>To be entirely clear, <strong>this dashboard will not be included in AerisIQ</strong>. AerisIQ is built for serious situational awareness—knowing what to do and exactly how severe the weather is in your area. It is not an app for checking if you have school tomorrow. This dashboard exists separately to answer that specific, everyday question.</p>
            </div>
          </div>

        </section>

        <footer className="about-footer">
          <p>Made with <span style={{ color: '#ef4444' }}>❤️</span> by Agnel Francis Olakkengil</p>
        </footer>
    </div>
  );
}

function DistrictPage({ data, pinnedDistrict, setPinnedDistrict, tooltipHandlers }: any) {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const district = data.find((d: DistrictForecast) => d.district === name);

  if (!district && data.length > 0) {
    return (
      <div className="header">
        <h1>District not found</h1>
        <button className="btn-back" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const isPinned = pinnedDistrict === district?.district;
  const togglePin = () => {
    if (isPinned) {
      setPinnedDistrict(null);
      localStorage.removeItem('pinnedDistrict');
    } else {
      setPinnedDistrict(district?.district || null);
      localStorage.setItem('pinnedDistrict', district?.district || '');
    }
  };

  return (
    <div className="district-page-view">
      <button className="btn-back" onClick={() => navigate('/', { state: { fromNavigation: true } })}>← Back to Dashboard</button>
      
      {district ? (
        <div className="district-page-content">
          <div className="glass-card full-forecast-card">
            <div className="district-page-header">
              <div>
                <h1 className="district-title">{district.district}</h1>
                <p className="district-subtitle">5-Day Rainfall Forecast</p>
              </div>
              <button 
                className={`btn-pin-large ${isPinned ? 'pinned' : ''}`}
                onClick={togglePin}
                title={isPinned ? "Unpin District" : "Pin this District"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', fontVariationSettings: isPinned ? "'FILL' 1" : "'FILL' 0" }}>keep</span>
                {isPinned ? "Pinned" : "Pin District"}
              </button>
            </div>
            
            <div className="forecast-grid-detailed">
              {['today', 'tomorrow', 'day_after', 'day_4', 'day_5'].map((dayKey, idx) => {
                const color = district[dayKey as keyof DistrictForecast];
                const labels = ['Today', 'Tomorrow', 'Day After', 'Day 4', 'Day 5'];
                return (
                  <div className={`forecast-feature-row ${idx === 0 ? 'today' : ''}`} key={dayKey}>
                    <span className="day-label">{labels[idx]}</span>
                    <span 
                      className={`alert-badge ${color}`}
                      onMouseEnter={(e) => tooltipHandlers.enter(e, color)}
                      onMouseMove={tooltipHandlers.move}
                      onMouseLeave={tooltipHandlers.leave}
                    >
                      <span className="alert-dot"></span>
                      {getAlertLabel(color)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="district-map-wrapper">
            <div className="holiday-outlook-section glass-card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>backpack</span>
                  <span>Holiday Outlook</span>
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, paddingLeft: '1.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Prediction for {new Date().getHours() >= 10 ? 'Tomorrow' : 'Today'}
                </div>
              </div>
              <p style={{ marginBottom: '1.5rem', fontWeight: 400, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.6' }}>
                {getHolidayOutlook(new Date().getHours() >= 10 ? district.tomorrow : district.today)}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Official Collector Handles</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {collectorSocials[district.district]?.fb && (
                    <a href={collectorSocials[district.district].fb} target="_blank" rel="noreferrer" className="btn-social fb primary-source" aria-label="Facebook" title="Most updated platform">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    </a>
                  )}
                  {collectorSocials[district.district]?.ig && (
                    <a href={collectorSocials[district.district].ig} target="_blank" rel="noreferrer" className="btn-social ig" aria-label="Instagram">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    </a>
                  )}
                  {collectorSocials[district.district]?.x && (
                    <a href={collectorSocials[district.district].x} target="_blank" rel="noreferrer" className="btn-social x" aria-label="X / Twitter">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <KeralaMap data={data} tooltipHandlers={tooltipHandlers} highlightDistrict={district.district} />
          </div>
        </div>
      ) : (
        <div className="loader-container">
          <svg className="spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="0"><circle cx="12" cy="12" r="10" /></svg>
          <p>Loading...</p>
        </div>
      )}
    </div>
  );
}

function MainApp() {
  const [data, setData] = useState<DistrictForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('appTheme') as 'light' | 'dark') || 'light';
  });
  
  const [pinnedDistrict, setPinnedDistrict] = useState<string | null>(() => {
    return localStorage.getItem('pinnedDistrict') || null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    color: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Fetch from a static JSON file that gets built via python script
      // This allows the app to be hosted statically on Netlify without a backend server
      const response = await fetch('/forecast.json', {
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      let text = await response.text();
      // Strip BOM or any garbage characters before the actual JSON object
      const startIndex = text.indexOf('{');
      if (startIndex !== -1) {
        text = text.substring(startIndex);
      }
      
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON. Response text:", text);
        setError(`Failed to parse JSON. Check console for details. Response started with: ${text.substring(0, 50)}`);
        return;
      }
      
      if (json.status === 'success') {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(`Could not fetch forecast data: ${err.message || err.toString()}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const tooltipHandlers = {
    enter: (e: React.MouseEvent, color: string, prefix?: string) => {
      const insight = getAlertInsight(color);
      const text = prefix ? `${prefix}: ${insight}` : insight;
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        content: text,
        color: color
      });
    },
    move: (e: React.MouseEvent) => {
      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
    },
    leave: () => {
      setTooltip(prev => ({ ...prev, visible: false }));
    }
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home data={data} loading={loading} error={error} pinnedDistrict={pinnedDistrict} tooltipHandlers={tooltipHandlers} fetchRef={fetchData} theme={theme} toggleTheme={toggleTheme} />} />
          <Route path="/district/:name" element={<DistrictPage data={data} pinnedDistrict={pinnedDistrict} setPinnedDistrict={setPinnedDistrict} tooltipHandlers={tooltipHandlers} />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>

        {/* Mouse Tracking Tooltip */}
        <div 
          className={`mouse-tooltip-card ${tooltip.color} ${tooltip.visible ? 'visible' : ''}`}
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.content}
        </div>
      </div>
    </BrowserRouter>
  );
}

export default MainApp;
