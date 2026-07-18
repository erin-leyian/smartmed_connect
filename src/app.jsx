import { Routes, Route} from 'react-router-dom';
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'


export default function App() {
  return (
    <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
    </>
  )
}