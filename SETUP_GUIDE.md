# Setup Guide: Environment Variables Configuration

This guide will walk you through setting up all the required environment variables for FreelanceConnect.

## Table of Contents

1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Cloudinary Setup](#2-cloudinary-setup)
3. [JWT Key Generation](#3-jwt-key-generation)
4. [Configuration File Setup](#4-configuration-file-setup)

---

## 1. MongoDB Atlas Setup

MongoDB Atlas is a cloud-based MongoDB service. Follow these steps to set it up:

### Step 1: Create a MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign Up"**
3. Sign up with your email or use Google/GitHub authentication

### Step 2: Create a New Cluster

1. After logging in, click **"Build a Database"**
2. Choose the **FREE (M0)** tier
3. Select a cloud provider and region (choose one closest to you)
4. Click **"Create"** (cluster name will be auto-generated like "Cluster0")

### Step 3: Create Database User

1. In the **"Database Access"** section (left sidebar), click **"Add New Database User"**
2. Choose **"Password"** authentication method
3. Enter a username (e.g., `freelanceconnect`)
4. Click **"Autogenerate Secure Password"** or create your own strong password
5. **IMPORTANT:** Copy and save this password - you won't see it again!
6. Under "Database User Privileges", select **"Atlas admin"** or **"Read and write to any database"**
7. Click **"Add User"**

**Values you'll need:**

- `MONGO_ATLAS_USER` = The username you created (e.g., `freelanceconnect`)
- `MONGO_ATLAS_PW` = The password you created/saved

### Step 4: Configure Network Access

1. Go to **"Network Access"** section (left sidebar)
2. Click **"Add IP Address"**
3. For local development, click **"Add Current IP Address"**
4. Or click **"Allow Access from Anywhere"** (0.0.0.0/0) - **Note:** This is less secure but convenient for development
5. Click **"Confirm"**

### Step 5: Get Your Connection String

1. Go to **"Database"** section (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string (it will look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 6: Create Your Database

1. The database name will be created automatically when you first connect
2. Or you can specify it in the connection string: `mongodb+srv://...@cluster0.xxxxx.mongodb.net/your_database_name?retryWrites=true&w=majority`

**Value you'll need:**

- `MONGO_ATLAS_DB` = Your database name (e.g., `freelanceconnect` or `freelance-connect`)

**Note:** The current `app.js` has a hardcoded cluster URL (`cluster0.y16icjh.mongodb.net`). If you're using a different cluster, you'll need to update the connection string in `server/app.js`.

---

## 2. Cloudinary Setup

Cloudinary is used for image upload and storage. Follow these steps:

### Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **"Sign Up for Free"**
3. Fill in your details and verify your email

### Step 2: Access Your Dashboard

1. After logging in, you'll be taken to your dashboard
2. On the dashboard, you'll see your account details

### Step 3: Get Your Credentials

1. In the dashboard, you'll see:

   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

2. If you don't see them immediately:
   - Click on your account name (top right)
   - Go to **"Dashboard"** or **"Settings"**
   - The credentials are displayed there

**Values you'll need:**

- `CLOUDINARY_NAME` = Your Cloud Name
- `CLOUDINARY_API_KEY` = Your API Key
- `CLOUDINARY_API_SECRET` = Your API Secret

**Security Note:** Keep your API Secret private and never commit it to version control!

---

## 3. JWT Key Generation

JWT (JSON Web Token) key is used for authentication. You can generate a secure random string.

### Option 1: Using Node.js (Recommended)

Open a terminal and run:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

This will generate a 128-character hexadecimal string. Copy this value.

### Option 2: Using OpenSSL

```bash
openssl rand -hex 64
```

### Option 3: Online Generator

1. Go to [https://randomkeygen.com](https://randomkeygen.com)
2. Use a **"CodeIgniter Encryption Keys"** or generate a random 64+ character string

### Option 4: Manual Creation

Create any long, random string (at least 32 characters, recommended 64+). For example:

```
my-super-secret-jwt-key-for-freelanceconnect-2024-production
```

**Value you'll need:**

- `JWT_KEY` = The generated random string

**Security Note:** Use a strong, unique key. Never use the example above in production!

---

## 4. Configuration File Setup

Based on the README, this project uses `nodemon.json` for environment variables. Here's how to set it up:

### Step 1: Create nodemon.json

Create a file named `nodemon.json` in the **server** directory with the following structure:

```json
{
  "env": {
    "MONGO_ATLAS_USER": "your_mongo_username",
    "MONGO_ATLAS_PW": "your_mongo_password",
    "MONGO_ATLAS_DB": "your_database_name",
    "CLOUDINARY_API_KEY": "your_cloudinary_api_key",
    "CLOUDINARY_API_SECRET": "your_cloudinary_api_secret",
    "CLOUDINARY_NAME": "your_cloudinary_name",
    "JWT_KEY": "your_jwt_secret_key"
  }
}
```

### Step 2: Replace Placeholder Values

Replace each placeholder with the actual values you obtained from the steps above:

- `your_mongo_username` → Your MongoDB Atlas username
- `your_mongo_password` → Your MongoDB Atlas password
- `your_database_name` → Your MongoDB database name (e.g., `freelanceconnect`)
- `your_cloudinary_api_key` → Your Cloudinary API Key
- `your_cloudinary_api_secret` → Your Cloudinary API Secret
- `your_cloudinary_name` → Your Cloudinary Cloud Name
- `your_jwt_secret_key` → Your generated JWT key

### Step 3: Verify the File Location

Make sure `nodemon.json` is in the `server/` directory:

```
FreelanceConnect/
  └── server/
      ├── nodemon.json  ← Should be here
      ├── app.js
      └── package.json
```

### Step 4: Security Reminder

The `.gitignore` file already includes `server/nodemon.json`, so your credentials won't be committed to git. This is good for security!

---

## Quick Reference: Example Values

Here's what your `nodemon.json` might look like (with example values):

```json
{
  "env": {
    "MONGO_ATLAS_USER": "freelanceconnect",
    "MONGO_ATLAS_PW": "MySecureP@ssw0rd123",
    "MONGO_ATLAS_DB": "freelanceconnect",
    "CLOUDINARY_API_KEY": "123456789012345",
    "CLOUDINARY_API_SECRET": "abcdefghijklmnopqrstuvwxyz123456",
    "CLOUDINARY_NAME": "dxyz123abc",
    "JWT_KEY": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
  }
}
```

**Remember:** Replace these with your actual values!

---

## Troubleshooting

### MongoDB Connection Issues

- Verify your IP address is whitelisted in MongoDB Atlas Network Access
- Check that your username and password are correct
- Ensure the database name is correct
- If using a different cluster, update the connection string in `server/app.js`

### Cloudinary Upload Issues

- Verify all three Cloudinary credentials are correct
- Check that your Cloudinary account is active
- Ensure you're using the correct cloud name (not the account email)

### JWT Authentication Issues

- Make sure your JWT_KEY is long enough (at least 32 characters)
- Don't use special characters that might cause issues in JSON (though hex strings are safe)

---

## Next Steps

After setting up all the environment variables:

1. Make sure `nodemon.json` is properly configured in the `server/` directory
2. Start the server: `cd server && npm start`
3. Start the client: `cd client && npm start`
4. Access the application at `http://localhost:3000`

Good luck with your project! 🚀
