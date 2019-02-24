// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createConnection, Connection } from 'mysql';
import { getTables, DataBaseTable } from './tableAccessor';
import { writeFile } from 'fs';
import { isArray } from 'util';
import { stringify } from 'querystring';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dtomaker" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.dtomaker', () => {
		// The code you place here will be executed every time your command is executed

		const dbSettings = vscode.workspace.getConfiguration('dtomaker.database');
		const databaseHost: string = dbSettings.get('host') || '';
		const databasePort: number = dbSettings.get('port') || 0;
		const databaseUserName: string = dbSettings.get('userName') || '';
		const databasePassword: string = dbSettings.get('password') || '';
		const databaseName: string = dbSettings.get('name') || '';
		if (databaseHost.length === 0 || databaseUserName.length === 0 || databaseName.length === 0) {
			vscode.window.showErrorMessage('DTO Maker: DBの設定がされていません');
			return;
		}

		if (!vscode.workspace.workspaceFolders) {
			vscode.window.showErrorMessage('DTO Maker: WorkSpace上でないと使用できません');
			return;
		}
		const outPutSettings = vscode.workspace.getConfiguration('dtomaker.output');
		const outputPath = vscode.workspace.workspaceFolders[0].uri.fsPath + outPutSettings.get('path');
		console.log(vscode.workspace.workspaceFolders[0].uri);
		console.log(outputPath);

		// MySQL
		const con: Connection = createConnection({
			host: databaseHost,
			port: databasePort,
			user: databaseUserName,
			password: databasePassword,
			database: databaseName
		});
		getTables(con).then((tables: DataBaseTable[] | Error) => {
			console.log(tables);
			if (isArray(tables)) {
				tables.forEach((table: DataBaseTable) => {

					// ファイル出力
					writeFile(outputPath + '\\' + table.name, table.toString(), (err: Error) => {
						if (err) {
							console.log(err);
							return;
						}
						console.log('書き込み完了');
					});
				});
			}
			vscode.window.showInformationMessage('DTO Maker: Success! Created DTO');
		}).catch((err: Error) => {
			console.log(err);
			process.exit(1);
			vscode.window.showErrorMessage('DTO Maker: MySQL Error...');
		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
