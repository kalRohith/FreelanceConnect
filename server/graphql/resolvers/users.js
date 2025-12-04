import User from '../../models/user.js';

const UsersResolver = {
    Query: {
        user: async (_parent, { userId }) => {
            try {
                const user = await User.findById(userId);
                return { ...user._doc, _id: user.id };
            }
            catch (err) {
                throw err;
            }
        },
    },
    User: {
        freelance_rating: async (parent) => {
            try {
                const user = await User.findById(parent._id || parent.id);
                return user.freelance_rating || 0;
            } catch (err) {
                return 0;
            }
        },
        client_rating: async (parent) => {
            try {
                const user = await User.findById(parent._id || parent.id);
                return user.client_rating || 0;
            } catch (err) {
                return 0;
            }
        },
    },
    Mutation: {
        updateUser: async (_parent, { userId, user }, context) => {
            if (!context.isAuth || context.userId !== userId) {
                throw new Error('Unauthenticated!');
            }

            try {
                const existingUser = await User.findById(userId);
                if (!existingUser) {
                    throw new Error('User not found');
                }

                if (user.username && user.username !== existingUser.username) {
                    const usernameTaken = await User.findOne({ username: user.username, _id: { $ne: userId } });
                    if (usernameTaken) {
                        throw new Error('Username already taken');
                    }
                    existingUser.username = user.username;
                }

                if (user.full_name !== undefined) {
                    existingUser.full_name = user.full_name;
                }

                if (user.bio !== undefined) {
                    existingUser.bio = user.bio;
                }

                if (user.profile_picture !== undefined) {
                    existingUser.profile_picture = user.profile_picture;
                }

                const updatedUser = await existingUser.save();
                return { ...updatedUser._doc, _id: updatedUser.id };
            } catch (err) {
                throw err;
            }
        }
    }
}

export default UsersResolver;