# Edit Service Functionality Guide

This guide explains how the service editing feature works in FreelanceConnect.

## Overview

The edit service functionality allows service owners to update their services. When a service is edited:

1. ✅ Service details are updated in MongoDB
2. ✅ New images are uploaded to Cloudinary
3. ✅ Removed images are deleted from Cloudinary
4. ✅ Cloudinary URLs are updated in MongoDB
5. ✅ Changes are reflected immediately

## How to Edit a Service

### Method 1: From Service Detail Page

1. Navigate to your service detail page (`/services/{serviceId}`)
2. If you're the owner, you'll see an **"Edit Service"** button at the top right
3. Click the button to go to the edit page
4. Modify any fields:
   - Title
   - Description
   - Category
   - Price
   - Images (add new or remove existing)
5. Click **"Update Service"** to save changes
6. You'll be redirected back to the service detail page

### Method 2: From Your Profile Page

1. Navigate to your profile page (`/user/{userId}`)
2. Find the service you want to edit in your services grid
3. Click the **"Edit"** button in the top-right corner of the service card
4. Make your changes
5. Click **"Update Service"** to save

## Image Management

### Existing Images
- All existing images are displayed as thumbnails
- Click the **×** button on any image to remove it
- Removed images will be deleted from Cloudinary when you save

### Adding New Images
- Use the drag-and-drop zone to add new images
- New images are uploaded to Cloudinary when you save
- New image URLs are added to the service's images array

### Image Replacement Flow
1. **Keep existing images**: Images that remain selected stay in Cloudinary
2. **Remove images**: Images removed from the list are deleted from Cloudinary
3. **Add new images**: New images are uploaded and added to the list

## Technical Implementation

### GraphQL Mutation

```graphql
mutation UpdateService(
  $serviceId: ID!
  $title: String!
  $description: String!
  $category: ID!
  $images: [String]!
  $price: Float!
  $newImages: [Upload!]
) {
  updateService(
    serviceId: $serviceId
    service: {
      title: $title
      description: $description
      category: $category
      images: $images
      price: $price
    }
    newImages: $newImages
  ) {
    _id
    title
  }
}
```

### Backend Process

The update process follows these steps:

1. **Authentication & Authorization Check**
   - Verifies user is logged in
   - Verifies user owns the service

2. **New Image Upload (if any)**
   - Uploads new image files to Cloudinary
   - Gets Cloudinary URLs for new images
   - Adds new URLs to the final images array

3. **Image Cleanup**
   - Compares old images with new images array
   - Identifies images that were removed
   - Deletes removed images from Cloudinary

4. **MongoDB Update**
   - Updates service document with new data
   - Updates images array with final Cloudinary URLs
   - Returns updated service

### Frontend Components

**EditService.js** (`/client/src/pages/Service/EditService.js`)
- Loads existing service data
- Pre-populates form fields
- Shows existing images with remove buttons
- Handles new image uploads
- Updates service on submit

**Service.js** (`/client/src/pages/Service/Service.js`)
- Shows edit button for service owners
- Redirects to edit page

**Profile.js** (`/client/src/pages/Profile/Profile.js`)
- Shows edit button on service cards (for owner)
- Redirects to edit page

## Security Features

1. **Authorization Check**: Only service owners can edit their services
2. **Authentication Required**: User must be logged in
3. **Ownership Verification**: Backend verifies ownership before allowing edits
4. **Error Handling**: Graceful error handling with user feedback

## Image Handling Details

### Cloudinary URL Parsing

The system correctly extracts `public_id` from Cloudinary URLs in various formats:

- `https://res.cloudinary.com/{cloud}/image/upload/v123/{folder}/{file}.jpg`
- `https://res.cloudinary.com/{cloud}/image/upload/{folder}/{file}.jpg`
- URLs with query parameters are handled correctly

### Image Deletion Logic

When images are removed:
1. System compares old images array with new images array
2. Finds images that exist in old but not in new
3. Extracts `public_id` from each removed image URL
4. Deletes images from Cloudinary
5. Continues even if one deletion fails (logs error)

### Image Upload Logic

