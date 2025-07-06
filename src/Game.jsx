// Game.jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  useWriteContract,
} from 'wagmi';
import { parseEther, toHex } from 'viem';
import {
  initSDK,
  createInstance,
  SepoliaConfig,
} from '@zama-fhe/relayer-sdk/bundle';
import Loading from './Loading';
import { readContract } from '@wagmi/core';
import { wagmiAdapter } from './main.jsx';
import zamaLogo from '../zama_logo.png';

import { BrowserProvider } from 'ethers';

const contractAbi = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum FHEGuessTheNumber.Difficulty",
        "name": "difficulty",
        "type": "uint8"
      }
    ],
    "name": "GamePlayed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "RewardClaimed",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum FHEGuessTheNumber.Difficulty",
        "name": "",
        "type": "uint8"
      }
    ],
    "name": "difficultySettings",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "maxNumber",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reward",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getEncryptedResult",
    "outputs": [
      {
        "internalType": "ebool",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum FHEGuessTheNumber.Difficulty",
        "name": "difficulty",
        "type": "uint8"
      },
      {
        "internalType": "externalEuint32",
        "name": "encryptedGuess",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "play",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "playerStates",
    "outputs": [
      {
        "internalType": "ebool",
        "name": "encryptedResult",
        "type": "bytes32"
      },
      {
        "internalType": "enum FHEGuessTheNumber.Difficulty",
        "name": "difficulty",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "rewardClaimed",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
]
const contractAddress = '0x06CF4a018Da230a0449aaf5ef9F2039062B4c3Fe';

const difficultySettings = [
  { name: 'Easy', range: '0-7', fee: '0.000001', reward: '0.00001' },
  { name: 'Medium', range: '0-15', fee: '0.00001', reward: '0.0001' },
  { name: 'Hard', range: '0-31', fee: '0.0001', reward: '0.001' },
];

function Game() {
  const { address } = useAccount();
  const [difficulty, setDifficulty] = useState(0);
  const [guess, setGuess] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [gameStage, setGameStage] = useState('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [zamaInstance, setZamaInstance] = useState(null);
  const [animate, setAnimate] = useState(false);

  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      setGameStage('initializing');
      setMessage('Initializing Zama SDK...');
      try {
        await initSDK();
        const config = { ...SepoliaConfig, network: window.ethereum };
        const instance = await createInstance(config);
        setZamaInstance(instance);
        setMessage('');
      } catch (e) {
        console.error('Zama SDK init failed:', e);
        setMessage('Error initializing Zama SDK. Please refresh.');
        setResult('error');
      } finally {
        setIsLoading(false);
        setGameStage('idle');
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setAnimate(false), 500);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    setAnimate(true);
  };


  async function decryptEncryptedResult({ userAddress, contractAddress, contractAbi }) {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // 1. Lấy encrypted handle từ contract
      const handle = await readContract(wagmiAdapter.wagmiConfig, {
        address: contractAddress,
        abi: contractAbi,
        functionName: 'getEncryptedResult',
        account: address,
      });

      console.log('🔒 Encrypted handle:', handle)

      // 2. Tạo Zama instance
      const instance = await createInstance({
        ...SepoliaConfig,
        network: window.ethereum,
      });

      // 3. Tạo keypair & EIP712 message
      const keypair = instance.generateKeypair();
      const startTime = Math.floor(Date.now() / 1000).toString();
      const duration = '10'; // ACL sống trong 10 ngày
      const contractAddresses = [contractAddress];

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTime,
        duration
      );

      const decryptExplainHTML = `
  🔐 <strong>Why do you need to sign?</strong><br />
  To protect your privacy, your game result is encrypted. Signing confirms you're the player and allows decryption.<br />
  <em>(No gas fee, no risk — just identity verification)</em>
`;
      setMessage(decryptExplainHTML);
      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      );

      // 4. Gửi request giải mã đến relayer
      const result = await instance.userDecrypt(
        [{ handle, contractAddress }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        userAddress,
        startTime,
        duration
      );

      const decrypted = result[handle]; // boolean
      console.log('🔓 Decrypted result:', decrypted);
      return decrypted;
    } catch (err) {
      console.error('❌ Decrypt error:', err);
      throw err;
    }
  }

  const handlePlay = async () => {
    const guessNum = parseInt(guess);
    const min = 0;
    const max = [7, 15, 31][difficulty];
    if (isNaN(guessNum) || guessNum < min || guessNum > max) {
      alert(`Enter a number from ${min} to ${max}.`);
      return;
    }
    if (!address) {
      alert('Connect your wallet.');
      return;
    }
    if (!zamaInstance) {
      alert('Zama SDK not ready. Refresh and try again.');
      return;
    }

    setIsLoading(true);
    setGameStage('encrypting');
    setResult(null);
    setIsGameFinished(false);
    setMessage('Encrypting your guess...');

    setTimeout(async () => {
      try {
        const buffer = zamaInstance.createEncryptedInput(contractAddress, address);
        buffer.add32(guessNum);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Encryption timed out after 20 seconds.')), 20000)
        );

        // Race encryption against the timeout
        const { handles, inputProof } = await Promise.race([
          buffer.encrypt(),
          timeoutPromise,
        ]);

        const handleHex = toHex(handles[0]);
        const proofHex = toHex(inputProof);
        const selectedFee = difficultySettings[difficulty].fee;

        setGameStage('submitting');
        setMessage('Submitting encrypted guess to blockchain...');

        await writeContractAsync({
          address: contractAddress,
          abi: contractAbi,
          functionName: 'play',
          args: [difficulty, handleHex, proofHex],
          value: parseEther(selectedFee),
        });

        setGameStage('waiting');
        setMessage('🧠 Waiting for result...');

        setTimeout(async () => {
          try {
            const won = await decryptEncryptedResult({
              userAddress: address,
              contractAddress,
              contractAbi,
            });

            if (won) {
              setResult('success');
              setMessage('🎉 You won! Claiming your reward...');
              try {
                await writeContractAsync({
                  address: contractAddress,
                  abi: contractAbi,
                  functionName: 'claimReward',
                  args: [address],
                });
                setMessage('✅ Reward claimed successfully!');
              } catch (claimError) {
                console.error('Claim reward error:', claimError);
                setMessage('⚠️ You won, but failed to claim reward. Please try again manually.');
              }
            } else {
              setResult('error');
              setMessage('❌ Wrong guess!');
            }
            setGameStage('finished');
            setIsGameFinished(true);
            setIsLoading(false);
          } catch (err) {
            console.error('Decrypt error:', err);
            setResult('error');
            setMessage('Error decrypting result');
            setIsLoading(false);
          }
        }, 1000); // wait for relayer
      } catch (err) {
        console.error('[DEBUG] Encryption or tx error:', err);
        setResult('error');
        setMessage(`Error: ${err.message}`);
        setGameStage('idle');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="game-container">
      {isLoading && <Loading message={message} />}
      <div className="game-header">
        <img src={zamaLogo} alt="Zama Logo" className="zama-logo" />
        <h2>FHE Guessing Game</h2>
      </div>

      <div className="difficulty-selector">
        {difficultySettings.map((level, idx) => (
          <button
            key={level.name}
            className={difficulty === idx ? 'selected' : ''}
            onClick={() => handleDifficultyChange(idx)}
          >
            {level.name}
          </button>
        ))}
      </div>

      <div className="difficulty-details">
        <div className="detail-item">
          <span>Range</span>
          <strong className={animate ? 'animate-shake' : ''}>{difficultySettings[difficulty].range}</strong>
        </div>
        <div className="detail-item">
          <span>Fee</span>
          <strong className={animate ? 'animate-shake' : ''}>{difficultySettings[difficulty].fee} ETH</strong>
        </div>
        <div className="detail-item">
          <span>Reward</span>
          <strong className={animate ? 'animate-shake' : ''}>{difficultySettings[difficulty].reward} ETH</strong>
        </div>
      </div>

      <div className="play-area">
        <h3>Enter your guess</h3>
        <input
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="#"
        />
        <button
          className="play-button"
          onClick={handlePlay}
          disabled={isLoading || isGameFinished}
        >
          {gameStage === 'encrypting'
            ? 'Encrypting...'
            : gameStage === 'submitting'
              ? 'Submitting...'
              : gameStage === 'waiting'
                ? 'Waiting...'
                : 'Play'}
        </button>
      </div>

      {!isLoading && message && <div className={`result ${result}`}>{message}</div>}

      {isGameFinished && (
        <button className="play-again-button" onClick={() => {
          setGuess('');
          setResult(null);
          setIsGameFinished(false);
          setGameStage('idle');
          setMessage('');
        }}>
          Play Again
        </button>
      )}
    </div>
  );
}

export default Game;
