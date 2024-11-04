import * as vscode from 'vscode'
import { ConfigData } from './application/ConfigData'
import { SchemaScribeHandler } from './application/Handler'
import { findErrorMessage } from './application/Utility'

/**
 * VS Code起動時に処理を登録する
 * @param context
 */
export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('Schema Scribe')

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "Schema Scribe" is now active!')

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  /**
   * 共通処理
   * @param func
   */
  const commonProcess = async (func: CallableFunction) => {
    try {
      const readResult = ConfigData.read()
      for (const errorMessage of readResult.errorMessages) {
        outputChannel.appendLine(errorMessage)
      }
      if (readResult.configs.length > 0) {
        await func(readResult.configs)
      } else {
        throw Error('設定ファイルがひとつも登録されていない')
      }
    } catch (err: any) {
      const errMess = findErrorMessage(err)
      if (errMess) {
        console.error(err)
        outputChannel.appendLine(errMess)
        vscode.window.showErrorMessage(`【Schema Scribe】${errMess}`)
      }
    }
  }

  /**
   * すべての要件を作成
   */
  const all = vscode.commands.registerCommand('schema-scribe.all', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await SchemaScribeHandler.exec(configs, context)
      vscode.window.showInformationMessage('Schema Scribe: Success! Created All Data')
    })
  })

  /**
   * すべてのEntityを作成
   */
  const allEntities = vscode.commands.registerCommand('schema-scribe.all_entity', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await SchemaScribeHandler.execEntity(configs, context)
      vscode.window.showInformationMessage('Schema Scribe: Success! Created All Entities')
    })
  })

  /**
   * 1つのEntityを作成
   */
  const oneEntity = vscode.commands.registerCommand('schema-scribe.one_entity', () => {
    commonProcess(async (configs: ConfigData[]) => {
      const pickItems: vscode.QuickPickItem[] = []
      for (const config of configs) {
        if (config.format.type === 'entity') {
          pickItems.push(config.toQuickPickItem())
        }
      }
      vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem | undefined) => {
        try {
          const config = ConfigData.search(choice, configs)
          if (config) {
            await SchemaScribeHandler.execOne(config, context)
            vscode.window.showInformationMessage('Schema Scribe: Success! Created Entity')
          }
        } catch (err) {
          if (choice) {
            outputChannel.append(`[${choice.description}] `)
          }
          throw err
        }
      })
    })
  })

  /**
   * すべてのSQLiteを作成
   */
  const allCreateSQL = vscode.commands.registerCommand('schema-scribe.all_create_sql', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await SchemaScribeHandler.execCreateSQL(configs, context)
      vscode.window.showInformationMessage('Schema Scribe: Success! Created All CreateSQL')
    })
  })

  /**
   * すべてのSQLiteを作成
   */
  const allSQLite = vscode.commands.registerCommand('schema-scribe.all_sqlite', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await SchemaScribeHandler.execSQLite(configs, context)
      vscode.window.showInformationMessage('Schema Scribe: Success! Created All SQLite')
    })
  })

  /**
   * 1つのSQLiteを作成
   */
  const oneSQLite = vscode.commands.registerCommand('schema-scribe.one_sqlite', () => {
    commonProcess(async (configs: ConfigData[]) => {
      const pickItems: vscode.QuickPickItem[] = []
      for (const config of configs) {
        if (config.format.type === 'sqlite') {
          pickItems.push(config.toQuickPickItem())
        }
      }
      vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem | undefined) => {
        try {
          const config = ConfigData.search(choice, configs)
          if (config) {
            await SchemaScribeHandler.execOne(config, context)
            vscode.window.showInformationMessage('SQLite Builder: Success! Created SQLite')
          }
        } catch (err) {
          if (choice) {
            outputChannel.append(`[${choice.description}] `)
          }
          throw err
        }
      })
    })
  })

  // 拡張機能解放時に自動的にdisposeする
  context.subscriptions.push(all)
  context.subscriptions.push(allEntities)
  context.subscriptions.push(oneEntity)
  context.subscriptions.push(allCreateSQL)
  context.subscriptions.push(allSQLite)
  context.subscriptions.push(oneSQLite)
}

// this method is called when your extension is deactivated
export function deactivate() {}
