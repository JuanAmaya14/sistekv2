import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles.css";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Si ya hay un usuario logueado, ir al dashboard
    if (authService.isAuthenticated()) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* IZQUIERDA */}
      <div className="left-panel">
        <h1>Bienvenido a Sistek</h1>
        <p>Gestiona tus tickets fácilmente</p>
      </div>

      {/* DERECHA */}
      <div className="right-panel">
        <div className="form-box">
          <h2>Iniciar sesión</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

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

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Cargando..." : "Ingresar"}
          </button>

          <p className="link">
            ¿No tienes cuenta?{" "}
            <span onClick={() => navigate("/register")} style={{color:"#2563eb", cursor:"pointer"}}>
              Regístrate
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}

export default Login;