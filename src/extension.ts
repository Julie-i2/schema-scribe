import * as vscode from 'vscode';
import { DTOMaker } from './dtomaker';
import { ConfigData } from './ConfigData';

/**
 * VS Code起動時に処理を登録する
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {

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
        const outputChannel = vscode.window.createOutputChannel('DTO Maker');
        try {
            ConfigData.read().forEach((config) => {
                DTOMaker.build(config);
            });
            vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
        } catch (err) {
            vscode.window.showErrorMessage('【DTO Maker】' + err);
            outputChannel.appendLine(err.toString());
        }
    });

    /**
     * 設定されたDTOを1案件分だけ作る
     */
    let disposableOne = vscode.commands.registerCommand('extension.dtomaker.one', () => {
        const pickItems : vscode.QuickPickItem[] = [];
        const configuration: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('DTOMaker');
        const settings: Array<any> = configuration.get('configs') || [];
        settings.forEach(config => {
            pickItems.push({ label : '$(database)  ' + config.database.database, description : config.database.host });
        });
        vscode.window.showQuickPick(pickItems);
    });

    // 拡張機能解放時に自動的にdisposeする
    context.subscriptions.push(disposableAll);
    context.subscriptions.push(disposableOne);
}

// this method is called when your extension is deactivated
export function deactivate() {}
