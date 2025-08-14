import { AptosClient, TxnBuilderTypes, BCS } from "aptos";

// Change this to your node endpoint (Devnet/Testnet/Mainnet)
const NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1";
const aptosClient = new AptosClient(NODE_URL);

function getAptosWallet() {
  if ("aptos" in window) {
    return window.aptos;
  } else {
    alert("Petra wallet not found! Install it from https://petra.app/");
    throw new Error("Petra wallet not installed");
  }
}

export async function connectWallet() {
  const wallet = getAptosWallet();
  return await wallet.connect();
}

export async function getAccount() {
  const wallet = getAptosWallet();
  return await wallet.account();
}

// ✅ New version: Simulate first, then submit
export async function signAndSubmitTransaction(tx) {
  try {
    const wallet = getAptosWallet();
    const account = await wallet.account();

    // Build transaction payload
    const transactionPayload = {
      type: "entry_function_payload",
      function: tx.function,
      arguments: tx.arguments || [],
      type_arguments: tx.type_arguments || []
    };

    // 1️⃣ Simulate to get required gas values
    const simulated = await wallet.signTransaction({ payload: transactionPayload });
    const simResult = await aptosClient.simulateTransaction(account.address, simulated);

    if (!simResult || simResult.length === 0) {
      throw new Error("Gas simulation failed");
    }

    // Use simulated gas values
    const maxGas = simResult[0].max_gas_amount;
    const gasPrice = simResult[0].gas_unit_price;

    console.log(`Simulation: max_gas_amount=${maxGas}, gas_unit_price=${gasPrice}`);

    // 2️⃣ Submit with safe gas buffer
    const finalTx = {
      type: "entry_function_payload",
      function: tx.function,
      arguments: tx.arguments || [],
      type_arguments: tx.type_arguments || [],
      max_gas_amount: (parseInt(maxGas) + 1000).toString(), // buffer to avoid failure
      gas_unit_price: gasPrice.toString()
    };

    const response = await wallet.signAndSubmitTransaction({ payload: finalTx });
    console.log("Transaction submitted:", response);

    return response;
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

export async function isConnected() {
  const wallet = getAptosWallet();
  return await wallet.isConnected();
}
