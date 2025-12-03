import React, { useCallback, useContext, useState } from 'react';
import './CreateService.css';
import { useFormik } from 'formik';
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, gql, useQuery } from '@apollo/client';
import ImageDropZone from '../../components/image-drop-zone/ImageDropZone';
import UserContext from '../../UserContext';
import LoadingIndicator from '../../components/loading-indicator/LoadingIndicator';

const validate = values => {
    const errors = {};
    if (!values.service_title) {
        errors.service_title = 'Required';
    }
    else if (values.service_title.length > 60) {
        errors.service_title = 'Must be 60 characters or less';
    }

    if (!values.service_description) {
        errors.service_description = 'Required';
    } else if (values.service_description.length > 500) {
        errors.service_description = 'Must be 500 characters or less';
    }

    if (!values.service_category) {
        errors.service_category = 'Required';
    }

    if (!values.service_images || values.service_images.length === 0) {
        errors.service_images = 'At least one image is required';
    }

    if (!values.service_price) {
        errors.service_price = 'Required';
    }
    else if (values.service_price > 9999.99) {
        errors.service_price = 'Must be 9999.99 or less';
    }

    return errors;
};

const GET_SERVICE = gql`
    query GetService($serviceId: ID!) {
        service(serviceId: $serviceId) {
            _id
            title
            description
            price
            images
            category {
                _id
            }
            freelancer {
                _id
            }
        }
    }
`;

const CREATE_SERVICE = gql`
    mutation CreateService($title: String!, $description: String!, $category: ID!, $images: [String]!, $price: Float!) {
        createService(service: {title: $title, description: $description, category: $category, images: $images, price: $price}) {
            _id
        }
    }
`;

const DELETE_SERVICE = gql`
    mutation DeleteService($serviceId: ID!) {
        deleteService(serviceId: $serviceId)
    }
`;

const GET_CATEGORIES = gql`
    query GetCategories {
        categories {
            _id
            name
        }
    }
`;

const MULTIPLE_UPLOAD = gql`
    mutation MultipleUpload($files: [Upload!]!) {
        multipleUpload(files: $files) {
            filename
            mimetype
            encoding
            cloudinaryUrl
        }
    }
`;

