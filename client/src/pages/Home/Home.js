import React from 'react';
import Categories from '../../components/categories/Categories';
import { gql, useQuery } from '@apollo/client';
import LoadingIndicator from '../../components/loading-indicator/LoadingIndicator';
import './Home.css';
import { Suspense } from 'react';
const ServiceCard = React.lazy(() => import('./../../components/service-card/ServiceCard'));

const GET_SERVICES = gql`
    query GetServices {
        services {
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
            }
        }
    }
`;

const GET_CATEGORIES = gql`
    query GetCategories {
        categories {
            _id
            name
            url_name
        }
    }
`;

function Services() {
    const { loading, error, data } = useQuery(GET_SERVICES);

    if (loading) return <LoadingIndicator />
    if (error) return `Error! ${error.message}`;
    
    if (!data || data.services.length === 0) {
        return (
            <div className="services__grid__wrapper">
                <p style={{ textAlign: 'center', padding: '2rem', fontSize: '1.2rem' }}>
                    No services available at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="services__grid__wrapper row">
            {data.services.map((service) => (
                <div key={service._id} className="col-xs-12 col-sm-6 col-md-4 col-lg-3">
                    <Suspense fallback={<div> Please Wait... </div>} >
                        <ServiceCard service={service} />
                    </Suspense>
                </div>
            ))}
        </div>
    );
}

function Home() {
    const { data, loading, error } = useQuery(GET_CATEGORIES);

    if (loading) return <LoadingIndicator />;
    if (error) return `Error! ${error.message}`;

    return (
        <div>
            {
                data && <Categories categories={data.categories} />
            }
            <Services />
        </div>
    );
}

export default Home;