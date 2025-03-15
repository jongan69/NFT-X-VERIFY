# NFT-X-VERIFY

NFT-X-VERIFY is a modern web application that enables NFT-based verification on Twitter/X. This application allows users to verify their ownership of specific Solana NFTs and connect their Twitter/X accounts, creating a secure and decentralized verification system.

## Features ✨

- **Solana NFT Integration**: Verify ownership of specific NFT collections on the Solana blockchain
- **Twitter/X OAuth**: Secure authentication with Twitter/X accounts
- **Modern Tech Stack**:
  - Next.js 14 with App Router
  - TypeScript support
  - MongoDB for data persistence
  - Radix UI Themes for a beautiful, accessible interface
  - Solana Web3.js and Metaplex for blockchain interactions
- **Security Features**:
  - Secure environment variable handling
  - OAuth 2.0 implementation
  - Blockchain signature verification
- **Developer Experience**:
  - ESLint + Prettier configuration
  - Husky pre-commit hooks
  - TypeScript strict mode
  - Hot reload development server

## Prerequisites

Before you begin, ensure you have:

- Node.js 18.x or later
- npm or pnpm package manager
- MongoDB database
- Twitter/X Developer Account with OAuth 2.0 credentials
- Solana RPC URL (can be public or private endpoint)

## Environment Setup 🔧

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Fill in the required environment variables:

- `MONGODB_URI`: Your MongoDB connection string
- `TWITTER_CLIENT_ID`: Twitter/X OAuth client ID
- `TWITTER_CLIENT_SECRET`: Twitter/X OAuth client secret
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NFT_ADDRESS`: Your Solana NFT collection address
- `SOLANA_RPC_URL`: Your Solana RPC endpoint

## Getting Started 🚀

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure 📁

- `/src` - Application source code
- `/public` - Static assets
- `/src/app` - Next.js 14 app router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib` - Utility functions and shared logic

## Scripts 📝

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prettier` - Format code with Prettier
- `npm run fix` - Run both linting and formatting

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. All rights reserved.
