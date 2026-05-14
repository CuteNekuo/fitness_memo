import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DailyView } from './components/daily/DailyView'
import { ExerciseList } from './components/exercises/ExerciseList'
import { RoutineList } from './components/routines/RoutineList'
import { WeekView } from './components/week/WeekView'
import { ExerciseChart } from './components/charts/ExerciseChart'
import { Settings } from './components/settings/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/day" replace />} />
        <Route path="/day" element={<DailyView />} />
        <Route path="/day/:date" element={<DailyView />} />
        <Route path="/week" element={<WeekView />} />
        <Route path="/week/:week" element={<WeekView />} />
        <Route path="/chart" element={<ExerciseChart />} />
        <Route path="/exercises" element={<ExerciseList />} />
        <Route path="/routines" element={<RoutineList />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
