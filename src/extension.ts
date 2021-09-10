import * as vscode from 'vscode'
import { DTOMakerHandler } from './handler'
import { ConfigData } from './ConfigData'
import { findErrorMessage } from './utility'

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
        vscode.window.showErrorMessage(`【DTO Maker】${errMess}`)
      }
    }
  }

  /**
   * すべての要件を作成
   */
  const all = vscode.commands.registerCommand('dtomaker.all', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await DTOMakerHandler.exec(configs)
      vscode.window.showInformationMessage('DTO Maker: Success! Created All Data')
    })
  })

  /**
   * すべてのDTOを作成
   */
  const allDTO = vscode.commands.registerCommand('dtomaker.alldto', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await DTOMakerHandler.execDTO(configs)
      vscode.window.showInformationMessage('DTO Maker: Success! Created All DTO')
    })
  })

  /**
   * 1つのDTOを作成
   */
  const oneDTO = vscode.commands.registerCommand('dtomaker.onedto', () => {
    commonProcess(async (configs: ConfigData[]) => {
      const pickItems: vscode.QuickPickItem[] = []
      for (const config of configs) {
        if (config.format.type === 'dto') {
          pickItems.push(config.toQuickPickItem())
        }
      }
      vscode.window.showQuickPick(pickItems).then(async (choice: vscode.QuickPickItem | undefined) => {
        try {
          const config = ConfigData.search(choice, configs)
          if (config) {
            await DTOMakerHandler.execOne(config)
            vscode.window.showInformationMessage('DTO Maker: Success! Created DTO')
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
  const allCreateSQL = vscode.commands.registerCommand('dtomaker.allcreatesql', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await DTOMakerHandler.execCreateSQL(configs)
      vscode.window.showInformationMessage('DTO Maker: Success! Created All CreateSQL')
    })
  })

  /**
   * すべてのSQLiteを作成
   */
  const allSQLite = vscode.commands.registerCommand('dtomaker.allsqlite', async () => {
    commonProcess(async (configs: ConfigData[]) => {
      await DTOMakerHandler.execSQLite(configs)
      vscode.window.showInformationMessage('DTO Maker: Success! Created All SQLite')
    })
  })

  /**
   * 1つのSQLiteを作成
   */
  const oneSQLite = vscode.commands.registerCommand('dtomaker.onesqlite', () => {
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
            await DTOMakerHandler.execOne(config)
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
  context.subscriptions.push(allDTO)
  context.subscriptions.push(oneDTO)
  context.subscriptions.push(allCreateSQL)
  context.subscriptions.push(allSQLite)
  context.subscriptions.push(oneSQLite)
}

// this method is called when your extension is deactivated
export function deactivate() {}
