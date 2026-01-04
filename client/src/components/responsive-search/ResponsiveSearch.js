import React, { useState } from 'react';
import { useFormik } from 'formik';
import { useNavigate } from 'react-router-dom';
import './ResponsiveSearch.css';

const validate = values => {
    const errors = {};
    if (!values.search_query) {
        errors.search_query = "Required";
    }
    return errors;
};

function ResponsiveSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: {
            search_query: '',
        },
        validate,
        onSubmit: values => {
            if(values.search_query.trim()){
                navigate(`/search/${values.search_query}`);
                setIsOpen(false); // Close bar on search
            }
        }
    });

    return (
        <div className="responsive-search">
            <div className="responsive-search__icon" onClick={() => setIsOpen(true)}>
                <span className="material-symbols-outlined">search</span>
            </div>
            
            <div 
                className="responsive-search__wrapper" 
                style={{ width: isOpen ? "100%" : "0px" }}
            >
                <form
                    className="main-navigation__responsive-search-form"
                    onSubmit={formik.handleSubmit}
                >
                    <div className="main-navigation__responsive-search-container">
                        <input
                            type="text"
                            name="search_query"
                            id="search_query"
                            placeholder="Find services (e.g. 'React Developer')"
                            className="main-navigation__search-input"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.search_query}
                            autoComplete="off"
                        />
                    </div>
                </form>
                <div className="responsive-search__close-icon" onClick={() => {
                    setIsOpen(false);
                    formik.resetForm();
                }}>
                    <span className="material-symbols-outlined">close</span>
                </div>
            </div>
        </div>
    );
}

export default ResponsiveSearch;