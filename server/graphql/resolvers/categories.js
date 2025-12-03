import Category from '../../models/category.js';

const CategoriesResolver = {
    Query: {
        categories: async (_parent, args, req) => {
            try {
                const categories = await Category.find();
                return categories.map(category => {
                    return { ...category._doc, _id: category._id };
                });
            } catch (err) {
                throw err;
            }
        },
    },
    Mutation: {
        createCategory: async (_parent, { category }, context) => {

            if (!context.isAuth) {
                throw new Error('Unauthenticated!');
            }

            // Generate url_name from category name (lowercase, replace spaces with hyphens)
            const url_name = category.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            const newCategory = new Category({
                name: category.name,
                description: category.description,
                url_name: url_name,
            });
            try {
                const result = await newCategory.save();
                console.log(result);
                return result;
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
}

export default CategoriesResolver;