// src/utils/aptosClient.js
import { AptosClient } from "aptos";

export const NODE_URL = "https://fullnode.devnet.aptoslabs.com/v1"; // Devnet
export const aptosClient = new AptosClient(NODE_URL);
