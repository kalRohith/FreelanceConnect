import Review from '../../models/review.js';
import Order from '../../models/order.js';
import Service from '../../models/service.js';
import User from '../../models/user.js';

const ReviewsResolver = {
    Query: {
        reviewsByUserId: async (_parent, { userId }, req) => {
            try {
                const reviews = await Review.find({ reviewee: userId }).populate('reviewer', 'username profile_picture');
                return reviews.map(review => {
                    return { ...review._doc, _id: review.id };
                });
            } catch (err) {
                throw err;
            }
        },
        reviewsByServiceId: async (_parent, { serviceId }, req) => {
            try {
                const service = await Service.findById(serviceId);
                const orders = await Order.find({ service: serviceId });
                const orderIds = orders.map(order => order._id);
                const reviews = await Review.find({ order: { $in: orderIds } }).populate('reviewer', 'username profile_picture');
                const filteredReviews = reviews.filter(review => review.reviewer._id.toString() !== service.freelancer.toString());

                return filteredReviews.map(review => {
                    return { ...review._doc, _id: review.id };
                });
            } catch (err) {
                throw err;
            }
        },
        reviewsByOrderId: async (_parent, { orderId }, req) => {
            try {
                const reviews = await Review.find({ order: orderId }).populate('reviewer', 'username profile_picture');
                return reviews.map(review => {
                    return { ...review._doc, _id: review.id };
                });
            } catch (err) {
                throw err;
            }
        }
    },
    Mutation: {
        createReview: async (_parent, { review }, context) => {
            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }

            try {
                // ---- Reviews can only be created for completed (CLOSED) orders ----
                if (!review.order) {
                    throw new Error('Reviews can only be created for completed orders.');
                }

                const order = await Order.findById(review.order);
                if (!order) {
                    throw new Error('Order not found.');
                }

                const isClient = order.client.toString() === context.userId.toString();
                const isFreelancer = order.freelancer.toString() === context.userId.toString();

                if (!isClient && !isFreelancer) {
                    throw new Error('You are not allowed to review this order.');
                }

                // Order must be fully closed before a review is allowed
                if (order.status !== 'CLOSED') {
                    throw new Error('You can only review a service after the order is completed and paid.');
                }

                // Enforce one review per order per reviewer
                const existingOrderReview = await Review.findOne({
                    order: order._id,
                    reviewer: context.userId
                });

                if (existingOrderReview) {
                    throw new Error('You have already submitted a review for this order.');
                }

                // Ensure the service on the review (if provided) matches the order's service
                const serviceIdFromOrder = order.service.toString();
                if (review.service && review.service.toString() !== serviceIdFromOrder) {
                    throw new Error('Review service does not match the order service.');
                }

                // Always bind the review to the service from the order to keep data consistent
                const effectiveServiceId = review.service || serviceIdFromOrder;

                // Create and save the review first
                const newReview = new Review({
                    reviewer: context.userId,
                    reviewee: review.reviewee,
                    rating: review.rating,
                    content: review.content,
                    date: Date.now(),
                    order: order._id,
                    service: effectiveServiceId
                });

                const savedReview = await newReview.save();

                // ---- Update service rating (for the service being reviewed) ----
                const service = await Service.findById(effectiveServiceId);

                if (service) {
                    // Prevent the service owner from rating their own service
                    if (service.freelancer.toString() === context.userId.toString()) {
                        throw new Error('You cannot rate your own service.');
                    }

                    // Attach the review to the service document for easier querying
                    if (!service.reviews.find(rId => rId.toString() === savedReview._id.toString())) {
                        service.reviews.push(savedReview._id);
                    }

                    const serviceReviews = await Review.find({
                        service: service._id,
                        reviewee: service.freelancer
                    });

                    const serviceRatings = serviceReviews.map(r => r.rating);
                    const serviceAverage =
                        serviceRatings.length > 0
                            ? serviceRatings.reduce((a, b) => a + b, 0) / serviceRatings.length
                            : 0;

                    service.rating = serviceAverage;
                    await service.save();
                }

                // ---- Update user rating (freelance_rating or client_rating) ----
                // UPDATE FREELANCER RATING (For Recommendation Engine)
                const targetUser = await User.findById(review.reviewee);
                if (targetUser) {
                    const allReviews = await Review.find({ reviewee: review.reviewee });
                    const avg = allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length;
                    
                    if (order.freelancer.toString() === review.reviewee.toString()) {
                        targetUser.freelance_rating = avg;
                    } else {
                        targetUser.client_rating = avg;
                    }
                    await targetUser.save();
                }

                // Link review back to order
                if (order.client.toString() === context.userId.toString()) {
                    order.client_review = savedReview._id;
                } else {
                    order.freelancer_review = savedReview._id;
                }
                await order.save();

                return savedReview;
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
}

export default ReviewsResolver;