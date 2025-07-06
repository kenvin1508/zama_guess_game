import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './style.css';

import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// 1. Get projectId from https://cloud.reown.com
// TODO: Get your own Project ID at https://cloud.reown.com
const projectId = '830e803dc970b81ffb2476d7014165ca';

// 2. Create a metadata object
const metadata = {
  name: 'Zama Guess Game',
  description: 'A simple number guessing game on the blockchain.',
  url: window.location.host, // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932'] // Example icon
};

// 3. Set the networks
const networks = [sepolia];

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  // ssr: true, // Only for Next.js
});

const ID_METAMASK = 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'
const ID_OKX = '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709'
const ID_RABBY = '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1'

// 5. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  includeWalletIds: [ID_METAMASK, ID_OKX, ID_RABBY],
  featuredWalletIds: [ID_METAMASK, ID_OKX, ID_RABBY],
  allWallets: 'HIDE', // ẩn nút "All Wallets"
  // Optional features
  // features: {
  //   analytics: true 
  // }
});

// 6. Setup QueryClient
const queryClient = new QueryClient();

// 7. Create a custom AppKitProvider
function AppKitProvider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppKitProvider>
      <App />
    </AppKitProvider>
  </React.StrictMode>,
);
