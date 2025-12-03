import Service from '../../models/service.js';
import User from '../../models/user.js';
import Category from '../../models/category.js';
import Review from '../../models/review.js';
import Order from '../../models/order.js';
import { v2 as cloudinary } from 'cloudinary';

const ServicesResolver = {
    Query: {
        services: async () => {
            try {
                const services = await Service.find().populate('freelancer', 'username profile_picture');
                return services.map(service => {
                    return { ...service._doc, _id: service.id };
                });
            } catch (err) {
                throw err;
            }
        },
        service: async (_parent, { serviceId }) => {
            try {
                const service = await Service.findById(serviceId).populate('freelancer', 'username profile_picture bio');
                return { ...service._doc, _id: service.id };
            } catch (err) {
                throw err;
            }
        },
        servicesByUserId: async (_parent, { userId }) => {
            try {
                const services = await Service.find({ freelancer: userId }).populate('freelancer', 'username profile_picture');
                return services.map(service => {
                    return { ...service._doc, _id: service.id };
                });
            } catch (err) {
                throw err;
            }
        },
        servicesByCategory: async (_parent, { category }) => {
            try {
                const categoryDocument = await Category.findOne({ name: category });

                if (!categoryDocument) {
                    // Category not found
                    return [];
                }

                // Find services with the matching category ID
                const services = await Service.find({ category: categoryDocument._id })
                    .populate('freelancer', 'username profile_picture');

                return services;
            } catch (err) {
                throw err;
            }
        },
        servicesByCategoryUrlName: async (_parent, { categoryUrlName }) => {
            try {
                const categoryDocument = await Category.findOne({ url_name: categoryUrlName });

                console.log(categoryDocument);
                console.log("Hello");

                if (!categoryDocument) {
                    // Category not found
                    return [];
                }

                // Find services with the matching category ID
                const services = await Service.find({ category: categoryDocument._id })
                    .populate('freelancer', 'username profile_picture');

                return services;
            } catch (err) {
                throw err;
            }
        },
        servicesBySearchQuery: async (_parent, { searchQuery }) => {
            try {
                const services = await Service.aggregate([
                    {
                        $search: {
                            "text": {
                                "query": searchQuery,
                                "path": ["title", "description"],
                                "fuzzy": {
                                    "maxEdits": 2,
                                    "prefixLength": 3
                                }
                            }
                        }
                    }
                ]);

                const servicesWithFreelancer = await Service.populate(services, { path: "freelancer", select: "username profile_picture" });

                return servicesWithFreelancer;

                // return services;
            } catch (err) {
                throw err;
            }
        }
    },
    Mutation: {
        createService: async (_parent, { service }, context) => {

            if(!context.isAuth) {
                throw new Error("Unauthenticated");
            }

            const user = await User.findById(context.userId);
            const newService = new Service({
                title: service.title,
                description: service.description,
                category: service.category,
                price: service.price,
                images: service.images,
                freelancer: user,
            });
            try {
                const result = await newService.save();
                console.log(result);
                return result;
            } catch (err) {
                console.log(err);
                throw err;
            }
        },
        updateService: async (_parent, { serviceId, service, newImages }, context) => {
            if (!context.isAuth) {
                throw new Error("Unauthenticated");
            }

            try {
                // Find the service and verify ownership
                const existingService = await Service.findById(serviceId);
                
                if (!existingService) {
                    throw new Error("Service not found");
                }

                // Check if the authenticated user owns this service
                if (existingService.freelancer.toString() !== context.userId) {
                    throw new Error("Unauthorized: You can only edit your own services");
                }

                // Configure Cloudinary
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });

                let finalImages = [...service.images]; // Start with existing image URLs

                // Helper function to extract public_id from Cloudinary URL
                const extractPublicId = (imageUrl) => {
                    const urlParts = imageUrl.split('/');
                    const uploadIndex = urlParts.indexOf('upload');
                    
                    if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
                        let startIndex = uploadIndex + 1;
                        if (urlParts[startIndex] && urlParts[startIndex].match(/^v\d+$/)) {
                            startIndex += 1;
                        }
                        
                        const remainingParts = urlParts.slice(startIndex);
                        if (remainingParts.length > 0) {
                            const publicIdWithExt = remainingParts.join('/');
                            const publicIdWithoutQuery = publicIdWithExt.split('?')[0];
                            return publicIdWithoutQuery.replace(/\.[^/.]+$/, '');
                        }
                    }
                    return null;
                };

                // Handle new image uploads if provided
                if (newImages && newImages.length > 0) {
                    const uploadPromises = newImages.map(async (file) => {
                        const { createReadStream, filename, mimetype, encoding } = await file;
                        const stream = createReadStream();

                        const uploadResponse = await new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream(
                                { folder: 'freelance-connect' },
                                (error, result) => {
                                    if (result) {
                                        resolve(result);
                                    } else {
                                        reject(error);
                                    }
                                }
                            );
                            stream.pipe(uploadStream);
                        });

                        return uploadResponse.secure_url;
                    });

                    const newImageUrls = await Promise.all(uploadPromises);
                    finalImages = [...finalImages, ...newImageUrls];
                }

                // Find images that were removed (exist in old but not in new)
                const oldImages = existingService.images || [];
                const imagesToDelete = oldImages.filter(oldImage => !service.images.includes(oldImage));

                // Delete removed images from Cloudinary
                if (imagesToDelete.length > 0) {
                    const deletePromises = imagesToDelete.map(async (imageUrl) => {
                        try {
                            const publicId = extractPublicId(imageUrl);
                            if (publicId) {
                                const result = await cloudinary.uploader.destroy(publicId);
                                console.log(`Deleted old image ${publicId}:`, result);
                                return result;
                            }
                        } catch (error) {
                            console.error(`Error deleting old image ${imageUrl}:`, error);
                            // Continue even if one image fails to delete
                        }
                    });

                    await Promise.all(deletePromises);
                }

                // Update the service in MongoDB
                const updatedService = await Service.findByIdAndUpdate(
                    serviceId,
                    {
                        title: service.title,
                        description: service.description,
                        category: service.category,
                        price: service.price,
                        images: finalImages,
                    },
                    { new: true }
                ).populate('freelancer', 'username profile_picture');

                return { ...updatedService._doc, _id: updatedService.id };
            } catch (err) {
                console.error('Error updating service:', err);
                throw err;
            }
        },
        deleteService: async (_parent, { serviceId }, context) => {
            if (!context.isAuth) {
                throw new Error("Unauthenticated");
            }

            try {
                // Find the service and verify ownership
                const service = await Service.findById(serviceId);
                
                if (!service) {
                    throw new Error("Service not found");
                }

                // Check if the authenticated user owns this service
                if (service.freelancer.toString() !== context.userId) {
                    throw new Error("Unauthorized: You can only delete your own services");
                }

                // Configure Cloudinary
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET,
                });

                // Delete images from Cloudinary
                if (service.images && service.images.length > 0) {
                    const deletePromises = service.images.map(async (imageUrl) => {
                        try {
                            // Extract public_id from Cloudinary URL
                            // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{filename}.{ext}
                            // or: https://res.cloudinary.com/{cloud_name}/image/upload/{folder}/{filename}.{ext}
                            // We need to extract: {folder}/{filename} (without extension)
                            
                            // Split URL by '/'
                            const urlParts = imageUrl.split('/');
                            
                            // Find the index of 'upload' in the URL parts
                            const uploadIndex = urlParts.indexOf('upload');
                            
                            if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
                                // Get everything after 'upload'
                                // Skip version number if present (starts with 'v' followed by digits)
                                let startIndex = uploadIndex + 1;
                                if (urlParts[startIndex] && urlParts[startIndex].match(/^v\d+$/)) {
                                    startIndex += 1; // Skip version
                                }
                                
                                // Get the remaining path parts
                                const remainingParts = urlParts.slice(startIndex);
                                
                                if (remainingParts.length > 0) {
                                    // Join all parts and remove file extension
                                    const publicIdWithExt = remainingParts.join('/');
                                    // Remove query parameters if any (everything after '?')
                                    const publicIdWithoutQuery = publicIdWithExt.split('?')[0];
                                    // Remove file extension
                                    const publicId = publicIdWithoutQuery.replace(/\.[^/.]+$/, '');
                                    
                                    // Delete from Cloudinary
                                    const result = await cloudinary.uploader.destroy(publicId);
                                    console.log(`Deleted image ${publicId}:`, result);
                                    return result;
                                }
                            }
                        } catch (error) {
                            console.error(`Error deleting image ${imageUrl}:`, error);
                            // Continue even if one image fails to delete
                        }
                    });

                    await Promise.all(deletePromises);
                }

                // Remove service reference from user's services array
                await User.findByIdAndUpdate(context.userId, {
                    $pull: { services: serviceId }
                });

                // Remove service reference from reviews
                await Review.updateMany(
                    { service: serviceId },
                    { $unset: { service: 1 } }
                );

                // Note: We don't delete orders as they contain important transaction history
                // Orders will still reference the service, but the service will be deleted
                // You might want to handle this differently based on your business logic

                // Delete the service document
                await Service.findByIdAndDelete(serviceId);

                return true;
            } catch (err) {
                console.error('Error deleting service:', err);
                throw err;
            }
        }
    }
}

export default ServicesResolver;