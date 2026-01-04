import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import "./Search.css";
import ServiceCard from "../../components/service-card/ServiceCard";

const GET_SERVICES_BY_QUERY = gql`
    query GetServicesByQuery($searchQuery: String!) {
        servicesBySearchQuery(searchQuery: $searchQuery) {
            _id
            description
            price
            title
            images
            rating     # <--- MUST HAVE THIS
            reviews {  # <--- MUST HAVE THIS
            _id
            }
            freelancer {
                _id
                username
                profile_picture
                freelance_rating
            }
            recommendationScore
        }
    }
`;

const Search = () => {
    const { query } = useParams();
    
    // Using network-only policy ensures we get fresh recommendations every time
    const { loading, error, data, refetch } = useQuery(GET_SERVICES_BY_QUERY, {
        variables: { searchQuery: query },
        fetchPolicy: "network-only" 
    });

    useEffect(() => {
        if(query) refetch();
    }, [query, refetch]);

    if (loading) return (
        <div className="search-loading">
            <div className="spinner"></div>
            <p>Finding the best match for "{query}"...</p>
        </div>
    );

    if (error) return (
        <div className="search-error">
            <h3>Something went wrong</h3>
            <p>{error.message}</p>
        </div>
    );

    const services = data?.servicesBySearchQuery || [];

    return (
        <div className="services search-page-container">
            <div className="search-header">
                <h2>Results for "{query}"</h2>
                <span className="search-subtitle">
                    {services.length} services found • Ranked by Relevance & Reputation
                </span>
            </div>

            {services.length === 0 ? (
                <div className="no-results">
                    <span className="material-symbols-outlined icon-large">search_off</span>
                    <h3>No services found</h3>
                    <p>Try changing your keywords or checking for spelling errors.</p>
                </div>
            ) : (
                <div className="services__grid__wrapper row">
                    {services.map((service) => (
                        <div className="col-xs-12 col-sm-8 col-md-6 col-lg-3" key={service._id}>
                            <ServiceCard service={service} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Search;