# Quick Start Guide - Adding Services and Searching

## 🚀 Quick Steps to Get Started

### 1. Seed Default Categories (First Time Only)

Before creating services, you need to populate the database with default categories:

```bash
cd server
npm run seed:categories
```

This creates 10 default categories:

- Web Development
- Graphic Design
- Writing & Translation
- Digital Marketing
- Video & Animation
- Music & Audio
- Programming & Tech
- Business
- Photography
- Data Entry

### 2. Create a Service

1. **Login** to your account at `/login`
2. Navigate to **`/create-service`** (or click "Create Service" in navigation if available)
3. Fill in the form:
   - **Title:** Your service title
   - **Description:** Detailed description
   - **Category:** Select from dropdown (now populated with default categories!)
   - **Price:** Your service price
   - **Images:** Drag & drop or click to upload images
4. Click **Submit**

Your service will be:

- ✅ Saved to MongoDB
- ✅ Images uploaded to Cloudinary
- ✅ Visible on the home page
- ✅ Searchable by other users

### 3. Search Services on Home Page

1. Navigate to **`/home`** after logging in
2. Use the **search bar** at the top of the page
3. Type your search query (e.g., "website design", "logo")
4. Click **Search** or press Enter
5. Results will appear below
6. Click **Clear** to show all services again

## 📝 What Was Fixed

1. ✅ **Category Selection Fixed:** The category dropdown now works properly and includes default categories
2. ✅ **Search Added to Home Page:** You can now search services directly from the home page
3. ✅ **Category Creation Fixed:** The `createCategory` mutation now automatically generates `url_name`

## 🔧 How It Works

### Service Creation Flow:

1. User fills form → Images selected
2. Form submits → Images uploaded to Cloudinary
3. Cloudinary returns URLs → Service created in MongoDB with image URLs
4. Service appears on home page → Searchable by all users

### Search Flow:

1. User types query → GraphQL query sent
2. MongoDB Atlas Search finds matching services
3. Results displayed → User can click to view details

## 📚 Need More Details?

- **MongoDB & Cloudinary Setup:** See `MONGODB_CLOUDINARY_GUIDE.md`
- **Environment Variables:** See `SETUP_GUIDE.md`
- **General Setup:** See `README.md`

## 🐛 Troubleshooting

### Categories dropdown is empty?

```bash
cd server
npm run seed:categories
```

### Search not working?

- Make sure MongoDB Atlas Search Index is configured (see `MONGODB_CLOUDINARY_GUIDE.md`)

### Images not uploading?

- Check Cloudinary credentials in `server/nodemon.json`
- Verify file sizes are under 1MB (or increase limit in `server/app.js`)

### Service creation fails?

- Make sure you're logged in
- Verify categories exist (run seed script)
- Check that all required fields are filled

## 🎯 Next Steps

1. Seed categories: `cd server && npm run seed:categories`
2. Create your first service at `/create-service`
3. Search for services on `/home`
4. Explore categories by clicking category cards

Happy freelancing! 🎉
