import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { ticketService } from "../services/ticketService";
import "../styles.css";

function CreateTicket() {

  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Media");
  const [type, setType] = useState("Software");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
    } else {
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
    }
  }, [navigate]);

  const crearTicket = async () => {
    if (!title || !description) {
      setError("Título y descripción son obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await ticketService.createTicket(
        title,
        description,
        priority,
        type
      );

      alert("Ticket creado exitosamente");
      navigate("/tickets");
    } catch (err: any) {
      setError(err.message || "Error al crear ticket");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="main-content">

      <h1>Crear Ticket de Soporte</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="ticket-form">
        <input 
          placeholder="Título" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        
        <textarea 
          placeholder="Descripción" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={loading}
        >
          <option value="Software">Software</option>
          <option value="Hardware">Hardware</option>
          <option value="Red">Red</option>
          <option value="Acceso">Acceso</option>
          <option value="Otro">Otro</option>
        </select>

        <button onClick={crearTicket} disabled={loading}>
          {loading ? "Creando..." : "Crear Ticket"}
        </button>
      </div>

    </div>
  );
}

export default CreateTicket;
