import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles.css";

function Register() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {

    if (!username || !email || !password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.register(username, email, password, "cliente");
      alert("Registro exitoso");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* IZQUIERDA */}
      <div className="left-panel">
        <h1>Únete a Sistek</h1>
        <p>Crea tu cuenta y gestiona tickets</p>
      </div>

      {/* DERECHA */}
      <div className="right-panel">
        <div className="form-box">

          <h2>Registro</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <input
            placeholder="Nombre de usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
          />

          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />

          <button onClick={handleRegister} disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>

          <p className="link">
            ¿Ya tienes cuenta?{" "}
            <span onClick={() => navigate("/")} style={{color:"#2563eb", cursor:"pointer"}}>
              Inicia sesión
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Register;
