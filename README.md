# StreamSync - Centralized Streaming Platform

StreamSync is a centralized streaming platform that empowers users to upload videos along with their thumbnails. Additionally, it features a community-centric tweeting feature, allowing users to post tweets that can be commented on and reposted by the community.

## Features

- **Video Upload:** Seamlessly upload videos to the platform.
- **Thumbnail Upload:** Upload and associate thumbnails with your videos for a visually appealing experience.
- **Tweeting Feature:** Engage with the community by posting tweets, commenting, and reposting content.
- **Authentication:** Secure your account with JWT-based authentication.

## Tech Stack

- **ReactJS:** Building dynamic and interactive user interfaces.
- **TailwindCSS:** A utility-first CSS framework for streamlined styling.
- **ExpressJS:** Fast, unopinionated, minimalist web framework for Node.js.
- **NodeJS:** JavaScript runtime for server-side development.
- **MongoDB:** NoSQL database for storing application data.
- **Mongoose:** Elegant MongoDB object modeling for Node.js.
- **Cloudinary:** Cloud-based image and video management for efficient media handling.
- **Multer:** Middleware for handling multipart/form-data, used for image uploads.
- **JWT (JSON Web Tokens):** Securely transmitting information between parties.

## Getting Started

To get the project up and running on your local machine, follow these steps:

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/StreamSync.git
   ```

2. Install dependencies for the server:

   ```bash
   cd StreamSync/server
   npm install
   ```

3. Install dependencies for the client:

   ```bash
   cd ../client
   npm install
   ```

4. Set up your MongoDB database and Cloudinary account, and update the configuration files.

5. Start the server:

   ```bash
   cd ../server
   npm run dev
   ```

6. Start the client:

   ```bash
   cd ../client
   npm start
   ```

7. Open your browser and navigate to `http://localhost:3000/` to access StreamSync.

## Contributing

We welcome contributions! To contribute to StreamSync, please follow our [contribution guidelines](CONTRIBUTING.md).
