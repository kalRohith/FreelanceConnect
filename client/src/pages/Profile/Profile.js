import React, { useContext, useState } from 'react';
import ServiceCard from '../../components/service-card/ServiceCard';
import { gql, useQuery, useMutation } from '@apollo/client';
import Reviews from '../../components/reviews/Reviews';
import Rating from '../../components/rating/Rating';
import './Profile.css';
import { Link } from 'react-router-dom';
import defaultImage from '../../assets/images/default-user-image.png'
import { useParams } from 'react-router-dom';
import Cookies from 'js-cookie';
import LoadingIndicator from '../../components/loading-indicator/LoadingIndicator';
import UserContext from '../../UserContext';

const GET_SERVICES_BY_USER_ID = gql`
    query GetServicesByUserId($userId: ID!) {
        servicesByUserId(userId: $userId) {
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

const GET_USER_BY_ID = gql`
    query GetUserById($userId: ID!) {
        user(userId: $userId) {
            _id
            username
            profile_picture
            bio
            freelance_rating
            client_rating
        }
    }
`;

const DELETE_SERVICE = gql`
    mutation DeleteService($serviceId: ID!) {
        deleteService(serviceId: $serviceId)
    }
`;

function Services(props) {

    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const isCurrentUser = props.isCurrentUser;

    const { loading, error, data, refetch } = useQuery(GET_SERVICES_BY_USER_ID, {
        variables: { userId: props.userId },
    });

    const [deleteService, { loading: deleteLoading }] = useMutation(DELETE_SERVICE, {
        onCompleted: () => {
            refetch();
            setDeleteConfirm(null);
        },
        onError: (error) => {
            alert(`Error deleting service: ${error.message}`);
            setDeleteConfirm(null);
        }
    });

    const handleDelete = (serviceId, serviceTitle) => {
        setDeleteConfirm({ serviceId, serviceTitle });
    };

    const confirmDelete = () => {
        deleteService({
            variables: { serviceId: deleteConfirm.serviceId }
        });
    };

    if (loading) return <LoadingIndicator />;
    if (error) return `Error! ${error.message}`;
    if (data) console.log(data);
    return (
        <>
            <div className="services__grid__wrapper row">
                {
                    isCurrentUser &&
                    <div className="col-xs-12 col-sm-4 col-md-4 col-lg-4">
                        <Link to={`/create-service`}>
                            <div className="service-card add-service-card">
                                <div className='service-card__wrapper'>
                                    <span class="material-symbols-outlined">
                                        add
                                    </span>
                                    <p className='add-service__title'>Add service</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                }
                {data.servicesByUserId.map((service) => (
                    <div key={service._id} className="col-xs-12 col-sm-4 col-md-4 col-lg-4" style={{ position: 'relative' }}>
                        <ServiceCard service={service} />
                        {isCurrentUser && (
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                display: 'flex',
                                gap: '0.5rem',
                                zIndex: 10
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleDelete(service._id, service.title);
                                    }}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                    }}
                                    title="Delete service"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {deleteConfirm && (
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
                        <p>Are you sure you want to delete "{deleteConfirm.serviceTitle}"? This action cannot be undone.</p>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            All images will be permanently deleted from Cloudinary.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteConfirm(null)}
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
                                onClick={confirmDelete}
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
        </>
    );
}

function Profile() {

    const { id } = useParams();

    const userData = useContext(UserContext);

    const isFreelancer = Cookies.get('isFreelancer') === 'true';

    const isCurrentUser = id === userData.userId;

    const { loading, error, data } = useQuery(GET_USER_BY_ID, {
        variables: { userId: id },
    }
    );
    if (loading) return 'Loading...';
    if (error) return `Error! ${error.message}`;
    if (data) console.log(data);

    return (
        <div className="profile__wrapper row">
            <div className="service-freelancer-info__container col-xs-12 col-sm-8 col-md-6 col-lg-3">
                {
                    data.user &&
                    <div className="service-freelancer__container">
                        <div className="service-freelancer__info">
                            <div className="service-freelancer__avatar">
                                <img src={data.user.profile_picture || defaultImage} alt="avatar" />
                            </div>
                        <div className="service-freelancer__personal-info-wrapper">
                            <h3 className="service-freelancer__name">{data.user.username}</h3>
                            {isFreelancer && data.user.freelance_rating > 0 && (
                                <div className="profile-rating-container">
                                    <Rating value={Math.floor(data.user.freelance_rating)} count={0} />
                                    <span className="profile-rating-text">
                                        {data.user.freelance_rating.toFixed(2)} Freelancer Rating
                                    </span>
                                </div>
                            )}
                            {!isFreelancer && data.user.client_rating > 0 && (
                                <div className="profile-rating-container">
                                    <Rating value={Math.floor(data.user.client_rating)} count={0} />
                                    <span className="profile-rating-text">
                                        {data.user.client_rating.toFixed(2)} Client Rating
                                    </span>
                                </div>
                            )}
                            {(!data.user.freelance_rating && !data.user.client_rating) && (
                                <div className="service-freelancer__level">No ratings yet</div>
                            )}
                        </div>
                            {isCurrentUser &&
                                <div className="service-freelancer__edit-profile">
                                    <Link to={`/profile/edit`}>
                                        <span class="material-symbols-outlined">
                                            edit
                                        </span>
                                    </Link>
                                </div>
                            }
                        </div>
                        <div className="service-freelancer__description">{data.user.bio}</div>
                    </div>
                }
                <Reviews userId={id} />
            </div>
            {
                (isFreelancer || !isCurrentUser) &&
                <div className='service__container col-xs-12 col-sm-9 col-md-9 col-lg-9'>
                    <h1 className='service__title'>Services</h1>
                    <Services userId={id} isCurrentUser={isCurrentUser} />
                </div>
            }
        </div>
    );
}

export default Profile;