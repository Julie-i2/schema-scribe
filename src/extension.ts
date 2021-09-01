import * as vscode from 'vscode'
import { DTOMaker } from './dtomaker'
import { SQLBuilder } from './sqlBuilder'
import { ConfigData } from './ConfigData'
import { findErrorMessage } from './utility';

/**
 * VS Code起動時に処理を登録する
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('DTO Maker')

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "dtomaker" is now active!')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  /**
   * 設定されたDTOをすべて作成する
   */
  const disposableAll = vscode.commands.registerCommand('dtomaker.all', async () => {
    try {
      const readResult = ConfigData.read()
      if (readResult.configs.length === 0) {
        throw Error('設定ファイルがひとつも登録されていない')
      }
      for (const errorMessage of readResult.errorMessages) {
        outputChannel.appendLine(errorMessage)
      }
      for (const config of readResult.configs) {
        if (config.format.type === 'dto') {
          await DTOMaker.build(config)
        }
      }
      vscode.window.showInformationMessage('DTO Maker: Success! Created DTO')
    } catch (err: any) {
      const errMess = findErrorMessage(err)
      if (errMess) {
        outputChannel.appendLine(errMess)
        vscode.window.showErrorMessage(`【DTO Maker】${errMess}`)
      }
    }
  })

  /**
   * 設定されたDTOを1案件分だけ作る
   */
  const disposableOne = vscode.commands.registerCommand('dtomaker.one', () => {
    try {
      const pickItems : vscode.QuickPickItem[] = []
      const readResult = ConfigData.read()
      for (const config of readResult.configs) {
        if (config.format.type === 'dto') {
          pickItems.push(config.toQuickPickItem())
        }
      }
      vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem|undefined) => {
        try {
          const config = ConfigData.search(choice, readResult.configs)
          if (config) {
            await DTOMaker.build(config)
            vscode.window.showInformationMessage('DTO Maker: Success! Created DTO')
          }
        } catch (err) {
          if (choice) {
            outputChannel.append(`[${choice.description}] `)
          }
          const errMess = findErrorMessage(err)
          outputChannel.appendLine(errMess)
          vscode.window.showErrorMessage(`【DTO Maker】${errMess}`)
        }
      })
    } catch (err) {
      const errMess = findErrorMessage(err)
      outputChannel.appendLine(errMess)
      vscode.window.showErrorMessage(`【DTO Maker】${errMess}`)
    }
  })

  /**
   * 設定されたDTOを1案件分だけ作る
   */
  let generateSQLiteSchemaOne = vscode.commands.registerCommand('dtomaker.sqliteone', () => {
    try {
      const pickItems : vscode.QuickPickItem[] = []
      const readResult = ConfigData.read()
      for (const config of readResult.configs) {
        if (config.format.type === 'sqlite') {
          pickItems.push(config.toQuickPickItem())
        }
      }
      vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem|undefined) => {
        try {
          const config = ConfigData.search(choice, readResult.configs)
          if (config) {
            await SQLBuilder.build(config)
            vscode.window.showInformationMessage('SQLite Builder: Success! Created SQL')
          }
        } catch (err) {
          if (choice) {
            outputChannel.append(`[${choice.description}] `)
          }
          const errMess = findErrorMessage(err)
          outputChannel.appendLine(errMess)
          vscode.window.showErrorMessage(`【DTO Maker】${errMess}`)
        }
      })
    } catch (err) {
      const errMess = findErrorMessage(err)
      outputChannel.appendLine(errMess)
      vscode.window.showErrorMessage(`【DTO Maker】${errMess}`)
    }
  })

  // 拡張機能解放時に自動的にdisposeする
  context.subscriptions.push(disposableAll)
  context.subscriptions.push(disposableOne)
  context.subscriptions.push(generateSQLiteSchemaOne)
}

// this method is called when your extension is deactivated
export function deactivate() {}
