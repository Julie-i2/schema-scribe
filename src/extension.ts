import * as vscode from 'vscode';
import { DTOMaker } from './dtomaker';
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
    let disposableAll = vscode.commands.registerCommand('extension.dtomaker.all', () => {
        try {
            const readResult = ConfigData.read();
            readResult.errorMessages.forEach((errorMessage) => {
                outputChannel.appendLine(errorMessage);
            });
            readResult.configs.forEach((config) => {
                DTOMaker.build(config);
            });
            vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
        } catch (err) {
            outputChannel.appendLine(err.toString());
            vscode.window.showErrorMessage('【DTO Maker】' + err);
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
            vscode.window.showQuickPick(pickItems).then((choice: vscode.QuickPickItem | undefined) => {
                const config = ConfigData.search(choice, readResult.configs);
                if (config) {
                    DTOMaker.build(config);
                    vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
                }
            });
        } catch (err) {
            vscode.window.showErrorMessage('【DTO Maker】' + err);
            outputChannel.appendLine(err.toString());
        }
    });

    // 拡張機能解放時に自動的にdisposeする
    context.subscriptions.push(disposableAll);
    context.subscriptions.push(disposableOne);
}

// this method is called when your extension is deactivated
export function deactivate() {}
