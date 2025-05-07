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
│   └── package.json
└── README.MD
```

## Setup and Installation

### Development enviroment

- Ubuntu 24
- Node.js (v22)
- pnpm
- ffmpeg (for HLS conversion)

### Installing Node.js with NVM

We recommend installing Node.js using NVM (Node Version Manager):

1. Download and install NVM:

   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
   ```

   or

   ```bash
   wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
   ```

2. Open and close the terminal to start using nvm

3. Verify NVM installation:

   ```bash
   nvm --version
   ```

4. Install Node.js v22:

   ```bash
   nvm install 22
   nvm use 22
   ```

For more information, visit the [NVM GitHub page](https://github.com/nvm-sh/nvm).

### Installing Additional Tools

#### pnpm

Install pnpm globally using npm:

```bash
npm i -g pnpm
```

> Note: You may see a warning about a new major version of npm being available. This can be safely ignored.

#### ffmpeg

Install ffmpeg using apt:

```bash
sudo apt install ffmpeg
```

#### git

Install git using apt:

```bash
sudo apt install git
```

### Installation Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/otaviootavio/sbseg-sf-minimoni
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

   # For vendor-api
   cd ../vendor-api
   pnpm install

   # For vite-web-extension
   cd ../vite-web-extension
   pnpm install
   ```

3. Compile the smart contracts:

   ```bash
   cd ../hardhat
   npx hardhat compile
   ```

4. Initialize video for streaming:

   ```bash
   cd ../vendor-api
   ./init_video.sh
   ```

   This script downloads a sample video and converts it to HLS format.

5. Build the browser extension:
   ```bash
   cd ../vite-web-extension
   pnpm build
   ```

## Usage

### Environment Variables

**For debug-web-extension:**

- Copy the contents of `.env.example` into a new `.env` file
- This contains the API URL used for local development

**For vendor-api:**

- Copy the contents of `.env.example` into a new `.env` file
- Contains the admin master key (currently not in use) and the database URL

### MetaMask Setup

This system is integrated with the MetaMask wallet:

- Download and install MetaMask from their official website: https://metamask.io/download
- For development purposes, we use the XRPL EVM Dev Net
- Obtain free tokens from the XRPL faucet: https://bridge.xrplevm.org/

### Vendor API Setup

1. Navigate to the `vendor-api` directory

2. Generate the database tables:

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


1. Vendor API:

   - Ensure proper `.env` configuration is in place
   - Run in a dedicated terminal:
     ```bash
     cd vendor-api
     pnpm dev
     ```
   - Access the API at: http://localhost:3000
   - Access Swagger documentation at: http://localhost:3000/swagger

2. Frontend (debug-web-extension):

   - Ensure proper `.env` configuration is in place pointing to the vendor API
   - Run in a separate terminal:
     ```bash
     cd debug-web-extension
     pnpm dev
     ```
   - Access the frontend at: http://localhost:5173

3. Browser Extension:
   - Should be loaded in Chrome as described in the Browser Extension Setup section

Each component must be running simultaneously in separate terminals for the system to function properly.
