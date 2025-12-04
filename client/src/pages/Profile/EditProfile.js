import React, { useContext, useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { gql, useMutation, useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import UserContext from '../../UserContext';
import defaultImage from '../../assets/images/default-user-image.png';
import './EditProfile.css';

const GET_CURRENT_USER = gql`
    query GetCurrentUser($userId: ID!) {
        user(userId: $userId) {
            _id
            username
            full_name
            bio
            profile_picture
            email
        }
    }
`;

const UPDATE_USER = gql`
    mutation UpdateUser($userId: ID!, $user: UpdateUserInput!) {
        updateUser(userId: $userId, user: $user) {
            _id
            username
            full_name
            bio
            profile_picture
        }
    }
`;

const SINGLE_UPLOAD = gql`
    mutation SingleUpload($file: Upload!) {
        singleUpload(file: $file) {
            cloudinaryUrl
        }
    }
`;

function EditProfile() {

    const navigate = useNavigate();
    const userContext = useContext(UserContext);
    const userId = userContext?.userId;

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    const { data, loading, error } = useQuery(GET_CURRENT_USER, {
        variables: { userId },
        skip: !userId
    });

    const [singleUpload] = useMutation(SINGLE_UPLOAD);
    const [updateUser, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_USER, {
        onCompleted: () => {
            navigate(`/user/${userId}`);
        }
    });

    useEffect(() => {
        if (!userId) {
            navigate('/login');
        }
    }, [userId, navigate]);

    useEffect(() => {
        if (selectedFile) {
            const fileReader = new FileReader();
            fileReader.onloadend = () => {
                setPreviewUrl(fileReader.result);
            };
            fileReader.readAsDataURL(selectedFile);
        }
    }, [selectedFile]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            username: data?.user.username || '',
            full_name: data?.user.full_name || '',
            bio: data?.user.bio || '',
        },
        validate: values => {
            const errors = {};
            if (!values.username) {
                errors.username = 'Username is required';
            }
            if (!values.full_name) {
                errors.full_name = 'Full name is required';
            }
            if (values.bio && values.bio.length > 500) {
                errors.bio = 'Bio cannot exceed 500 characters';
            }
            return errors;
        },
        onSubmit: async values => {
            let profilePictureUrl = data?.user.profile_picture || '';
            try {
                if (selectedFile) {
                    const uploadResult = await singleUpload({
                        variables: { file: selectedFile }
                    });
                    profilePictureUrl = uploadResult?.data?.singleUpload?.cloudinaryUrl || profilePictureUrl;
                }

                await updateUser({
                    variables: {
                        userId,
                        user: {
                            username: values.username,
                            full_name: values.full_name,
                            bio: values.bio,
                            profile_picture: profilePictureUrl
                        }
                    }
                });
            } catch (err) {
                console.error(err);
            }
        }
    });

    if (loading) {
        return <div className="edit-profile__container"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="edit-profile__container"><p>Error: {error.message}</p></div>;
    }

    return (
        <div className="edit-profile__container col-xs-12 col-sm-10 col-md-8 col-lg-6">
            <h1>Edit Profile</h1>
            <form onSubmit={formik.handleSubmit}>
                <div className="edit-profile__avatar-section">
                    <img
                        src={previewUrl || data?.user.profile_picture || defaultImage}
                        alt="Profile preview"
                    />
                    <label className="edit-profile__upload-label">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                                if (event.currentTarget.files && event.currentTarget.files[0]) {
                                    setSelectedFile(event.currentTarget.files[0]);
                                }
                            }}
                        />
                        Change Photo
                    </label>
                </div>

                <div className="input__container">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.username}
                    />
                    {formik.touched.username && formik.errors.username ? (
                        <p className="info__validation">{formik.errors.username}</p>
                    ) : null}
                </div>

                <div className="input__container">
                    <label htmlFor="full_name">Full Name</label>
                    <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.full_name}
                    />
                    {formik.touched.full_name && formik.errors.full_name ? (
                        <p className="info__validation">{formik.errors.full_name}</p>
                    ) : null}
                </div>

                <div className="input__container">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                        id="bio"
                        name="bio"
                        rows="4"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.bio}
                        placeholder="Tell clients about yourself..."
                    />
                    <div className="edit-profile__helper-text">
                        {formik.values.bio.length}/500
                    </div>
                    {formik.touched.bio && formik.errors.bio ? (
                        <p className="info__validation">{formik.errors.bio}</p>
                    ) : null}
                </div>

                {updateError && (
                    <p className="info__validation">Error: {updateError.message}</p>
                )}

                <div className="edit-profile__actions">
                    <button
                        type="button"
                        className="edit-profile__cancel-button"
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="edit-profile__submit-button"
                        disabled={updateLoading}
                    >
                        {updateLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditProfile;

