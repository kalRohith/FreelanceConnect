import React, { useState } from 'react';
import './Service.css';
import Rating from '../../components/rating/Rating';
import ImageCarousel from '../../components/carousel/ImageCarousel';
import Reviews from '../../components/reviews/Reviews';
import { NavLink, useParams, useNavigate } from 'react-router-dom';
import LoadingIndicator from '../../components/loading-indicator/LoadingIndicator';
import { useQuery, gql, useMutation } from '@apollo/client';
import defaultImage from '../../assets/images/default-user-image.png';
import { useContext } from 'react';
import UserContext from '../../UserContext';
import Cookies from 'js-cookie';

const GET_service_BY_ID = gql`
    query GetServiceById($serviceId: ID!) {
        service(serviceId: $serviceId) {
            _id
            title
            description
            price
            images
            rating
            freelancer {
                _id
                username
                profile_picture
                bio
            }
            reviews {
                _id
                rating
                content
                reviewer {
                    _id
                    username
                    profile_picture
                }
            }
        }
    }
`;

const DELETE_SERVICE = gql`
    mutation DeleteService($serviceId: ID!) {
        deleteService(serviceId: $serviceId)
    }
`;

function Service() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const userId = useContext(UserContext).userId;
    const isFreelancer = Cookies.get('isFreelancer');

    const { loading, error, data } = useQuery(GET_service_BY_ID, {
        variables: { serviceId: id },
    });

    const [deleteService, { loading: deleteLoading }] = useMutation(DELETE_SERVICE, {
        onCompleted: () => {
            // Redirect to user's profile after successful deletion
            navigate(`/user/${userId}`);
        },
        onError: (error) => {
            alert(`Error deleting service: ${error.message}`);
            setShowDeleteConfirm(false);
        }
    });

    const handleDelete = () => {
        deleteService({
            variables: { serviceId: id }
        });
    };

    if (loading) return <LoadingIndicator />;
    if (error) return `Error! ${error.message}`;
    if (data) console.log(data);

    const isOwner = userId === data.service.freelancer._id;

    return (
        <div className="service__wrapper row">
            <div className='service__container col-xs-12 col-sm-12 col-md-9 col-lg-9'>
                <div className="service-info__container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 className='service-title'>
                            {data.service.title}
                        </h1>
                        {isOwner && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Delete Service
                                </button>
                            </div>
                        )}
                    </div>
                    {showDeleteConfirm && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            zIndex: 1000
                        }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '2rem',
                                borderRadius: '8px',
                                maxWidth: '400px',
                                width: '90%'
                            }}>
                                <h2 style={{ marginTop: 0 }}>Confirm Deletion</h2>
                                <p>Are you sure you want to delete "{data.service.title}"? This action cannot be undone.</p>
                                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                                    All images will be permanently deleted from Cloudinary.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={deleteLoading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: deleteLoading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleteLoading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: deleteLoading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {deleteLoading ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <Rating value={
                        data.service.rating
                    } count={
                        data.service.reviews.length
                    } />
                    <div className="service-image__carousel">
                        <ImageCarousel slidesToShow={1} slidesToScroll={1} images={
                            data.service.images
                        } />
                    </div>
                    <div className="service-info__description">
                        {data.service.description}
                    </div>
                </div>
                <Reviews serviceId={
                    data.service._id
                } />
            </div>
            <div className="service-freelancer__container col-xs-12 col-sm-12 col-md-3 col-lg-3">
                <NavLink to={`/user/${data.service.freelancer._id}`} className="service-freelancer__link">
                    <div className="service-freelancer__info">
                        <div className="service-freelancer__avatar">
                            <img src={
                                data.service.freelancer.profile_picture ? data.service.freelancer.profile_picture : defaultImage
                            } alt="avatar" />
                        </div>
                        <div className="service-freelancer__personal-info-wrapper">
                            <h3 className="service-freelancer__name">{
                                data.service.freelancer.username
                            }</h3>
                            <div className="service-freelancer__level">Noob</div>
                        </div>
                    </div>
                </NavLink>
                <div className="service-freelancer__description">
                    {
                        data.service.freelancer.bio
                    }
                </div>
                {
                    userId && userId !== data.service.freelancer._id ? (
                        <NavLink to={`/create-order/${data.service._id}`}>
                            <button className="service-freelancer__hire-button">Place Order</button>
                        </NavLink>
                    ) : null
                }
            </div>
        </div>
    )
}

export default Service;