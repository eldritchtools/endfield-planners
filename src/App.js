import './App.css';
import { useEffect, useState } from 'react';

import { ProfileProvider, Layout, useBreakpoint } from '@eldritchtools/shared-components';
import { HashRouter, Link, Routes, Route } from 'react-router-dom';
import migrateProfile from './migrateProfile';

import HomeTab from './tabs/HomeTab';
import DijiangPlannerTab from './tabs/dijiang-planner/DijiangPlannerTab';
import PullCalculatorTab from './tabs/pull-calculator/PullCalculatorTab';
import OperatorInteractionsMapTab from './tabs/operator-interactions-map/OperatorInteractionsMapTab';
import FactoryCalculatorTab from './tabs/factory-calculator/FactoryCalculatorTab';
import EssenceFarmingSolverTab from './tabs/essence-farming-solver/EssenceFarmingSolver';
import ProfilesTab from './tabs/profiles/ProfilesTab';
import { DataProvider, getMeta } from './DataProvider';
import { Tooltip } from 'react-tooltip';
import { tooltipStyle } from './styles';

const description = <span>
  Endfield Planners is a free fan-made collection of tools to help players with their gameplay in Arknights: Endfield.
</span>;

function SidebarLink({ href, className, style, onClick, children }) {
  return <Link className={className} style={{ ...style, textAlign: "start" }} to={href} onClick={onClick}>{children}</Link>;
}

const paths = [
  { path: "/dijiang-planner", title: "Dijiang Planner" },
  { path: "/pull-calculator", title: "Pull Calculator" },
  { path: "/operator-interactions-map", title: "Operator Interactions Map" },
  { path: "/essence-farming-solver", title: "Essence Farming Solver"},
  { path: "/factory-calculator", title: "Factory Calculator" },
  { path: "/profiles", title: "Profiles" }
]

function App() {
  const [lastUpdated, setLastUpdated] = useState(process.env.REACT_APP_LAST_UPDATED);
  const { isDesktop } = useBreakpoint();

  useEffect(() => {
    const setup = async () => {
      const meta = await getMeta();
      setLastUpdated(p => p > meta.datetime ? p : meta.datetime);
    }

    setup();
  }, []);

  return <ProfileProvider dbName={"endfield-planners"} migrateProfile={migrateProfile}>
    <DataProvider >
      <div className="App">
        <HashRouter>
          <Layout
            title={"Endfield Planners"}
            lastUpdated={lastUpdated}
            linkSet={"endfield"}
            description={description}
            gameName={"Arknights: Endfield"}
            developerName={"Hypergryph"}
            githubLink={"https://github.com/eldritchtools/endfield-planners"}
            paths={paths}
            LinkComponent={SidebarLink}
          >
            <div className="App-content">
              <div style={{ width: isDesktop ? "95%" : "100%" }}>
                <Routes>
                  <Route path="/" element={<HomeTab />} />
                  <Route path="/dijiang-planner" element={<DijiangPlannerTab />} />
                  <Route path="/pull-calculator" element={<PullCalculatorTab />} />
                  <Route path="/operator-interactions-map" element={<OperatorInteractionsMapTab />} />
                  <Route path="/factory-calculator" element={<FactoryCalculatorTab />} />
                  <Route path="/essence-farming-solver" element={<EssenceFarmingSolverTab />} />
                  <Route path="/profiles" element={<ProfilesTab />} />
                </Routes>
              </div>

              <Tooltip id={"genericTooltip"} render={({ content }) => <div style={{ whiteSpace: "pre-wrap" }}>{content}</div>} style={tooltipStyle} />
            </div>
          </Layout>
        </HashRouter>
      </div>
    </DataProvider>
  </ProfileProvider>;
}

export default App;