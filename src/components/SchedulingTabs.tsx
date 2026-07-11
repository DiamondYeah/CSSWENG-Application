import { NavLink } from "react-router-dom";
import "./SchedulingTabs.css";

// Tab definitions — add/remove entries here to change what shows up
const TABS = [
  { label: "Queue", path: "/queue" },
  { label: "Create Post", path: "/create-post" },
  { label: "Accounts", path: "/accounts" },
  { label: "Calendar", path: "/calendar" },
  { label: "Category", path: "/category" },
  { label: "Timeslots", path: "/timeslots" },
];

function SchedulingTabs() {
  return (
    <div className="scheduling-tabs">
      <NavLink to="/calendar" className="scheduling-tabs__brand">
        AgilaPost
      </NavLink>
      <div className="scheduling-tabs__links">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `tab${isActive ? " tab--active" : ""}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default SchedulingTabs;