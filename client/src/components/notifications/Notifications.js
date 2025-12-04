import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Notifications.css';

function Notifications({ notifications }) {
    const [show, setShow] = useState(false);

    const showNotifications = () => setShow(!show);

    return (
        <div className="notification">
            <div className="notification__icon" onClick={showNotifications}>
                {
                    show ? (
                        <i className="fa fa-bell activated"></i>
                    ) : <i className="fa fa-bell"></i>
                }
            </div>
            {show && (
                <div className="notification__wrapper">
                    <div className="notification__header">
                        <h3>Notifications</h3>
                        <div className="notification__header__actions">
                        </div>
                    </div>
                    <div className="notification__body">
                        {notifications && notifications.length > 0 ? (
                            notifications.map((notification) => {
                                const hasOrder = notification.order && notification.order._id;
                                const content = (
                                    <div className="notification__body__item__content">
                                        <p className="notification__body__item__content__message">
                                            {notification.content}
                                        </p>
                                        <p className="notification__body__item__content__time">
                                            {new Date(notification.date).toLocaleString()}
                                        </p>
                                    </div>
                                );

                                if (hasOrder) {
                                    return (
                                        <Link
                                            key={notification.id}
                                            to={`/orders/${notification.order._id}`}
                                            className="notification__body__item"
                                        >
                                            {content}
                                        </Link>
                                    );
                                }

                                return (
                                    <div key={notification.id} className="notification__body__item">
                                        {content}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="notification__body__item">
                                <div className="notification__body__item__content">
                                    <p className="notification__body__item__content__message">
                                        No notifications yet.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Notifications;