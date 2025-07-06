# Zama FHE Guessing Game

This project is a decentralized "Guess the Number" game that showcases the power of **Fully Homomorphic Encryption (FHE)** using [Zama's technology](https://www.zama.ai/).

In this game, players try to guess a secret number. The twist is that the guess is encrypted on the client-side before being sent to the blockchain. The smart contract can then determine if the guess is correct *without ever decrypting it*, ensuring complete privacy for the player's input.

## 🎮 Live Demo

You can try the game live at: **[fhegame.vercel.app](https://fhegame.vercel.app/)**

![Game Screenshot](./demo.jpeg)

## ✨ Key Features

-   **Privacy-Preserving Gameplay**: Your guess is never revealed to the server, the blockchain, or anyone else.
-   **On-Chain Logic with FHE**: The core game logic is executed in a smart contract using encrypted data.
-   **Three Difficulty Levels**: Choose between Easy, Medium, and Hard, each with different ranges, fees, and rewards.
-   **Wallet Integration**: Connects with popular wallets like MetaMask, OKX, and Rabby Wallet.
-   **Built with Modern Tech**: Crafted with React, Vite, and Wagmi for a smooth developer and user experience.

## 🚀 How It Works

1.  **Connect Wallet**: The user connects their Ethereum wallet.
2.  **Choose Difficulty**: The player selects a difficulty level, which sets the number range and the game fee/reward.
3.  **Encrypt Guess**: The player enters a number. Using the Zama Relayer SDK, this number is encrypted directly in the browser.
4.  **Submit Transaction**: The encrypted guess is sent to the smart contract on the Sepolia testnet. A small fee is paid for the transaction.
5.  **On-Chain FHE Comparison**: The smart contract compares the encrypted guess with the encrypted secret number. Because of FHE, it can do this comparison without decrypting either value.
6.  **Decrypt Result**: The result (win or lose) is stored as an encrypted boolean. The player signs a message (gas-free) to prove ownership and decrypts the result locally.
7.  **Claim Reward**: If the guess was correct, the player automatically claims the ETH reward.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite
-   **Blockchain Interaction**: Wagmi, Viem, Ethers.js
-   **FHE Provider**: Zama Relayer SDK (`@zama-fhe/relayer-sdk`)
-   **Wallet Connection**: AppKit (`@reown/appkit`)
-   **Styling**: CSS with a custom dark theme

## ⚙️ Running the Project Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/zama_guess_game.git
    cd zama_guess_game
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to the local URL provided. You will need a browser wallet like MetaMask connected to the Sepolia testnet to play.