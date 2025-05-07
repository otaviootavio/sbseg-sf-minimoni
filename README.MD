# Eth-PayWord: Decentralized Video Streaming with Micropayments

## Project Overview

Eth-PayWord is a video streaming platform that implements micropayments using the PayWord protocol on the blockchain. This project provides a secure, efficient, and fair method for content creators to monetize their video content while offering viewers a seamless streaming experience.

## Repository Structure

The project consists of four main components:

1. **debug-web-extension**: A React + TypeScript + Vite frontend application that serves as the user interface for the PayWord protocol implementation
2. **vite-web-extension**: A browser extension for managing hash chains that implements the PayWord payment scheme in the context of blockchain
3. **vendor-api**: A backend API server built with Hono.js that handles vendor-related operations and HLS video streaming
4. **hardhat**: Smart contract development for the Ethereum blockchain

```
.
├── docker-compose.yml
├── debug-web-extension/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── blockchain/
│   │   ├── assets/
│   │   └── ...
│   ├── public/
│   └── package.json
├── vite-web-extension/
│   ├── src/
│   ├── public/
│   ├── dist_chrome/
│   └── package.json
├── hardhat/
│   ├── contracts/
│   │   └── EthWord.sol
│   ├── test/
│   └── package.json
├── vendor-api/
│   ├── src/
│   ├── prisma/
│   ├── data/
│   │   ├── playlist.m3u8
│   │   └── segment*.ts (HLS video segments)
│   ├── docker-compose.yml
│   └── package.json
└── README.MD
```

## Setup and Installation

### Prerequisites

- Node.js
- pnpm
- Docker and Docker Compose
- ffmpeg (for HLS conversion)

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/otaviootavio/custom-hls
   cd custom-hls
   ```

2. Install dependencies for each component:

   ```bash
   # For debug-web-extension
   cd debug-web-extension
   pnpm install

   # For hardhat
   cd ../hardhat
   pnpm install
   npx hardhat compile

   # For vendor-api
   cd ../vendor-api
   pnpm install

   # For vite-web-extension
   cd ../vite-web-extension
   pnpm install
   ```

3. Initialize video for streaming:

   ```bash
   cd ../vendor-api
   ./init_video.sh
   ```

   This script downloads a sample video and converts it to HLS format.

4. Build the browser extension:
   ```bash
   cd ../vite-web-extension
   pnpm build
   ```

## Usage

### Environment Variables

**For debug-web-extension:**

- Copy the contents of `.env.example` into a new `.env` file
- This contains the API URL - for local development, set it to your local API URL

**For vendor-api:**

- Copy the contents of `.env.example` into a new `.env` file
- Contains the admin master key (currently not in use) and the database URL
- For local development, the database credentials are defined in the `docker-compose.yml` file

### MetaMask Setup

This system is integrated with the MetaMask wallet:

- Download and install MetaMask from their official website: https://metamask.io/download
- For development purposes, we use the XRPL EVM Dev Net
- Obtain free tokens from the XRPL faucet: https://bridge.xrplevm.org/

### Vendor API Setup


1. Navigate to the `vendor-api` directory

2. Start the database using Docker Compose:

   ```bash
   docker-compose up -d
   ```

3. Generate the database tables:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

### Browser Extension Setup (Chrome)
In the `vite-web-extension`, there are two build prompts:

```bash
    pnpm build:chrome
    pnpm build:firefox
```

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked" and select the `vite-web-extension/dist_chrome` directory

### Accessing the Application

To run the complete system, you need to ensure all components are properly configured and running:

1. Database (PostgreSQL):

   - Make sure the database is running via Docker Compose
   - Default port: 5432

2. Vendor API:

   - Ensure proper `.env` configuration is in place
   - Run in a dedicated terminal:
     ```bash
     cd vendor-api
     pnpm dev
     ```
   - Access the API at: http://localhost:3000
   - Access Swagger documentation at: http://localhost:3000/swagger

3. Frontend (debug-web-extension):

   - Ensure proper `.env` configuration is in place pointing to the vendor API
   - Run in a separate terminal:
     ```bash
     cd debug-web-extension
     pnpm dev
     ```
   - Access the frontend at: http://localhost:5173

4. Browser Extension:
   - Should be loaded in Chrome as described in the Browser Extension Setup section
   - Make sure it's enabled and active when accessing the frontend

Each component must be running simultaneously in separate terminals for the system to function properly.
