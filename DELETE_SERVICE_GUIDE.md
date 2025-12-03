# Delete Service Functionality Guide

This guide explains how the service deletion feature works in FreelanceConnect.

## Overview

The delete service functionality allows service owners to permanently delete their services. When a service is deleted:

1. ✅ All images are deleted from Cloudinary
2. ✅ Service document is removed from MongoDB
3. ✅ Service reference is removed from the user's services array
4. ✅ Service references are cleaned up from reviews
5. ⚠️ Orders are preserved (for transaction history)

## How to Delete a Service

### Method 1: From Service Detail Page

1. Navigate to your service detail page (`/services/{serviceId}`)
2. If you're the owner, you'll see a **"Delete Service"** button at the top right
3. Click the button
4. Confirm the deletion in the popup dialog
5. The service and all its images will be permanently deleted
6. You'll be redirected to your profile page

### Method 2: From Your Profile Page

1. Navigate to your profile page (`/user/{userId}`)
2. Find the service you want to delete in your services grid
3. Click the **"Delete"** button in the top-right corner of the service card
4. Confirm the deletion in the popup dialog
5. The service will be removed from your profile and all images deleted

## Technical Implementation

### GraphQL Mutation

```graphql
mutation DeleteService($serviceId: ID!) {
  deleteService(serviceId: $serviceId)
}
```

### Backend Process

The deletion process follows these steps:

1. **Authentication Check**
   - Verifies user is logged in
   - Verifies user owns the service

2. **Cloudinary Image Deletion**
   - Extracts `public_id` from each image URL
   - Deletes each image from Cloudinary
   - Continues even if one image fails (logs error)

3. **MongoDB Cleanup**
   - Removes service from user's services array
   - Removes service reference from reviews
   - Deletes the service document

4. **Response**
   - Returns `true` on success
   - Throws error on failure

### Frontend Components

**Service.js** (`/client/src/pages/Service/Service.js`)
- Shows delete button for service owners
- Displays confirmation modal
- Redirects to profile after deletion

**Profile.js** (`/client/src/pages/Profile/Profile.js`)
- Shows delete button on each service card (for owner)
- Displays confirmation modal
- Refreshes service list after deletion

## Security Features

1. **Authorization Check**: Only service owners can delete their services
2. **Authentication Required**: User must be logged in
3. **Confirmation Dialog**: Prevents accidental deletions
4. **Error Handling**: Graceful error handling with user feedback

## Cloudinary URL Parsing

The system correctly extracts `public_id` from Cloudinary URLs in various formats:

- `https://res.cloudinary.com/{cloud}/image/upload/v123/{folder}/{file}.jpg`
- `https://res.cloudinary.com/{cloud}/image/upload/{folder}/{file}.jpg`
- URLs with query parameters are handled correctly

## Important Notes

### What Gets Deleted
- ✅ Service document from MongoDB
- ✅ All service images from Cloudinary
- ✅ Service reference from user's services array
- ✅ Service reference from reviews

### What Gets Preserved
- ⚠️ Orders (for transaction history)
- ⚠️ Reviews (but service reference is removed)

### Error Handling

If image deletion fails:
- Error is logged to console
- Process continues with remaining images
- Service is still deleted from MongoDB

If service deletion fails:
- Error message is shown to user
- No partial deletion occurs
- User can try again

## Troubleshooting

### Delete Button Not Showing

**Possible Causes:**
1. You're not logged in
2. You're not the service owner
3. Service data hasn't loaded yet

**Solution:**
- Make sure you're logged in
- Verify you're viewing your own service
- Wait for the page to fully load

### Deletion Fails

**Possible Causes:**
1. Service doesn't exist
2. You don't own the service
3. Network error
4. Cloudinary credentials incorrect

**Solution:**
- Check browser console for error messages
- Verify Cloudinary credentials in `server/nodemon.json`
- Try refreshing the page and deleting again

### Images Not Deleted from Cloudinary

**Possible Causes:**
1. Incorrect Cloudinary credentials
2. URL parsing failed
3. Image already deleted

**Solution:**
- Check Cloudinary dashboard to verify
- Check server logs for parsing errors
- Verify Cloudinary credentials are correct

## Code Locations

### Backend
- **Schema**: `server/graphql/schema/index.js` - `deleteService` mutation
- **Resolver**: `server/graphql/resolvers/services.js` - `deleteService` function
- **Models**: `server/models/service.js` - Service schema

### Frontend
- **Service Page**: `client/src/pages/Service/Service.js`
- **Profile Page**: `client/src/pages/Profile/Profile.js`
- **GraphQL Query**: Defined in both components

## Testing

To test the delete functionality:

1. **Create a test service**
   - Go to `/create-service`
   - Fill in details and upload images
   - Submit

2. **Delete from Service Page**
   - Navigate to `/services/{serviceId}`
   - Click "Delete Service"
   - Confirm deletion
   - Verify redirect to profile

3. **Delete from Profile Page**
   - Navigate to `/user/{userId}`
   - Click "Delete" on a service card
   - Confirm deletion
   - Verify service disappears from list

4. **Verify Cloudinary Cleanup**
   - Go to Cloudinary Dashboard
   - Check Media Library → freelance-connect folder
   - Verify images are deleted

5. **Verify MongoDB Cleanup**
   - Check MongoDB Atlas/Compass
   - Verify service document is deleted
   - Verify user's services array is updated

## Best Practices

1. **Always Confirm**: The confirmation dialog prevents accidental deletions
2. **Backup Important Data**: Consider backing up service data before deletion
3. **Handle Errors Gracefully**: The system logs errors but continues processing
4. **Test Thoroughly**: Test deletion with various image URL formats

## Future Enhancements

Potential improvements:
- Soft delete (mark as deleted instead of removing)
- Deletion history/audit log
- Bulk delete functionality
- Undo deletion (within time limit)
- Archive instead of delete

---

For questions or issues, check the server logs and browser console for detailed error messages.

