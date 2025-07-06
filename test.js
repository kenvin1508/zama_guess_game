import { ethers } from "ethers";

// 1. Contract ABI
const contractAbi = [
    {
        "inputs": [],
        "name": "getEncryptedResult",
        "outputs": [{ "internalType": "ebool", "name": "", "type": "bytes32" }],
        "stateMutability": "view",
        "type": "function"
    }
];

// 2. Hàm gọi getEncryptedResult()
async function getEncryptedResultFromContract() {

    const provider = new ethers.JsonRpcProvider("https://rpc.ankr.com/eth_sepolia/a1e341061e4192c07efe6e04c725bc0740447716adc50f9bd4da50de8b252b61");
    const contractAddress = "0x06CF4a018Da230a0449aaf5ef9F2039062B4c3Fe";
    const userAddress = "0x3D8FEf6084628b639A26Cb6782D840E2f3625953";

    const contract = new ethers.Contract(contractAddress, contractAbi, provider);

    try {
        // Kết quả trả về là `bytes32`, đại diện cho `ebool`
        const encrypted = await contract.connect(provider).getEncryptedResult({ from: userAddress });
        console.log("Encrypted result:", encrypted);
        return encrypted;
    } catch (error) {
        console.error("Error reading encrypted result:", error);
        throw error;
    }
}

getEncryptedResultFromContract()
