// src/contexts/NotificationContext.jsx
import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    // Add your notification logic here
    const addNotification = (notification) => {
        setNotifications(prev => [...prev, notification]);
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}