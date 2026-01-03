import React, { useContext, useState } from 'react';
import './CreateOrder.css';
import { useFormik } from 'formik';
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, gql, useQuery } from '@apollo/client';
import UserContext from '../../UserContext';
import ServiceCardHorizontal from '../../components/service-card/ServiceCardHorizontal';
import PaymentForm from '../../components/payment/PaymentForm';

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

const INITIATE_PAYMENT = gql`
    mutation InitiatePayment($orderId: ID!, $paymentMethod: PaymentMethodInput!) {
        initiatePayment(orderId: $orderId, paymentMethod: $paymentMethod) {
            success
            message
            order {
                _id
                status
            }
        }
    }
`;

function CreateOrder(props) {

    const navigate = useNavigate();

    const serviceId = useParams().id;

    const userId = useContext(UserContext).userId;

    const [showPayment, setShowPayment] = useState(false);
    const [createdOrderId, setCreatedOrderId] = useState(null);

    const { loading: serviceLoading, error: serviceError, data: serviceData } = useQuery(GET_SERVICE, {
        variables: { serviceId: serviceId },
    });

    const [createOrder, { data: orderData, loading: orderLoading, error: orderError, reset: orderReset }] = useMutation(CREATE_ORDER);
    const [initiatePayment, { loading: paymentLoading, error: paymentError }] = useMutation(INITIATE_PAYMENT);

    // When order is created, show payment form
    React.useEffect(() => {
        if (orderData && orderData.createOrder) {
            setCreatedOrderId(orderData.createOrder._id);
            setShowPayment(true);
        }
    }, [orderData]);

    // When payment is successful, navigate to order page
    React.useEffect(() => {
        if (createdOrderId && !paymentLoading && !paymentError) {
            // Payment success will be handled in handlePaymentSubmit
        }
    }, [createdOrderId, paymentLoading, paymentError]);

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

    const handlePaymentSubmit = async (paymentMethod) => {
        if (!createdOrderId) return;

        try {
            const result = await initiatePayment({
                variables: {
                    orderId: createdOrderId,
                    paymentMethod: paymentMethod
                }
            });

            if (result.data?.initiatePayment?.success) {
                navigate(`/orders/${createdOrderId}`);
            } else {
                alert(result.data?.initiatePayment?.message || 'Payment failed');
            }
        } catch (err) {
            console.error('Payment error:', err);
            alert(err.message || 'Payment processing failed. Please try again.');
        }
    };

    const handlePaymentCancel = () => {
        if (window.confirm('Are you sure you want to cancel? The order will be created but payment will be pending.')) {
            navigate(`/orders/${createdOrderId}`);
        }
    };

    // Show payment form if order is created
    if (showPayment && createdOrderId && serviceData) {
        return (
            <div className='create-order__container col-xs-12 col-sm-12 col-md-8 col-lg-6'>
                <h1>Complete Payment</h1>
                <div style={{ marginBottom: '20px', padding: '16px', background: '#e3f2fd', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                        <strong>Order Created:</strong> Order #{createdOrderId.slice(-6)} has been created. 
                        Please complete the payment to proceed. Funds will be held in escrow until order completion.
                    </p>
                </div>
                <PaymentForm
                    amount={parseFloat(formik.values.order_price)}
                    onSubmit={handlePaymentSubmit}
                    onCancel={handlePaymentCancel}
                    loading={paymentLoading}
                />
                {paymentError && (
                    <div style={{ marginTop: '16px', padding: '12px', background: '#ffebee', borderRadius: '8px', color: '#c62828' }}>
                        {paymentError.message}
                    </div>
                )}
            </div>
        );
    }

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