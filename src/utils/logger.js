import { WALLETS } from '../config/index.js';
import { getSolBalance } from './getBalance.js';
import { question } from './question.js';

export async function logWallets() {
    console.log("\nAFFORDABLE WALLETS: \n=========================");
    for (const [key, value] of Object.entries(WALLETS)) {
        const balance = await getSolBalance(value.description);
        console.log(`${key}: ${value.description.slice(0, 4)}...${value.description.slice(-4)} [\x1b[32m${balance.toFixed(2)} SOL\x1b[0m]`);
    }
}

export async function selectWallets() {
    await logWallets();

    const walletInput = await question("\n[...] Enter wallet numbers separated by commas (1,2,3) or '0' for all: ");
    
    if (walletInput === '0') {
        return Object.values(WALLETS);
    }
    
    return walletInput.split(',')
        .map(num => num.trim())
        .map(num => {
            const wallet = WALLETS[num];
            if (!wallet) throw new Error(`[!] [${num}] Wallet not found.`);
            return wallet;
        });
}

export async function displayLogo() {
    process.stdout.write('\x1Bc');
    console.log(`
\x1b[36m
   ▄████████    ▄████████  ▄████████     ███      ▄██████▄     ▄████████ 
  ███    ███   ███    ███ ███    ███ ▀█████████▄ ███    ███   ███    ███ 
  ███    █▀    ███    █▀  ███    █▀     ▀███▀▀██ ███    ███   ███    ███ 
  ███         ▄███▄▄▄     ███            ███   ▀ ███    ███  ▄███▄▄▄▄██▀ 
▀███████████ ▀▀███▀▀▀     ███            ███     ███    ███ ▀▀███▀▀▀▀▀   
         ███   ███    █▄  ███    █▄      ███     ███    ███ ▀███████████ 
   ▄█    ███   ███    ███ ███    ███     ███     ███    ███   ███    ███ 
 ▄████████▀    ██████████ ████████▀     ▄████▀    ▀██████▀    ███    ███ 
                                                               ███    ███ \x1b[0m

\x1b[33m=================================================================
                Created by SECTOR | @sectordot
                TG: https://t.me/sectormoves
=================================================================\x1b[0m

`);
}

export async function strategyType() {
    console.log('\n[...] Choose a strategy: ');
    console.log('1. SPOT');
    console.log('2. BIDASK');
    const strategyType = await question("\n[...] Enter strategy number: ");
    if (strategyType === '1' || strategyType === '2') {
        return strategyType;
    } else {
        throw new Error('[!] [strategyType] Strategy not found.');
    }
}