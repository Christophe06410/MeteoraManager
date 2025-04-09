import { walletInfo } from '../services/wallet.service.js';
import { returnToMainMenu } from '../utils/mainMenuReturn.js';
import readline from 'readline';


export async function handleWalletOperations(selectedWallets) {
    try {
        await walletInfo(selectedWallets, true);
    } catch (error) {
        console.error(`\x1b[31m~~~ [!] | ERROR | Error checking balances: ${error.message} \r\n${error.stack}\x1b[0m`);
        await pressEnterToContinue();
        returnToMainMenu();
    }
}

// Function to wait for the user to press Enter
export function pressEnterToContinue() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question('\nPress Enter to continue...', () => {
            rl.close();
            resolve();
        });
    });
}
