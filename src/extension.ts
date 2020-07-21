import * as vscode from 'vscode';
import { DTOMaker } from './dtomaker';
import { SQLBuilder } from './sqlBuilder';
import { ConfigData } from './ConfigData';

/**
 * VS Code起動時に処理を登録する
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('DTO Maker');

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "dtomaker" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json

    /**
     * 設定されたDTOをすべて作成する
     */
    let disposableAll = vscode.commands.registerCommand('extension.dtomaker.all', async () => {
        try {
            const readResult = ConfigData.read();
            if (readResult.configs.length === 0) {
                throw Error('設定ファイルがひとつも登録されていない');
            }
            readResult.errorMessages.forEach((errorMessage) => {
                outputChannel.appendLine(errorMessage);
            });
            for (let i = 0; i < readResult.configs.length; i++) {
                await DTOMaker.build(readResult.configs[i]);
            }
            vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
        } catch (err) {
            outputChannel.appendLine(err.toString());
            vscode.window.showErrorMessage('【DTO Maker】' + err.toString());
        }
    });

    /**
     * 設定されたDTOを1案件分だけ作る
     */
    let disposableOne = vscode.commands.registerCommand('extension.dtomaker.one', () => {
        try {
            const pickItems : vscode.QuickPickItem[] = [];
            const readResult = ConfigData.read();
            readResult.configs.forEach((config) => {
                pickItems.push(config.toQuickPickItem());
            });
            vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem | undefined) => {
                try {
                    const config = ConfigData.search(choice, readResult.configs);
                    if (config) {
                        await DTOMaker.build(config);
                        vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
                    }
                } catch (err) {
                    if (choice) {
                        outputChannel.append('[' + choice.description + '] ');
                    }
                    outputChannel.appendLine(err.toString());
                    vscode.window.showErrorMessage('【DTO Maker】' + err.toString());
                }
            });
        } catch (err) {
            outputChannel.appendLine(err.toString());
            vscode.window.showErrorMessage('【DTO Maker】' + err.toString());
        }
    });

    /**
     * 設定されたDTOを1案件分だけ作る
     */
    let generateSQLiteSchemaOne = vscode.commands.registerCommand('extension.dtomaker.sqliteone', () => {
        try {
            const pickItems : vscode.QuickPickItem[] = [];
            const readResult = ConfigData.read();
            readResult.configs.forEach((config) => {
                pickItems.push(config.toQuickPickItem());
            });
            vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem | undefined) => {
                try {
                    const config = ConfigData.search(choice, readResult.configs);
                    if (config) {
                        await SQLBuilder.build(config);
                        vscode.window.showInformationMessage('SQLite Builder: Success! Created SQL');
                    }
                } catch (err) {
                    if (choice) {
                        outputChannel.append('[' + choice.description + '] ');
                    }
                    outputChannel.appendLine(err.toString());
                    vscode.window.showErrorMessage('【DTO Maker】' + err.toString());
                }
            });
        } catch (err) {
            outputChannel.appendLine(err.toString());
            vscode.window.showErrorMessage('【DTO Maker】' + err.toString());
        }
    });

    // 拡張機能解放時に自動的にdisposeする
    context.subscriptions.push(disposableAll);
    context.subscriptions.push(disposableOne);
    context.subscriptions.push(generateSQLiteSchemaOne);
}

// this method is called when your extension is deactivated
export function deactivate() {}
