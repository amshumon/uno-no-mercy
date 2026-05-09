import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Home from './pages/Home';
import Room from './pages/Room';
import GameView from './pages/GameView';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/game/:roomId" element={<GameView />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
