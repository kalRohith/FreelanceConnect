import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import UserContext from '../../UserContext';
import './NotificationsPage.css';
import { FaBell } from 'react-icons/fa';

const GET_NOTIFICATIONS = gql`
    query GetNotificationsByUserId($userId: ID!) {
        notificationsByUserId(userId: $userId) {
            id
            content
            read
            date
            order {
                _id
            }
        }
    }
`;

const MARK_NOTIFICATION_READ = gql`
    mutation MarkNotificationRead($notificationId: ID!) {
        markNotificationRead(notificationId: $notificationId) {
            id
            read
        }
    }
`;

function NotificationsPage() {
    const userContext = React.useContext(UserContext);

    const { data, loading, error } = useQuery(GET_NOTIFICATIONS, {
        skip: !userContext?.userId,
        variables: { userId: userContext?.userId },
        fetchPolicy: "cache-and-network",
    });

    const notifications = data?.notificationsByUserId || [];

    const navigate = useNavigate();

    const [markRead] = useMutation(MARK_NOTIFICATION_READ, {
        refetchQueries: [{ query: GET_NOTIFICATIONS, variables: { userId: userContext?.userId } }],
    });

    if (loading) {
        return (
            <div className="notifications-page">
                <div className="notifications-page__container">
                    <div className="loading-state">
                        <FaBell className="loading-icon" />
                        <p>Loading notifications...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="notifications-page">
                <div className="notifications-page__container">
                    <div className="error-state">
                        <p>Error loading notifications. Please try again later.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-page">
            <div className="notifications-page__container">
                <div className="notifications-page__header">
                    <div className="header-content">
                        <FaBell className="header-icon" />
                        <h1>Notifications</h1>
                    </div>
                    <p className="header-subtitle">
                        {notifications.length === 0 
                            ? "You don't have any notifications yet"
                            : `${notifications.length === 1 ? '1 notification' : `${notifications.length} notifications`}`
                        }
                    </p>
                </div>

                <div className="notifications-page__body">
                    {notifications.length > 0 ? (
                        <div className="notifications-list">
                            {notifications.map((notification) => {
                                const hasOrder = notification.order && notification.order._id;
                                const content = (
                                    <div className="notification-item__content">
                                        <p className="notification-item__message">
                                            {notification.content}
                                        </p>
                                        <p className="notification-item__time">
                                            {new Date(notification.date).toLocaleString()}
                                        </p>
                                    </div>
                                );

                                const itemKey = notification.id;
                                const markAndNavigate = async (e) => {
                                    try {
                                        await markRead({ variables: { notificationId: notification.id } });
                                    } catch (err) {
                                        // swallow
                                    }
                                };

                                if (hasOrder) {
                                    return (
                                        <div
                                            key={itemKey}
                                            role="button"
                                            tabIndex={0}
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                try {
                                                    await markRead({ variables: { notificationId: notification.id } });
                                                } catch (err) {
                                                    // ignore
                                                }
                                                navigate(`/orders/${notification.order._id}`);
                                            }}
                                            className={`notification-item notification-item--clickable ${notification.read ? 'notification-item--read' : ''}`}
                                        >
                                            {content}
                                        </div>
                                    );
                                }

                                return (
                                    <div key={itemKey} className={`notification-item ${notification.read ? 'notification-item--read' : ''}`} onClick={markAndNavigate}>
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FaBell className="empty-icon" />
                            <p className="empty-message">No notifications yet.</p>
                            <p className="empty-submessage">When you receive notifications, they'll appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default NotificationsPage;

