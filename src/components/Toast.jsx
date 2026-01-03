import React from "react";
import { useNotification } from "../context/NotificationContext";

const Toast = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`toast toast-${notification.type}`}
          onClick={() => removeNotification(notification.id)}
        >
          <div className="toast-content">{notification.message}</div>
          <button className="toast-close">&times;</button>
        </div>
      ))}
    </div>
  );
};

export default Toast;
