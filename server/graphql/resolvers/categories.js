import Category from '../../models/category.js';

const defaultCategories = [
    {
        name: 'Web Development',
        description: 'Custom websites, web applications, and frontend/backend development services',
        url_name: 'web-development'
    },
    {
        name: 'Graphic Design',
        description: 'Logo design, branding, illustrations, and visual design services',
        url_name: 'graphic-design'
    },
    {
        name: 'Writing & Translation',
        description: 'Content writing, copywriting, translation, and editing services',
        url_name: 'writing-translation'
    },
    {
        name: 'Digital Marketing',
        description: 'SEO, social media marketing, email marketing, and online advertising',
        url_name: 'digital-marketing'
    },
    {
        name: 'Video & Animation',
        description: 'Video editing, animation, motion graphics, and video production',
        url_name: 'video-animation'
    },
    {
        name: 'Music & Audio',
        description: 'Music production, voice-over, audio editing, and sound design',
        url_name: 'music-audio'
    },
    {
        name: 'Programming & Tech',
        description: 'Software development, mobile apps, data science, and technical consulting',
        url_name: 'programming-tech'
    },
    {
        name: 'Business',
        description: 'Business consulting, virtual assistance, market research, and business plans',
        url_name: 'business'
    },
    {
        name: 'Photography',
        description: 'Product photography, portrait photography, event photography, and photo editing',
        url_name: 'photography'
    },
    {
        name: 'Data Entry',
        description: 'Data entry, data processing, transcription, and administrative support',
        url_name: 'data-entry'
    }
];

const CategoriesResolver = {
    Query: {
        categories: async () => {
            try {
                let categories = await Category.find();

                if (!categories.length) {
                    categories = await Category.insertMany(defaultCategories);
                }

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