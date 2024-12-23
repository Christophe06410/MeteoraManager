import { PublicKey } from "@solana/web3.js";
import { question } from '../utils/question.js';
import { Keypair } from "@solana/web3.js";
import bs58 from 'bs58';
import { getFullPosition } from '../utils/GetPosition.js';
import { processRemoveLiquidity } from '../services/position.service.js';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function handleWalletsWithPosition(walletsWithPosition, poolAddress) {
    if (walletsWithPosition.length === 0) {
        return [];
    }

    console.log("\n\x1b[31m~~~ [!] | ERROR | Следующие кошельки все еще имеют позицию:\x1b[0m");
    walletsWithPosition.forEach(wallet => console.log(`- ${wallet.description}`));
    
    const action = await question("\nВыберите действие:\n1. Перепроверить позиции\n2. Повторно удалить ликвидность\n3. Пропустить\nВаш выбор (1-3): ");
    
    if (action === "1" || action === "2") {
        const remainingWallets = [];
        const checkPromises = walletsWithPosition.map(async wallet => {
            if (action === "2") {
                try {
                    await processRemoveLiquidity(wallet, poolAddress);
                    await delay(5000);
                } catch (error) {
                    console.error(`\x1b[31m~~~ [!] | ERROR | [${wallet.description.slice(0, 4)}...] | Ошибка при повторном удалении ликвидности: ${error.message}\x1b[0m`);
                }
            }
            
            const user = Keypair.fromSecretKey(new Uint8Array(bs58.decode(wallet.privateKey)));
            const position = await getFullPosition(user, poolAddress);
            if (position) {
                remainingWallets.push(wallet);
            }
        });

        await Promise.all(checkPromises);
        
        if (remainingWallets.length > 0) {
            return await handleWalletsWithPosition(remainingWallets, poolAddress);
        } else {
            console.log(`\n\x1b[36m[${new Date().toLocaleTimeString()}] | SUCCESS | Все позиции успешно удалены\x1b[0m`);
            return [];
        }
    }
    
    return walletsWithPosition; // Возвращаем исходный список, если выбран пропуск
}

export async function handleRemovePosition(selectedWallets, predefinedPool = null) {
    try {        
        const poolAddress = predefinedPool || await question("\n[...] Введите адрес пула для удаления позиции: ");
        if (!poolAddress || poolAddress.trim() === '') {
            throw new Error("Адрес пула не может быть пустым");
        }

        let validPoolAddress;
        try {
            validPoolAddress = new PublicKey(poolAddress.trim());
        } catch (error) {
            throw new Error(`Некорректный адрес пула: ${error.message}`);
        }

        const walletsWithPosition = [];
        
        // Проверяем все кошельки на наличие позиций
        const checkPromises = selectedWallets.map(async wallet => {
            const user = Keypair.fromSecretKey(new Uint8Array(bs58.decode(wallet.privateKey)));
            const position = await getFullPosition(user, validPoolAddress);
            
            if (position) {
                walletsWithPosition.push(wallet);
            }
        });

        await Promise.all(checkPromises);

        if (walletsWithPosition.length === 0) {
            console.log(`\n\x1b[31m~~~ [!] | ERROR | Нет кошельков с активными позициями в данном пуле\x1b[0m`);
            process.exit(0);
            return;
        }

        // Удаляем ликвидность
        const removePromises = walletsWithPosition.map(async wallet => {
            try {
                await processRemoveLiquidity(wallet, validPoolAddress);
                await delay(5000);
            } catch (error) {
                console.error(`\x1b[31m~~~ [!] | ERROR | [${wallet.description.slice(0, 4)}...] | Ошибка при удалении ликвидности: ${error.message}\x1b[0m`);
            }
        });

        await Promise.all(removePromises);

        // Проверяем оставшиеся позиции
        let remainingWallets = [];
        const secondCheckPromises = walletsWithPosition.map(async wallet => {
            const user = Keypair.fromSecretKey(new Uint8Array(bs58.decode(wallet.privateKey)));
            const position = await getFullPosition(user, validPoolAddress);
            
            if (position) {
                remainingWallets.push(wallet);
            }
        });

        await Promise.all(secondCheckPromises);

        // Обрабатываем оставшиеся кошельки
        if (remainingWallets.length > 0) {
            remainingWallets = await handleWalletsWithPosition(remainingWallets, validPoolAddress);
        }

        console.log(`\n\x1b[36m[${new Date().toLocaleTimeString()}] | SUCCESS | Удаление позиций завершено\x1b[0m`);
        
        // Добавляем итоговую статистику
        console.log("\n\x1b[36m• Итоговая статистика:\x1b[0m");
        console.log(`  └─ \x1b[90mВсего кошельков с позициями:\x1b[0m ${walletsWithPosition.length}`);
        console.log(`  └─ \x1b[90mУспешно удалено:\x1b[0m ${walletsWithPosition.length - (remainingWallets?.length || 0)}`);
        console.log(`  └─ \x1b[90mТребуют внимания:\x1b[0m ${remainingWallets?.length || 0}`);

        process.exit(0); // Добавляем выход после успешного завершения

    } catch (error) {
        if (error.message) {
            console.error(`\x1b[31m~~~ [!] | ERROR | Ошибка при удалении позиции: ${error.message}\x1b[0m`);
        } else {
            console.error(`\x1b[31m~~~ [!] | ERROR | Неизвестная ошибка при удалении позиции\x1b[0m`);
        }
        process.exit(1); // Выход с кодом ошибки
    }
} 