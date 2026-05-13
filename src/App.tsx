import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DailyView } from './components/daily/DailyView'
import { ExerciseList } from './components/exercises/ExerciseList'
import { RoutineList } from './components/routines/RoutineList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/day" replace />} />
        <Route path="/day" element={<DailyView />} />
        <Route path="/day/:date" element={<DailyView />} />
        <Route path="/exercises" element={<ExerciseList />} />
        <Route path="/routines" element={<RoutineList />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
