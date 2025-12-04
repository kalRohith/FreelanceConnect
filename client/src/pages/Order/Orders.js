import React, { useContext } from 'react';
import './Orders.css';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import defaultImage from '../../assets/images/default-user-image.png';
import UserContext from '../../UserContext';
import { formatDate } from '../../utils/FormatUtils';

const GET_ORDERS_BY_CLIENT_ID = gql`
    query getOrdersByClientId($userId: ID!) {
        ordersByClientId(userId: $userId) {
            _id
            service {
                title
            }
            freelancer {
                username
                profile_picture
            }
            status
            price
            date
            deadline
            transaction {
                _id
                status
                type
            }
        }
    }
`;

const GET_ORDERS_BY_FREELANCER_ID = gql`
    query getOrdersByFreelancerId($userId: ID!) {
        ordersByFreelancerId(userId: $userId) {
            _id
            service {
                title
            }
            client {
                username
                profile_picture
            }
            status
            price
            date
            deadline
            transaction {
                _id
                status
                type
            }
        }
    }
`;

function Orders() {
    const userId = useContext(UserContext).userId;

    const { data: clientData } = useQuery(GET_ORDERS_BY_CLIENT_ID, {
        variables: { userId },
    });

    const { data: freelancerData } = useQuery(GET_ORDERS_BY_FREELANCER_ID, {
        variables: { userId },
    });

    const clientOrders = clientData?.ordersByClientId || [];
    const freelancerOrders = freelancerData?.ordersByFreelancerId || [];

    const allOrders = [
        ...clientOrders.map(order => ({
            ...order,
            role: 'Client',
            counterparty: order.freelancer,
        })),
        ...freelancerOrders.map(order => ({
            ...order,
            role: 'Freelancer',
            counterparty: order.client,
        })),
    ].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className='orders'>
            <h1 className='orders__header__title'>Orders Dashboard</h1>
            {allOrders.length > 0 ? (
                <div className="orders-table__wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Your Role</th>
                                <th>Counterparty</th>
                                <th>Service</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Payment Status</th>
                                <th>Date</th>
                                <th>Deadline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allOrders.map(order => (
                                <tr key={order._id}>
                                    <td>{order.role}</td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            <div className="orders-table__freelancer-info">
                                                <img
                                                    src={order.counterparty.profile_picture || defaultImage}
                                                    alt={order.counterparty.username || ''}
                                                />
                                                <p>{order.counterparty.username || ''}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            <div>{order.service.title}</div>
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            ${order.price}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            <span className={`order-status order-status--${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            <span className={`payment-status payment-status--${order.transaction?.status?.toLowerCase() || 'pending'}`}>
                                                {order.transaction?.status || 'PENDING'}
                                            </span>
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            {order.date ? formatDate(new Date(order.date)) : 'N/A'}
                                        </Link>
                                    </td>
                                    <td>
                                        <Link to={`/orders/${order._id}`} className="orders-table__link">
                                            {order.deadline ? formatDate(new Date(order.deadline)) : 'N/A'}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="orders-empty">
                    <p>No orders found. Orders where you are the client or freelancer will appear here.</p>
                </div>
            )}
        </div>
    );
}

export default Orders