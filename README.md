# TrackPharma: Blockchain Pharma Trace + AI Inventory


## Overview

**TrackPharma** combines blockchain-based medicine batch traceability with AI-assisted inventory management for pharmacies and distributors. Each batch is recorded as an ERC-721 NFT on Ethereum testnet, enabling QR-based authenticity verification. The AI layer predicts stockouts, flags expiry risks, generates alerts, and suggests generic brand alternatives.


## Features

- **Blockchain Traceability**: ERC-721 smart contracts track batch origin, transfers, and ownership
- **QR Verification**: Scan batch QR to view complete provenance and current status
- **Smart Inventory**: Per-location stock tracking with consumption history
- **Risk Scoring**: Rule-based LOW/MEDIUM/HIGH risk assessment (stockout + expiry)
- **Automated Alerts**: Cron-scheduled notifications for critical items
- **Alternative Suggestions**: Generic brand substitution using Indian medicine dataset

## Tech Stack

```
Frontend: Next.js 13+ (TypeScript) | React | MUI 5+ | react-qr-code | wagmi
Backend: Next.js API routes | MongoDB Atlas
Blockchain: Solidity (ERC-721) | Hardhat | Goerli/Sepolia testnets
Deployment: Vercel
```

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- MetaMask wallet
- Yarn/NPM

### 1. Clone & Install
```bash
git clone https://github.com/smyaseen/Blockchain-Integrated-Pharmaceutical-Supply-Chain-Track-Traceability
cd Blockchain-Integrated-Pharmaceutical-Supply-Chain-Track-Traceability
yarn install
```

### 2. Environment Setup
Copy `.env.example` to `.env.local` and fill:
```
MONGODB_URI=your_mongodb_atlas_connection_string
NEXT_PUBLIC_ALCHEMY_URL=your_alchemy_goerli_url
PRIVATE_KEY=your_wallet_private_key
```

### 3. Smart Contracts (Hardhat)
```bash
# Terminal 1: Start Hardhat node
cd smartcontract
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Deployed Contract**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### 4. Run Frontend
```bash
yarn dev
```

### 5. Seed Data
Import Indian medicine dataset and create sample stock records via admin UI or seed script.

## Architecture

```
Manufacturer → Mint ERC-721 Batch → QR Code → Distributor → Pharmacy
                    ↓
                MongoDB Index
                    ↓
Next.js Frontend ← wagmi ← Blockchain Events
                    ↓
             AI Risk Scoring + Alerts
```

## AI Features Explained

### Risk Scoring Rules
```
Stockout: <3d(+60pts) | 3-7d(+30pts)
Expiry: <15d(+30pts) | 15-30d(+15pts)
HIGH: ≥60pts | MEDIUM: 30-59pts | LOW: <30pts
```

### Alternative Logic
```
Priority 1: Same generic + strength + form
Priority 2: Same generic + similar strength
Only in-stock alternatives at target location
```

## Collections (MongoDB)

- `batches`: Blockchain events + metadata
- `stocks`: Location-wise inventory + consumption history
- `medicines`: Kaggle Indian medicine dataset
- `alerts`: Generated risk notifications

## API Endpoints

```
POST /api/risk-score      # Get risk level for drug/location
POST /api/alternatives    # Generic substitution suggestions
GET  /api/alerts          # Open alerts dashboard
POST /api/cron/scan-stock # Scheduled risk scanning
```

## Screenshots





## Future Work

- IoT sensor integration (temperature/humidity monitoring)
- ML demand forecasting (replace rule-based stockout prediction)
- WhatsApp/Email alert delivery
- Multi-chain support (Polygon, etc.)

## License

MIT License - see `LICENSE` file.

***

**Reduces counterfeits, prevents stockouts, minimizes expiry waste** 🚀
