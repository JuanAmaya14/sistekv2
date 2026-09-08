import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import NotificationBell from "../components/NotificationBell";
import { useTheme } from "../context/ThemeContext";

import "../styles.css";
import logo from "../Bienvenido.png";

// Debe coincidir con la política del backend (validatePasswordStrength)
const REGLAS = [
  { texto: "Al menos 8 caracteres", cumple: (p: string) => p.length >= 8 },
  { texto: "Una letra mayúscula", cumple: (p: string) => /[A-Z]/.test(p) },
  { texto: "Una letra minúscula", cumple: (p: string) => /[a-z]/.test(p) },
  { texto: "Un número", cumple: (p: string) => /\d/.test(p) },
];

function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [user, setUser] = useState<any>(null);

  // Perfil
  const [username, setUsername] = useState("");
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // Contraseña
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensajePassword, setMensajePassword] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate("/");
      return;
    }
    const actual = authService.getCurrentUser();
    setUser(actual);
    setUsername(actual?.username ?? "");
  }, [navigate]);

  const logout = () => {
    authService.logout();
    navigate("/");
  };

  const guardarPerfil = async () => {
    setMensajePerfil(null);

    if (username.trim() === user?.username) {
      setMensajePerfil({ tipo: "error", texto: "No hay cambios que guardar" });
      return;
    }

    setGuardandoPerfil(true);
    try {
      const actualizado = await authService.updateProfile(username.trim());
      setUser(actualizado);
      setMensajePerfil({ tipo: "ok", texto: "Perfil actualizado correctamente" });
    } catch (err: any) {
      setMensajePerfil({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPassword = async () => {
    setMensajePassword(null);

    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      setMensajePassword({ tipo: "error", texto: "Todos los campos son obligatorios" });
      return;
    }

    if (passwordNueva !== passwordConfirmar) {
      setMensajePassword({ tipo: "error", texto: "La confirmación no coincide con la nueva contraseña" });
      return;
    }

    if (!REGLAS.every((r) => r.cumple(passwordNueva))) {
      setMensajePassword({ tipo: "error", texto: "La nueva contraseña no cumple los requisitos" });
      return;
    }

    setCambiandoPassword(true);
    try {
      await authService.changePassword(passwordActual, passwordNueva);
      setMensajePassword({ tipo: "ok", texto: "Contraseña actualizada correctamente" });
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
    } catch (err: any) {
      setMensajePassword({ tipo: "error", texto: err.message });
    } finally {
      setCambiandoPassword(false);
    }
  };

  if (!user) return null;

  const colorRol =
    user.role === "administrador" ? "#7c3aed" : user.role === "agente" ? "#2563eb" : "#059669";

  const estiloInput: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: `1px solid ${isDark ? "#475569" : "#d1d5db"}`,
    fontSize: "14px",
    marginTop: "6px",
    boxSizing: "border-box",
  };

  const estiloLabel: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 600,
    color: isDark ? "#94a3b8" : "#475569",
  };

  const estiloBoton = (activo: boolean, color: string): React.CSSProperties => ({
    background: activo ? color : "#94a3b8",
    color: "white",
    padding: "10px 22px",
    border: "none",
    borderRadius: "8px",
    cursor: activo ? "pointer" : "not-allowed",
    fontSize: "14px",
    fontWeight: 700,
    marginTop: "16px",
  });

  const Aviso = ({ mensaje }: { mensaje: { tipo: "ok" | "error"; texto: string } }) => (
    <div
      style={{
        marginTop: "14px",
        padding: "10px 14px",
        borderRadius: "8px",
        fontSize: "13px",
        fontWeight: 600,
        background: mensaje.tipo === "ok" ? "#dcfce7" : "#fee2e2",
        color: mensaje.tipo === "ok" ? "#15803d" : "#b91c1c",
      }}
    >
      {mensaje.tipo === "ok" ? "✅ " : "⚠️ "}
      {mensaje.texto}
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img src={logo} alt="Sistek" />
          <span>SISTEK</span>
        </div>

        <button className="sidebar-nav-btn" onClick={() => navigate("/dashboard")}>🏠 Inicio</button>

        {user.role === "cliente" && (
          <button className="sidebar-nav-btn" onClick={() => navigate("/tickets")}>🎫 Crear Ticket</button>
        )}

        {user.role === "agente" && (
          <button className="sidebar-nav-btn" onClick={() => navigate("/tickets")}>🎫 Mis Tickets</button>
        )}

        {user.role === "administrador" && (
          <>
            <button className="sidebar-nav-btn" onClick={() => navigate("/admin-tickets")}>🎫 Todos los Tickets</button>
            <button className="sidebar-nav-btn" onClick={() => navigate("/reports")}>📊 Reportes</button>
          </>
        )}

        <button className="sidebar-nav-btn sidebar-nav-active" onClick={() => navigate("/configuracion")}>
          ⚙️ Configuración
        </button>

        <button className="sidebar-nav-btn sidebar-theme-btn" onClick={toggleTheme}>
          {isDark ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
        </button>
        <button className="sidebar-logout-btn" onClick={logout}>🚪 Cerrar sesión</button>
      </div>

      {/* CONTENIDO */}
      <div className="main-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "26px" }}>⚙️ Configuración</h1>
            <p style={{ margin: "4px 0 0 0", color: isDark ? "#94a3b8" : "#64748b", fontSize: "14px" }}>
              Administra tu perfil, seguridad y preferencias
            </p>
          </div>
          <NotificationBell />
        </div>

        <div style={{ display: "grid", gap: "20px", maxWidth: "720px" }}>
          {/* ── MI PERFIL ── */}
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: "17px" }}>👤 Mi perfil</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={estiloLabel}>Nombre de usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={estiloInput}
                maxLength={50}
              />
              <span style={{ fontSize: "12px", color: isDark ? "#64748b" : "#94a3b8" }}>
                Entre 3 y 50 caracteres. Solo letras, números, punto, guion y guion bajo.
              </span>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <label style={estiloLabel}>Correo electrónico</label>
                <input type="email" value={user.email} disabled style={{ ...estiloInput, opacity: 0.6 }} />
                <span style={{ fontSize: "12px", color: isDark ? "#64748b" : "#94a3b8" }}>
                  Identifica tu cuenta y no se puede modificar.
                </span>
              </div>

              <div style={{ minWidth: "160px" }}>
                <label style={estiloLabel}>Rol</label>
                <div style={{ marginTop: "6px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      background: colorRol,
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}
                  >
                    {user.role}
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: isDark ? "#64748b" : "#94a3b8" }}>
                  Solo un administrador puede cambiarlo.
                </span>
              </div>
            </div>

            <button
              onClick={guardarPerfil}
              disabled={guardandoPerfil}
              style={estiloBoton(!guardandoPerfil, "linear-gradient(135deg,#2563eb,#1d4ed8)")}
            >
              {guardandoPerfil ? "Guardando..." : "Guardar cambios"}
            </button>

            {mensajePerfil && <Aviso mensaje={mensajePerfil} />}
          </div>

          {/* ── SEGURIDAD ── */}
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: "17px" }}>🔒 Seguridad</h3>
            <p style={{ marginTop: 0, fontSize: "13px", color: isDark ? "#94a3b8" : "#64748b" }}>
              Para cambiar tu contraseña debes confirmar la actual.
            </p>

            <div style={{ marginBottom: "14px" }}>
              <label style={estiloLabel}>Contraseña actual</label>
              <input
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                style={estiloInput}
                autoComplete="current-password"
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={estiloLabel}>Nueva contraseña</label>
              <input
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                style={estiloInput}
                autoComplete="new-password"
              />
            </div>

            {passwordNueva.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px 0" }}>
                {REGLAS.map((regla) => {
                  const ok = regla.cumple(passwordNueva);
                  return (
                    <li
                      key={regla.texto}
                      style={{ fontSize: "12.5px", color: ok ? "#16a34a" : isDark ? "#94a3b8" : "#94a3b8" }}
                    >
                      {ok ? "✓" : "○"} {regla.texto}
                    </li>
                  );
                })}
              </ul>
            )}

            <div>
              <label style={estiloLabel}>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                style={estiloInput}
                autoComplete="new-password"
              />
              {passwordConfirmar.length > 0 && passwordNueva !== passwordConfirmar && (
                <span style={{ fontSize: "12px", color: "#dc2626" }}>Las contraseñas no coinciden</span>
              )}
            </div>

            <button
              onClick={cambiarPassword}
              disabled={cambiandoPassword}
              style={estiloBoton(!cambiandoPassword, "linear-gradient(135deg,#7c3aed,#6366f1)")}
            >
              {cambiandoPassword ? "Actualizando..." : "Cambiar contraseña"}
            </button>

            {mensajePassword && <Aviso mensaje={mensajePassword} />}
          </div>

          {/* ── APARIENCIA ── */}
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: "17px" }}>🎨 Apariencia</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px" }}>Tema de la interfaz</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Actualmente en modo {isDark ? "oscuro" : "claro"}. La preferencia se guarda en este navegador.
                </p>
              </div>
              <button onClick={toggleTheme} style={{ ...estiloBoton(true, isDark ? "#f59e0b" : "#334155"), marginTop: 0, whiteSpace: "nowrap" }}>
                {isDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
              </button>
            </div>
          </div>

          {/* ── SESIÓN ── */}
          <div className="card">
            <h3 style={{ marginTop: 0, fontSize: "17px" }}>🔑 Sesión</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
              <div>
                <strong style={{ fontSize: "14px" }}>Cerrar sesión</strong>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: isDark ? "#94a3b8" : "#64748b" }}>
                  Cierra la sesión en este dispositivo y vuelve al inicio.
                </p>
              </div>
              <button onClick={logout} style={{ ...estiloBoton(true, "linear-gradient(135deg,#ef4444,#dc2626)"), marginTop: 0, whiteSpace: "nowrap" }}>
                🚪 Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
