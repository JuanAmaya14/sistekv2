import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification } from '../services/notificationService';

const PRIORITY_COLORS: Record<string, string> = {
  Alta: '#ef4444',
  Media: '#f59e0b',
  Baja: '#22c55e',
};

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch {
      // silencioso — el usuario no debe ver errores de polling
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.is_read) {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      }
    } catch {
      // si falla el mark-as-read, igual navegar
    }
    setOpen(false);
    navigate('/tickets');
  };

  const priorityColor = (priority: string) =>
    PRIORITY_COLORS[priority] ?? '#6b7280';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notificaciones"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '6px',
          fontSize: '22px',
          width: 'auto',
          marginTop: 0,
          lineHeight: 1,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              minWidth: '18px',
              height: '18px',
              fontSize: '11px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '40px',
            width: '320px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f3f4f6',
              fontWeight: 'bold',
              fontSize: '14px',
              color: '#1f2937',
            }}
          >
            Notificaciones
            {unreadCount > 0 && (
              <span
                style={{
                  marginLeft: '8px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '11px',
                  padding: '2px 8px',
                }}
              >
                {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              Sin notificaciones
            </div>
          ) : (
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {notifications.map((n) => {
                const color = priorityColor(n.ticket_priority);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      cursor: 'pointer',
                      backgroundColor: n.is_read ? 'white' : '#eff6ff',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = '#f3f4f6')
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = n.is_read
                        ? 'white'
                        : '#eff6ff')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#6b7280',
                        }}
                      >
                        Ticket #{n.ticket_id}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          backgroundColor: color + '20',
                          color: color,
                          textTransform: 'capitalize',
                        }}
                      >
                        {n.ticket_priority}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '13px',
                        color: '#1f2937',
                        fontWeight: n.is_read ? 'normal' : '600',
                      }}
                    >
                      {n.ticket_title}
                    </p>
                    {!n.is_read && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#2563eb',
                          fontWeight: 'bold',
                        }}
                      >
                        ● Nuevo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
