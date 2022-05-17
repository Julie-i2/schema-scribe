import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { findErrorMessage } from './utility'

/**
 * 設定データ読み込み結果
 */
class ConfigReadResult {
  public configs: ConfigData[]
  public errorMessages: string[]
  public constructor(configs: ConfigData[], errorMessages: string[]) {
    this.configs = configs
    this.errorMessages = errorMessages
  }
}

/**
 * 設定データ
 */
export class ConfigData {
  public label: string
  public database: SettingDataBase
  public format: SettingFormat
  public tableList: string[]
  public workspaceName: string
  public constructor(config: any, workspaceFolder: vscode.WorkspaceFolder) {
    config = config || {}
    this.label = config.label || ''
    this.database = new SettingDataBase(config.database)
    this.format = new SettingFormat(config.format, workspaceFolder.uri.fsPath)
    this.tableList = config.tableList || []
    this.workspaceName = workspaceFolder.name
  }

  /**
   * クイックピックアイテムに変換
   */
  public toQuickPickItem(): vscode.QuickPickItem {
    const databaseName = `${this.database.host}@${this.database.database}`
    return {
      label: `$(database)  ${this.label} ${databaseName}`,
      description: this.workspaceName,
      alwaysShow: true,
    }
  }

  /**
   * 設定ファイル読み込み
   */
  public static read(): ConfigReadResult {
    if (!vscode.workspace.workspaceFolders) {
      throw Error('WorkSpace上でないと使用できません')
    }
    const configs: ConfigData[] = []
    const errMessList: string[] = []
    for (const folder of vscode.workspace.workspaceFolders) {
      try {
        const configFilePath = `${folder.uri.fsPath}/.dtomaker/config.json`
        const configText = readFileSync(configFilePath, 'utf8')
        const configList = JSON.parse(configText)['DTOMaker.configs'] || []
        for (const configJSON of configList) {
          const configData = new ConfigData(configJSON, folder)
          configs.push(configData)
        }
      } catch (err) {
        // ファイルの存在判定がないため、例外をcatch
        const errMess = findErrorMessage(err)
        errMessList.push(errMess)
      }
    }
    return new ConfigReadResult(configs, errMessList)
  }

  /**
   * クイックピックアイテムの情報を元に設定データリストから設定データを検索する
   * @param needle クイックピックアイテム
   * @param hashList 設定データリスト
   */
  public static search(needle: vscode.QuickPickItem|undefined, hashList: ConfigData[]): ConfigData|null {
    const targetA = JSON.stringify(needle || {})
    for (const hash of hashList) {
      const targetB = JSON.stringify(hash.toQuickPickItem())
      if (targetA === targetB) {
        return hash
      }
    }
    return null
  }
}

/**
 * DB設定
 */
export class SettingDataBase {
  public host: string
  public port: number
  public user: string
  public password: string
  public database: string
  constructor(config: any) {
    config = config || {}
    this.host = config.host || 'localhost'
    this.port = config.port || 3306
    this.user = config.user || 'root'
    this.password = config.password || ''
    this.database = config.database || ''
  }
}

/**
 * ファイルフォーマット設定
 */
export class SettingFormat {
  public outputReset: boolean
  public outputPath: string
  public templatePath: string
  public combine: boolean
  public combineFileName: string
  public type: string
  public className: string
  public fileExtension: string
  public ltrimTableName: string
  public defaultValues: any
  public eol: string
  constructor(config: any, workspaceRoot: string) {
    config = config || {}
    this.outputReset = !!config.outputReset
    this.outputPath =  (config.outputPath || '${workspaceRoot}/output').replace(/\${workspaceRoot}/g, workspaceRoot)
    this.templatePath = (config.templatePath || '').replace(/\${workspaceRoot}/g, workspaceRoot)
    this.combine = config?.combine?.enabled ?? false
    this.combineFileName = config?.combine?.fileName ?? 'noTitle'
    this.type = config.type || ''
    this.className = config.className || ''
    this.fileExtension = config.fileExtension || ''
    this.ltrimTableName = config.ltrimTableName || ''
    this.defaultValues = config.defaultValues
    this.eol = config?.eol ?? '\n'
  }
}
