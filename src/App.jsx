import { useAccount } from 'wagmi';
import Game from './Game';

function App() {
  const { isConnected } = useAccount();

  return (
    <div className="app-container">
      <div className="wallet-button-container">
        <appkit-button />
      </div>
      <main className="main-content">
        {isConnected ? (
          <Game />
        ) : (
          <div className="connect-prompt">
            <h1>Welcome to the FHE Guessing Game</h1>
            <p>Please connect your wallet to play.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
