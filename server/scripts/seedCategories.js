import { connect } from 'mongoose';
import Category from '../models/category.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from nodemon.json
let envVars = {};
try {
    const nodemonConfig = JSON.parse(readFileSync(join(__dirname, '../nodemon.json'), 'utf8'));
    envVars = nodemonConfig.env || {};
} catch (error) {
    console.log('Could not read nodemon.json, using process.env');
    envVars = process.env;
}

// Set environment variables
Object.keys(envVars).forEach(key => {
    if (!process.env[key]) {
        process.env[key] = envVars[key];
    }
});

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

async function seedCategories() {
    try {
        // Connect to MongoDB
        const mongoUri = `mongodb+srv://${process.env.MONGO_ATLAS_USER}:${encodeURIComponent(process.env.MONGO_ATLAS_PW)}@freelanceconnect.nblezz6.mongodb.net/${process.env.MONGO_ATLAS_DB}?retryWrites=true&w=majority`;
        
        await connect(mongoUri);
        console.log('Connected to MongoDB');

        // Check if categories already exist
        const existingCategories = await Category.find();
        
        if (existingCategories.length > 0) {
            console.log(`Found ${existingCategories.length} existing categories. Skipping seed.`);
            console.log('If you want to add new categories, use the createCategory mutation in GraphQL.');
            process.exit(0);
        }

        // Insert default categories
        const insertedCategories = await Category.insertMany(defaultCategories);
        console.log(`Successfully seeded ${insertedCategories.length} categories:`);
        insertedCategories.forEach(cat => {
            console.log(`  - ${cat.name} (${cat.url_name})`);
        });

        console.log('\nCategories seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding categories:', error);
        process.exit(1);
    }
}

seedCategories();

