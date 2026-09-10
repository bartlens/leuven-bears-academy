import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Teams } from './pages/Teams'
import { Nieuws } from './pages/Nieuws'
import { NieuwsDetail } from './pages/NieuwsDetail'
import { Events } from './pages/Events'
import { Faq } from './pages/Faq'
import { Lbow } from './pages/Lbow'
import { Info } from './pages/Info'
import { TeamLayout } from './pages/team/TeamLayout'
import { TeamHome } from './pages/team/TeamHome'
import { TeamSpelers } from './pages/team/TeamSpelers'
import { TeamTrainingen } from './pages/team/TeamTrainingen'
import { TeamMatchen } from './pages/team/TeamMatchen'
import { TeamKalender } from './pages/team/TeamKalender'
import { TeamEvenementen } from './pages/team/TeamEvenementen'
import { TeamInfo } from './pages/team/TeamInfo'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/team/:slug" element={<TeamLayout />}>
              <Route index element={<TeamHome />} />
              <Route path="spelers" element={<TeamSpelers />} />
              <Route path="trainingen" element={<TeamTrainingen />} />
              <Route path="matchen" element={<TeamMatchen />} />
              <Route path="kalender" element={<TeamKalender />} />
              <Route path="evenementen" element={<TeamEvenementen />} />
              <Route path="info" element={<TeamInfo />} />
            </Route>
            <Route path="/nieuws" element={<Nieuws />} />
            <Route path="/nieuws/:slug" element={<NieuwsDetail />} />
            <Route path="/events" element={<Events />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/lbow" element={<Lbow />} />
            <Route path="/info" element={<Info />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
