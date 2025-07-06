// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FHEGuessTheNumber is SepoliaConfig, Ownable {
    enum Difficulty {
        Easy,
        Medium,
        Hard
    }

    struct GameConfig {
        uint32 maxNumber;
        uint256 fee;
        uint256 reward;
    }

    struct GameState {
        ebool encryptedResult;
        Difficulty difficulty;
        bool rewardClaimed;
        bool decryptionRequested;
    }

    mapping(Difficulty => GameConfig) public difficultySettings;
    mapping(address => GameState) public playerStates;

    /// Track who requested which decryption
    mapping(uint256 => address) public pendingDecryptionRequests;

    event GamePlayed(address indexed player, Difficulty difficulty);
    event DecryptionRequested(address indexed player, uint256 requestId);
    event RewardClaimed(address indexed player, uint256 amount);

    constructor() SepoliaConfig() Ownable(msg.sender) {
        difficultySettings[Difficulty.Easy] = GameConfig(10, 0.000001 ether, 0.00001 ether);
        difficultySettings[Difficulty.Medium] = GameConfig(50, 0.00001 ether, 0.0001 ether);
        difficultySettings[Difficulty.Hard] = GameConfig(100, 0.0001 ether, 0.001 ether);
    }

    function play(Difficulty difficulty, externalEuint32 encryptedGuess, bytes calldata inputProof) external payable {
        GameConfig memory config = difficultySettings[difficulty];
        require(msg.value == config.fee, "Incorrect fee");

        euint32 guess = FHE.fromExternal(encryptedGuess, inputProof);
        euint32 max = FHE.asEuint32(config.maxNumber);
        ebool isValid = FHE.le(guess, max);

        FHE.allow(isValid, msg.sender);
        FHE.allowThis(isValid);

        euint32 secret = FHE.randEuint32(config.maxNumber + 1);
        ebool isCorrect = FHE.eq(guess, secret);

        FHE.allow(isCorrect, msg.sender);
        FHE.allowThis(isCorrect);

        playerStates[msg.sender] = GameState({
            encryptedResult: isCorrect,
            difficulty: difficulty,
            rewardClaimed: false,
            decryptionRequested: false
        });

        emit GamePlayed(msg.sender, difficulty);
    }

    function getEncryptedResult() external view returns (ebool) {
        return playerStates[msg.sender].encryptedResult;
    }

    function requestDecryptResult() external {
        GameState storage game = playerStates[msg.sender];
        require(!game.rewardClaimed, "Already claimed");
        require(!game.decryptionRequested, "Already requested");

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(game.encryptedResult);

        uint256 requestId = FHE.requestDecryption(cts, this.callbackDecryptResult.selector);
        game.decryptionRequested = true;
        pendingDecryptionRequests[requestId] = msg.sender;

        emit DecryptionRequested(msg.sender, requestId);
    }

    function callbackDecryptResult(
        uint256 requestId,
        bool[] calldata clearValues,
        bytes[] calldata signatures
    ) external {
        require(clearValues.length == 1, "Invalid result count");

        FHE.checkSignatures(requestId, signatures);

        bool isCorrect = clearValues[0];
        address player = pendingDecryptionRequests[requestId];
        require(player != address(0), "Unknown request");

        GameState storage game = playerStates[player];
        require(!game.rewardClaimed, "Already claimed");

        if (isCorrect) {
            game.rewardClaimed = true;

            GameConfig memory config = difficultySettings[game.difficulty];
            payable(player).transfer(config.reward);

            emit RewardClaimed(player, config.reward);
        }

        // Clean up
        delete pendingDecryptionRequests[requestId];
    }

    /// Simulate correct guess (testing only)
    function fakeCorrectGuess(address player, Difficulty difficulty) external onlyOwner {
        ebool isCorrect = FHE.asEbool(true);
        FHE.allow(isCorrect, player);
        FHE.allowThis(isCorrect);

        playerStates[player] = GameState({
            encryptedResult: isCorrect,
            difficulty: difficulty,
            rewardClaimed: false,
            decryptionRequested: false
        });

        emit GamePlayed(player, difficulty);
    }

    receive() external payable {}
}
