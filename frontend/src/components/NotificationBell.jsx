import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

// THE FIX: We added the `onOpenTicket` prop here!
export default function NotificationBell({ onOpenTicket }) {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // Wrapped in useCallback to satisfy React's strict dependency linting
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch (err) { 
      console.error("Error fetching notifications"); 
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]); // <-- Now it is safely listed as a dependency

  const handleNotificationClick = async (n) => {
    // 1. Mark as read immediately
    if (!n.isread) {
      try {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, isread: true } : notif));
      } catch (err) {
        console.error("Failed to mark as read");
      }
    }
    
    // 2. THE FIX: Open the specific ticket modal!
    if (n.ticketid && onOpenTicket) {
      onOpenTicket(n.ticketid);
      setIsOpen(false); // Close the dropdown menu
    }
  };

  const unreadCount = notifications.filter(n => !n.isread).length;

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>
        🔔 
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', borderRadius: '50%', padding: '2px 6px', fontSize: 10, color: '#fff', fontWeight: 800 }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="modal-panel" style={{ position: 'absolute', right: 0, top: 40, width: 320, background: '#fff', border: '1px solid var(--border, #e2e8f0)', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 999, maxHeight: 400, overflowY: 'auto' }}>
          
          <div style={{ padding: 15, borderBottom: '1px solid var(--border, #e2e8f0)', fontWeight: 800, fontSize: 14, color: '#0f172a' }}>
            Notifications
          </div>
          
          {notifications.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', fontSize: 13, color: '#64748b', margin: 0 }}>
              No new notifications.
            </p>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => handleNotificationClick(n)} 
                style={{ 
                  padding: 15, 
                  borderBottom: '1px solid #f1f5f9', 
                  background: n.isread ? '#fff' : '#f0f9ff',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {/* THE FIX: Added the Ticket ID to the title so you know what it is! */}
                <p style={{ margin: 0, fontSize: 13, fontWeight: n.isread ? 600 : 800, color: '#0f172a' }}>
                  {n.title} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>(TKT-00{n.ticketid})</span>
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
                  {n.message}
                </p>
                {!n.isread && (
                  <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700, color: '#0284c7' }}>
                    ● Click to view
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}