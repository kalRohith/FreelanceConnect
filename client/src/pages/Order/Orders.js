import React, { useContext } from 'react';
import './Orders.css';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import Cookies from 'js-cookie';
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

function FreelancerOrders() {

    const navigate = useNavigate();

    const userId = useContext(UserContext).userId

    const { loading: ordersLoading, error: ordersError, data: ordersData } = useQuery(GET_ORDERS_BY_FREELANCER_ID, {
        variables: { userId: userId },
    });

    return (
        <div>
            <h1 className='orders__header__title'>Orders Dashboard</h1>
            {(ordersData && ordersData.ordersByFreelancerId.length > 0) ? (
                <div className="orders-table__wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Service</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Payment Status</th>
                                <th>Date</th>
                                <th>Deadline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                ordersData.ordersByFreelancerId.map(order => (
                                    <tr key={order._id}>
                                        <td>
                                            <Link to={`/orders/${order._id}`} className="orders-table__link">
                                                <div className="orders-table__freelancer-info">
                                                    <img src={order.client.profile_picture ? order.client.profile_picture : defaultImage} alt={order.client.username ? order.client.username : ""} />
                                                    <p>{order.client.username ? order.client.username : ""}</p>
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
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="orders-empty">
                    <p>No orders found. Orders will appear here when clients place orders for your services.</p>
                </div>
            )}
        </div>
    )
}

function ClientOrders() {

    const navigate = useNavigate();

    const userId = useContext(UserContext).userId

    const { loading: ordersLoading, error: ordersError, data: ordersData } = useQuery(GET_ORDERS_BY_CLIENT_ID, {
        variables: { userId: userId },
    });

    return (
        <div>
            <h1 className='orders__header__title'>Orders Dashboard</h1>
            {(ordersData && ordersData.ordersByClientId.length > 0) ? (
                <div className="orders-table__wrapper">
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Freelancer</th>
                                <th>Service</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Payment Status</th>
                                <th>Date</th>
                                <th>Deadline</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                ordersData.ordersByClientId.map(order => (
                                    <tr key={order._id}>
                                        <td>
                                            <Link to={`/orders/${order._id}`} className="orders-table__link">
                                                <div className="orders-table__freelancer-info">
                                                    <img src={order.freelancer.profile_picture ? order.freelancer.profile_picture : defaultImage} alt={order.freelancer.username ? order.freelancer.username : ""} />
                                                    <p>{order.freelancer.username ? order.freelancer.username : ""}</p>
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
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="orders-empty">
                    <p>No orders found. Your orders will appear here once you place them.</p>
                </div>
            )}
        </div>
    )
}


function Orders() {

    const isFreelancer = Cookies.get('isFreelancer');

    return (
        <div className='orders'>
            {isFreelancer === 'true' ? <FreelancerOrders /> : <ClientOrders />}
        </div>
    )
}

export default Orders