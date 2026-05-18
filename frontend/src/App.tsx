import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import CreateTicket from './pages/CreateTicket';
import AdminTickets from './pages/AdminTickets';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/admin-tickets" element={<AdminTickets />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
