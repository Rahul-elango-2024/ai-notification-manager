const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Initial state & effect
code = code.replace(
  /const \[activePage, setActivePage\] = useState\([\s\S]*?\}, \[location\.pathname\]\);/m,
  `const [activePage, setActivePage] = useState(() => {
    const p = location.pathname.substring(1);
    return p ? p : "overview";
  });

  useEffect(() => {
    const p = location.pathname.substring(1);
    setActivePage(p ? p : "overview");
  }, [location.pathname]);`
);

// 2. handleNavigate
code = code.replace(
  /const handleNavigate = \(pageKey, path\) => \{[\s\S]*?\};\n/m,
  `const handleNavigate = (pageKey, path) => {
    if (path) {
      navigate(path);
    } else {
      navigate(\`/\${pageKey === "overview" ? "" : pageKey}\`);
    }
  };\n`
);

// 3. NavButtons
code = code.replace(/<NavButton\s+active=\{activePage === "overview"\}\s+icon="⌂"\s+label="Overview"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/" icon="⌂" label="Overview" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "kpis"\}\s+icon="◇"\s+label="KPIs"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/kpis" icon="◇" label="KPIs" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "alerts"\}\s+icon="!"\s+label="Alerts"\s+badge=\{activeAlerts\.length\}\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/alerts" icon="!" label="Alerts" badge={activeAlerts.length} onClick={() => openAlertsPage()} />`);
code = code.replace(/<NavButton\s+active=\{activePage === "incidents" \|\| location\.pathname === "\/incidents"\}\s+icon=\{<AlertTriangle[^>]+>\}\s+label="Incidents"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/incidents" icon={<AlertTriangle size={18} style={{ color: "#f97316", display: "inline-block", verticalAlign: "middle" }} />} label="Incidents" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "executive-collaboration"\}\s+icon="👥"\s+label="Executive Collaboration"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/executive-collaboration" icon="👥" label="Executive Collaboration" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "data-sources"\}\s+icon=\{<Database[^>]+>\}\s+label="Data Sources"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/data-sources" icon={<Database size={18} style={{ display: "inline-block", verticalAlign: "middle" }} />} label="Data Sources" />`);
code = code.replace(/<NavButton\s+active=\{[\s\S]*?activePage === "notifications"[\s\S]*?\}\s+icon="✉"\s+label="Notifications"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/notifications" icon="✉" label="Notifications" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "routing"\}\s+icon="⇄"\s+label="Routing"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/routing" icon="⇄" label="Routing" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "users"\}\s+icon="👤"\s+label="Users"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/users" icon="👤" label="Users" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "api-hub"\}\s+icon="🔌"\s+label="API Hub"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/api-hub" icon="🔌" label="API Hub" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "predictive-analytics"\}\s+icon="📈"\s+label="Predictive Analytics"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/predictive-analytics" icon="📈" label="Predictive Analytics" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "simulation-center"\}\s+icon="🕹"\s+label="Simulation Center"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/simulation-center" icon="🕹" label="Simulation Center" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "profile"\}\s+icon="👤"\s+label="Profile"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/profile" icon="👤" label="Profile" />`);
code = code.replace(/<NavButton\s+active=\{activePage === "settings"\}\s+icon="⚙"\s+label="Settings"\s+onClick=\{[^}]+\}\s+\/>/m, `<NavButton to="/settings" icon="⚙" label="Settings" />`);

// For logout, we keep the onClick but don't give it a 'to' prop if we just want it to act as a button
code = code.replace(/<NavButton\s+active=\{false\}\s+icon="⎋"\s+label="Logout"\s+onClick=\{handleLogout\}\s+\/>/m, `<NavButton icon="⎋" label="Logout" onClick={handleLogout} />`);

// 4. NavButton Component
code = code.replace(
  /function NavButton\(\{\s*active,\s*icon,\s*label,\s*badge,\s*onClick,\s*\}\) \{\s*return \(\s*<button[\s\S]*?<\/button>\s*\);\s*\}/m,
  `function NavButton({ to, icon, label, badge, onClick }) {
  if (!to) {
    return (
      <button className="nav-button" onClick={onClick}>
        <span className="nav-icon">{icon}</span>
        <span>{label}</span>
      </button>
    );
  }
  return (
    <NavLink
      to={to}
      end={true}
      className={({ isActive }) => \`nav-button \${isActive ? "active" : ""}\`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </NavLink>
  );
}`
);

fs.writeFileSync('src/App.jsx', code);
console.log('App.jsx successfully patched.');
