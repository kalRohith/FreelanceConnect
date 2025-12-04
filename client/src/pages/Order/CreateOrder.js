import React, { useContext } from 'react';
import './CreateOrder.css';
import { useFormik } from 'formik';
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, gql, useQuery } from '@apollo/client';
import UserContext from '../../UserContext';
import ServiceCardHorizontal from '../../components/service-card/ServiceCardHorizontal';

const validate = values => {
    const errors = {};
    if (!values.order_price) {
        errors.order_price = 'Required';
    } else if (values.order_price <= 0) {
        errors.order_price = 'Price must be greater than 0';
    }
    if (!values.order_deadline) {
        errors.order_deadline = 'Required';
    } else {
        const deadlineDate = new Date(values.order_deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate < today) {
            errors.order_deadline = 'Deadline must be in the future';
        }
    }
    return errors;
};

const GET_SERVICE = gql`
    query GetService($serviceId: ID!) {
        service(serviceId: $serviceId) {
            _id
            title
            price
            images
            freelancer {
                _id
                username
                profile_picture
            }
        }
    }
`;

const CREATE_ORDER = gql`
    mutation CreateOrder($serviceId: ID!, $price: Float!, $deadline: String!, $description: String, $freelancerId: ID!, $clientId: ID!) {
        createOrder(order: { service: $serviceId, price: $price, deadline: $deadline, description: $description, freelancer: $freelancerId, client: $clientId }) {
            _id
        }
    }
`;

function CreateOrder(props) {

    const navigate = useNavigate();

    const serviceId = useParams().id;

    const userId = useContext(UserContext).userId;

    const { loading: serviceLoading, error: serviceError, data: serviceData } = useQuery(GET_SERVICE, {
        variables: { serviceId: serviceId },
    });

    const [createOrder, { data: orderData, loading: orderLoading, error: orderError, reset: orderReset }] = useMutation(CREATE_ORDER);

    if (orderData) {
        navigate(`/orders/${orderData.createOrder._id}`);
    }

    const formik = useFormik({
        initialValues: {
            order_price: serviceData ? serviceData.service.price : '',
            order_deadline: '',
            order_description: '',
        },
        validate,
        enableReinitialize: true,
        onSubmit: values => {
            createOrder({ 
                variables: { 
                    serviceId: serviceId, 
                    price: parseFloat(values.order_price), 
                    deadline: values.order_deadline, 
                    description: values.order_description || null,
                    freelancerId: serviceData.service.freelancer._id, 
                    clientId: userId 
                } 
            });
        },
    });

    return (
        <div className='create-order__container col-xs-12 col-sm-12 col-md-8 col-lg-6'>
            <h1>New Order</h1>
            {
                serviceData &&
                <ServiceCardHorizontal service={serviceData.service} />
            }
            <form onSubmit={formik.handleSubmit}>
                <div className='input__container'>
                    <label htmlFor="order_price">Price</label>
                    <input
                        id="order_price"
                        name="order_price"
                        type="number"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.order_price}
                    />
                    {formik.touched.order_price && formik.errors.order_price ? (
                        <p className="info__validation email__validation">{formik.errors.order_price}</p>
                    ) : null}
                </div>
                <div className='input__container'>
                    <label htmlFor="order_deadline">Deadline</label>
                    <input
                        id="order_deadline"
                        name="order_deadline"
                        type="date"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.order_deadline}
                        min={new Date().toISOString().split('T')[0]}
                    />
                    {formik.touched.order_deadline && formik.errors.order_deadline ? (
                        <p className="info__validation email__validation">{formik.errors.order_deadline}</p>
                    ) : null}
                </div>
                <div className='input__container'>
                    <label htmlFor="order_description">Order Description (Optional)</label>
                    <textarea
                        id="order_description"
                        name="order_description"
                        rows="4"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.order_description}
                        placeholder="Describe your requirements, special requests, or any additional details..."
                    />
                </div>
                {orderError && (
                    <p className="info__validation email__validation" style={{ marginBottom: '10px' }}>
                        Error: {orderError.message}
                    </p>
                )}
                {orderLoading ? (
                    <button className='create-order__submit-button' type="submit" disabled>Creating Order...</button>
                ) : (
                    <button className='create-order__submit-button' type="submit">Place Order</button>
                )}
            </form >
        </div >
    )
}

export default CreateOrder;