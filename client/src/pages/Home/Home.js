import React, { useState } from 'react';
import Categories from '../../components/categories/Categories';
import { gql, useQuery } from '@apollo/client';
import LoadingIndicator from '../../components/loading-indicator/LoadingIndicator';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import './Home.css';
import { Suspense } from 'react';
const ServiceCard = React.lazy(() => import('./../../components/service-card/ServiceCard'));

// TODO: change to getServicesByCategory
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

const GET_SERVICES_BY_QUERY = gql`
    query GetServicesByQuery($searchQuery: String!) {
        servicesBySearchQuery(searchQuery: $searchQuery) {
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

function Services({ searchQuery }) {
    const { loading: allServicesLoading, error: allServicesError, data: allServicesData } = useQuery(GET_SERVICES, {
        skip: !!searchQuery
    });
    const { loading: searchLoading, error: searchError, data: searchData } = useQuery(GET_SERVICES_BY_QUERY, {
        variables: { searchQuery: searchQuery || '' },
        skip: !searchQuery
    });

    const loading = searchQuery ? searchLoading : allServicesLoading;
    const error = searchQuery ? searchError : allServicesError;
    const services = searchQuery ? (searchData?.servicesBySearchQuery || []) : (allServicesData?.services || []);

    if (loading) return <LoadingIndicator />
    if (error) return `Error! ${error.message}`;
    
    if (services.length === 0) {
        return (
            <div className="services__grid__wrapper">
                <p style={{ textAlign: 'center', padding: '2rem', fontSize: '1.2rem' }}>
                    {searchQuery ? `No services found for "${searchQuery}"` : 'No services available at the moment.'}
                </p>
            </div>
        );
    }

    return (
        <div className="services__grid__wrapper row">
            {services.map((service) => (
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
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { data } = useQuery(GET_CATEGORIES);

    const formik = useFormik({
        initialValues: {
            search_query: '',
        },
        onSubmit: values => {
            if (values.search_query.trim()) {
                setSearchQuery(values.search_query.trim());
            } else {
                setSearchQuery('');
            }
        },
    });

    return (
        <div>
            {
                data && <Categories categories={data.categories} />
            }
            <div className="home__search-container" style={{ 
                maxWidth: '800px', 
                margin: '2rem auto', 
                padding: '0 1rem' 
            }}>
                <form
                    onSubmit={formik.handleSubmit}
                    style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                >
                    <input
                        type="text"
                        name="search_query"
                        id="search_query"
                        placeholder="Search for services..."
                        className="main-navigation__search-input"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.search_query}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            fontSize: '1rem',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    <button
                        type="submit"
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Search
                    </button>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                formik.resetForm();
                                setSearchQuery('');
                            }}
                            style={{
                                padding: '0.75rem 1rem',
                                fontSize: '1rem',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Clear
                        </button>
                    )}
                </form>
                {searchQuery && (
                    <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                        Showing results for: <strong>{searchQuery}</strong>
                    </p>
                )}
            </div>
            <Services searchQuery={searchQuery} />
        </div>
    );
}

export default Home;