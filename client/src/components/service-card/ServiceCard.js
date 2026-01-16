import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './ServiceCard.css'
import Rating from '../rating/Rating'
import defaultImage from '../../assets/images/default-user-image.png'
import UserContext from '../../UserContext'

const ServiceCard = ({ service }) => {
    const userId = useContext(UserContext)?.userId;
    const navigate = useNavigate();
    const isOwner = userId && service.freelancer?._id === userId;

    const handlePlaceOrder = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (userId) {
            navigate(`/create-order/${service._id}`);
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="service-card">
            {/* DEBUG: Show score only if it exists (useful for search results) */}
            {service.recommendationScore && (
                <div className="service-card__score-badge">
                    Match: {service.recommendationScore.toFixed(2)}
                </div>
            )}
            
            <Link to={`/services/${service._id}`} className="service-card__link">
                <div className='service-card__wrapper'>
                    <div className='service-card__body__wrapper'>
                        <div className='service-card__header'>
                            <div className='service-card__header__freelancer-info'>
                                <img 
                                    src={service.freelancer?.profile_picture ? service.freelancer.profile_picture : defaultImage} 
                                    alt={service.freelancer?.username || ""} 
                                />
                                <p>{service.freelancer?.username || "Unknown Freelancer"}</p>
                            </div>
                        </div>
                        <div className='service-card__image'>
                            <img src={service.images?.[0] || ""} alt={service.title} />
                        </div>
                        
                        {/* Rating Component */}
                        <Rating 
                            value={service.rating || 0} 
                            count={service.reviews?.length || 0} 
                        />
                        
                        <h3 className='service-card__title'>
                            {service.title}
                        </h3>
                    </div>
                    <div className='service-card__footer'>
                        <div className='service-card__price__wrapper'>
                            <p>starting at</p>
                            <div className='service-card__price'>
                                ${service.price}
                            </div>
                        </div>
                        {!isOwner && (
                            <button 
                                className='service-card__order-button'
                                onClick={handlePlaceOrder}
                            >
                                Place Order
                            </button>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default ServiceCard;