function EditService() {

    const navigate = useNavigate();
    const { id } = useParams();
    const userId = useContext(UserContext).userId;
    const [existingImages, setExistingImages] = useState([]);
    const [newImageFiles, setNewImageFiles] = useState([]);

    const { loading: serviceLoading, error: serviceError, data: serviceData } = useQuery(GET_SERVICE, {
        variables: { serviceId: id },
        onCompleted: (data) => {
            if (data && data.service) {
                // Check ownership
                if (data.service.freelancer._id !== userId) {
                    navigate('/home');
                    return;
                }
                // Set existing images
                setExistingImages(data.service.images || []);
            }
        }
    });

    const { loading: categoriesLoading, error: categoriesError, data: categoriesData } = useQuery(GET_CATEGORIES);

    const [createService, { loading: createLoading }] = useMutation(CREATE_SERVICE);
    const [deleteService] = useMutation(DELETE_SERVICE);
    const [multipleUpload] = useMutation(MULTIPLE_UPLOAD);

    // Move useCallback to top level - React Hooks must be called unconditionally
    const handleImageDrop = useCallback((acceptedFiles) => {
        setNewImageFiles(prev => [...prev, ...acceptedFiles]);
    }, []);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            service_title: serviceData?.service?.title || '',
            service_description: serviceData?.service?.description || '',
            service_category: serviceData?.service?.category?._id || '',
            service_images: [],
            service_price: serviceData?.service?.price || 0.00,
        },
        validate,
        onSubmit: async (values) => {
            try {
                // Validate that at least one image exists (existing or new)
                const totalImages = existingImages.length + newImageFiles.length;
                if (totalImages === 0) {
                    formik.setFieldError('service_images', 'At least one image is required');
                    return;
                }

                // Validate required fields
                if (!values.service_title || !values.service_description || !values.service_category || !values.service_price) {
                    alert('Please fill in all required fields');
                    return;
                }

                let finalImages = [...existingImages];

                // Upload new images if any
                if (newImageFiles.length > 0) {
                    try {
                        const uploadResult = await multipleUpload({ variables: { files: newImageFiles } });
                        if (uploadResult.data && uploadResult.data.multipleUpload) {
                            const newImageUrls = uploadResult.data.multipleUpload.map((image) => image.cloudinaryUrl);
                            finalImages = [...finalImages, ...newImageUrls];
                        }
                    } catch (uploadError) {
                        console.error('Error uploading images:', uploadError);
                        alert(`Error uploading images: ${uploadError.message}`);
                        return;
                    }
                }

                // Ensure we have at least one image
                if (finalImages.length === 0) {
                    alert('At least one image is required');
                    return;
                }

                // Step 1: Create new service with updated data
                const createResult = await createService({
                    variables: {
                        title: values.service_title.trim(),
                        description: values.service_description.trim(),
                        category: values.service_category,
                        images: finalImages,
                        price: parseFloat(values.service_price),
                    }
                });

                if (createResult.data && createResult.data.createService) {
                    const newServiceId = createResult.data.createService._id;

                    // Step 2: Delete the old service
                    try {
                        await deleteService({
                            variables: { serviceId: id }
                        });
                    } catch (deleteError) {
                        console.error('Error deleting old service:', deleteError);
                        // Even if deletion fails, redirect to new service
                        // User can manually delete the old one if needed
                    }

                    // Step 3: Redirect to the new service
                    navigate(`/services/${newServiceId}`);
                }
            } catch (error) {
                console.error('Error updating service:', error);
                const errorMessage = error.message || 'Failed to update service. Please try again.';
                alert(`Error: ${errorMessage}`);
            }
        },
    });

    const removeExistingImage = (imageUrl) => {
        setExistingImages(existingImages.filter(img => img !== imageUrl));
    };

    const removeNewImage = (index) => {
        setNewImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (serviceLoading || categoriesLoading) return <LoadingIndicator />;
    if (serviceError) return `Error! ${serviceError.message}`;
    if (categoriesError) return `Error! ${categoriesError.message}`;
    if (!serviceData?.service) return <LoadingIndicator />;

    const isLoading = createLoading;

    return (
        <div className='create-service__container col-xs-12 col-sm-12 col-md-8 col-lg-6'>
            <h1>Edit Service</h1>
            <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
                Editing this service will create a new version and remove the old one.
            </p>
            <form onSubmit={formik.handleSubmit}>
                <div className='input__container'>
                    <label htmlFor="service_title">Title</label>
                    <input
                        id="service_title"
                        name="service_title"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.service_title}
                    />
                    {formik.touched.service_title && formik.errors.service_title ? (
                        <p className="info__validation email__validation">{formik.errors.service_title}</p>
                    ) : null}
                </div>
                <div className='input__container'>
                    <label htmlFor="service_description">Description</label>
                    <textarea
                        id="service_description"
                        name="service_description"
                        rows={10}
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.service_description}
                    />
                    {formik.touched.service_description && formik.errors.service_description ? (
                        <p className="info__validation email__validation">{formik.errors.service_description}</p>
                    ) : null}
                </div>
                {categoriesData &&
                    <div className='input__container'>
                        <label htmlFor="service_category">Category</label>
                        <select
                            id="service_category"
                            name="service_category"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.service_category}
                        >
                            <option value="" label="Select a category" />
                            {categoriesData.categories.map((category) => (
                                <option key={category._id} value={category._id} label={category.name} />
                            ))}
                        </select>
                        {formik.touched.service_category && formik.errors.service_category ? (
                            <p className="info__validation email__validation">{formik.errors.service_category}</p>
                        ) : null}
                    </div>
                }
                <div className='input__container'>
                    <label htmlFor="service_images">Images</label>
                    {existingImages.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Existing Images:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {existingImages.map((imageUrl, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={imageUrl}
                                            alt={`Existing ${index + 1}`}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(imageUrl)}
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Remove image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <p style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Add New Images:</p>
                    <ImageDropZone
                        onDrop={handleImageDrop}
                    />
                    {newImageFiles.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                            <p style={{ marginBottom: '0.5rem' }}>New images to upload ({newImageFiles.length}):</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {newImageFiles.map((file, index) => (
                                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt={`New ${index + 1}`}
                                            style={{
                                                width: '100px',
                                                height: '100px',
                                                objectFit: 'cover',
                                                borderRadius: '4px',
                                                border: '1px solid #ddd'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(index)}
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Remove image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {(formik.touched.service_images && formik.errors.service_images) || (existingImages.length === 0 && newImageFiles.length === 0 && formik.submitCount > 0) ? (
                        <p className="info__validation email__validation">
                            {formik.errors.service_images || 'At least one image is required'}
                        </p>
                    ) : null}
                </div>
                <div className='input__container'>
                    <label htmlFor="service_price">Price</label>
                    <input
                        id="service_price"
                        name="service_price"
                        type="number"
                        step="0.01"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.service_price}
                    />
                    {formik.touched.service_price && formik.errors.service_price ? (
                        <p className="info__validation email__validation">{formik.errors.service_price}</p>
                    ) : null}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className='create-service__submit-button'
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating New Service...' : 'Save Changes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/services/${id}`)}
                        disabled={isLoading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditService;
