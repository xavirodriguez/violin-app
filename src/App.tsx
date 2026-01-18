import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react';
import Home from './pages/Home'
import './styles/globals.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Analytics />
    </Router>
  )
}

export default App
