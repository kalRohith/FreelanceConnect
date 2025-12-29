import React from 'react';
import { Link } from 'react-router-dom';
import './Notifications.css';

function Notifications({ notifications }) {
    const unreadCount = notifications?.filter(n => n).length || 0;

    return (
        <div className="notification">
            <Link to="/notifications" className="notification__icon">
                <i className="fa fa-bell"></i>
                {unreadCount > 0 && (
                    <span className="notification__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </Link>
        </div>
    );
}

export default Notifications;