When new images are added:
1. Files are uploaded to Cloudinary's `freelance-connect` folder
2. Cloudinary returns secure URLs
3. New URLs are added to the images array
4. Final array is saved to MongoDB

## Important Notes

### What Gets Updated
- ✅ Service title, description, category, price
- ✅ Images array (with new Cloudinary URLs)
- ✅ Removed images deleted from Cloudinary

### What Gets Preserved
- ⚠️ Service ID (unchanged)
- ⚠️ Freelancer reference (unchanged)
- ⚠️ Reviews (unchanged)
- ⚠️ Orders (unchanged)

### Validation Rules

- Title: Required, max 60 characters
- Description: Required, max 500 characters
- Category: Required
- Price: Required, max 9999.99
- Images: At least one image required (existing or new)

## Troubleshooting

### Edit Button Not Showing

**Possible Causes:**
1. You're not logged in
2. You're not the service owner
3. Service data hasn't loaded yet

**Solution:**
- Make sure you're logged in
- Verify you're viewing your own service
- Wait for the page to fully load

### Update Fails

**Possible Causes:**
1. Service doesn't exist
2. You don't own the service
3. Network error
4. Validation error
5. Cloudinary credentials incorrect

**Solution:**
- Check browser console for error messages
- Verify all required fields are filled
- Verify Cloudinary credentials in `server/nodemon.json`
- Check that at least one image is selected
- Try refreshing the page and editing again

### Images Not Updating

**Possible Causes:**
1. New images not uploaded
2. Old images not deleted
3. Cloudinary credentials incorrect

**Solution:**
- Check Cloudinary dashboard to verify uploads/deletions
- Check server logs for errors
- Verify Cloudinary credentials are correct
- Ensure images are properly selected/deselected

### Images Not Deleting from Cloudinary

**Possible Causes:**
1. URL parsing failed
2. Incorrect Cloudinary credentials
3. Image already deleted

**Solution:**
- Check server logs for parsing errors
- Verify Cloudinary credentials
- Check Cloudinary dashboard to verify deletion status

## Code Locations

### Backend
- **Schema**: `server/graphql/schema/index.js` - `updateService` mutation and `UpdateServiceInput` type
- **Resolver**: `server/graphql/resolvers/services.js` - `updateService` function
- **Models**: `server/models/service.js` - Service schema

### Frontend
- **Edit Page**: `client/src/pages/Service/EditService.js`
- **Service Page**: `client/src/pages/Service/Service.js`
- **Profile Page**: `client/src/pages/Profile/Profile.js`
- **GraphQL Query**: Defined in EditService.js

## Testing

To test the edit functionality:

1. **Create a test service**
   - Go to `/create-service`
   - Fill in details and upload images
   - Submit

2. **Edit from Service Page**
   - Navigate to `/services/{serviceId}`
   - Click "Edit Service"
   - Modify fields
   - Remove an image
   - Add a new image
   - Click "Update Service"
   - Verify changes are saved

3. **Edit from Profile Page**
   - Navigate to `/user/{userId}`
   - Click "Edit" on a service card
   - Make changes
   - Click "Update Service"
   - Verify service updates

4. **Verify Cloudinary Updates**
   - Go to Cloudinary Dashboard
   - Check Media Library → freelance-connect folder
   - Verify new images are uploaded
   - Verify removed images are deleted

5. **Verify MongoDB Updates**
   - Check MongoDB Atlas/Compass
   - Verify service document is updated
   - Verify images array contains correct URLs

## Best Practices

1. **Image Management**
   - Remove unused images to save Cloudinary storage
   - Use appropriate image formats (JPEG for photos, PNG for graphics)
   - Keep image sizes reasonable (under 2MB recommended)

2. **Service Updates**
   - Update descriptions with relevant keywords for better search
   - Keep pricing competitive and fair
   - Choose the most appropriate category

3. **Error Handling**
   - Always check for error messages
   - Verify changes were saved before navigating away
   - Keep backups of important service data

## Future Enhancements

Potential improvements:
- Bulk image upload
- Image reordering
- Image cropping/editing before upload
- Version history for service edits
- Undo changes functionality
- Preview changes before saving

---

For questions or issues, check the server logs and browser console for detailed error messages.

