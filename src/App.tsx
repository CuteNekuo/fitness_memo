import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DailyView } from './components/daily/DailyView'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/day" replace />} />
        <Route path="/day" element={<DailyView />} />
        <Route path="/day/:date" element={<DailyView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
