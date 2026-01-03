import React from "react";
import { NavLink } from "react-router-dom";
import "./MainNavigation.css";
import ResponsiveSearch from "../responsive-search/ResponsiveSearch";
import UserOptions from "../user-options/UserOptions";
import { useFormik } from "formik";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import NavigationDrawer from "../navigation-drawer/NavigationDrawer";
import Notifications from "../notifications/Notifications";
import { gql, useQuery, useSubscription, useApolloClient } from "@apollo/client";
import UserContext from "../../UserContext";

const validate = values => {
    const errors = {};
    if (!values.search_query) {
        errors.search_query = "Required";
    }
    return errors;
};

const GET_NOTIFICATIONS = gql`
    query GetNotificationsByUserId($userId: ID!) {
        notificationsByUserId(userId: $userId) {
            id
            content
            read
            date
            order {
                _id
            }
        }
    }
`;

const NOTIFICATION_SUBSCRIPTION = gql`
    subscription NotificationSent($userId: ID!) {
        notificationSent(userId: $userId) {
            id
            content
            read
            date
            order { _id }
            user { _id username profile_picture }
        }
    }
`;


const MainNavigation = () => {
    // const handleUserDropdownClick = () => {
    //     // TODO: handle user dropdown click
    // };

    const userContext = React.useContext(UserContext);

    // react hook for navigation
    const navigate = useNavigate();

    const { data: notificationsData } = useQuery(GET_NOTIFICATIONS, {
        skip: !userContext?.userId,
        variables: { userId: userContext?.userId },
        fetchPolicy: "cache-and-network",
    });
    const client = useApolloClient();
    useSubscription(NOTIFICATION_SUBSCRIPTION, {
        skip: !userContext?.userId,
        variables: { userId: userContext?.userId },
        onSubscriptionData: async ({ subscriptionData }) => {
            try {
                await client.query({ query: GET_NOTIFICATIONS, variables: { userId: userContext?.userId }, fetchPolicy: 'network-only' });
            } catch (e) {
                // ignore
            }
        }
    });


    // const notifications = [
    //     {
    //         message: "You have a new message from John Doe",
    //         time: "2 hours ago",
    //     },
    //     {
    //         message: "You have a new message from John Doe",
    //         time: "2 hours ago",
    //     },
    //     {
    //         message: "You have a new message from John Doe",
    //         time: "2 hours ago",
    //     },
    // ];

    const formik = useFormik({
        initialValues: {
            search_query: '',
        },
        validate,
        onChange: values => {
            console.log(values);
        },
        onSubmit: values => {
            console.log(values);
            navigate(`/search/${values.search_query}`);
        },
    });

    const isFreelancer = Cookies.get('isFreelancer') === 'true';

    return (
        <header>
            <NavigationDrawer />
            <NavLink to="/home" className="active-link">
                <div className="main-navigation__logo">FreelanceConnect</div>
            </NavLink>
            <form
                className="main-navigation__search-form"
                onSubmit={formik.handleSubmit}
            >
                <div className="main-navigation__search-container">
                    <input
                        type="text"
                        name="search_query"
                        id="search_query"
                        placeholder="Search for services"
                        className="main-navigation__search-input"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.search_query}
                    />
                    <button
                        type="submit"
                        className="main-navigation__search-button">
                        <i className="fa fa-search" aria-hidden="true"></i>
                    </button>
                </div>
            </form>
            <div className="main-navigation__nav-icons">
                {/* <NavLink to="/messages" activeClassName="active-link">
                    <i className="fa fa-envelope" aria-hidden="true"></i>
                </NavLink> */}
                <div className="nav-icon-with-label">
                    <Notifications notifications={notificationsData?.notificationsByUserId || []} />
                    <span className="nav-icon-label">Notifications</span>
                </div>
                {/* <NavLink to="/saved" activeClassName="active-link">
                    <i className="fa fa-heart" aria-hidden="true"></i>
                </NavLink> */}
                <NavLink to="/orders" className="active-link orders-link">
                    <div className="nav-link__wrapper">
                        <span class="material-symbols-outlined">
                            {isFreelancer ? "archive" : "receipt_long"}
                        </span>
                        <p>Orders</p>
                    </div>
                </NavLink>
                <ResponsiveSearch />
                <UserOptions />
            </div>
        </header>
    );
};

export default MainNavigation;