import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { EntityMaker } from '../builder/EntityMaker'
import { SQLiteGenerator } from '../builder/SQLBuilderForSqlite'
import DBAccessor from '../db/DBAccessor'
import DBAccessorBase from '../db/DBAccessorBase'
import { ConfigData } from './ConfigData'

/**
 * Schema Scribeハンドラー
 */
export class SchemaScribeHandler {
  /**
   * 処理を受け付ける
   * @param configs
   * @param context VSCode拡張機能情報
   */
  public static async exec(configs: ConfigData[], context: vscode.ExtensionContext): Promise<void> {
    for (const config of configs) {
      await this.execOne(config, context)
    }
  }

  /**
   * Entity要件だけの処理を受け付ける
   * @param configs
   * @param context VSCode拡張機能情報
   */
  public static async execEntity(configs: ConfigData[], context: vscode.ExtensionContext): Promise<void> {
    for (const config of configs) {
      if (config.format.type === 'entity') {
        await this.execOne(config, context)
      }
    }
  }

  /**
   * CREATE SQL要件だけの処理を受け付ける
   * @param configs
   * @param context VSCode拡張機能情報
   */
  public static async execCreateSQL(configs: ConfigData[], context: vscode.ExtensionContext): Promise<void> {
    for (const config of configs) {
      if (config.format.type === 'create') {
        await this.execOne(config, context)
      }
    }
  }

  /**
   * SQLite要件だけの処理を受け付ける
   * @param configs
   * @param context VSCode拡張機能情報
   */
  public static async execSQLite(configs: ConfigData[], context: vscode.ExtensionContext): Promise<void> {
    for (const config of configs) {
      if (config.format.type === 'sqlite') {
        await this.execOne(config, context)
      }
    }
  }

  /**
   * 1件だけ処理を受け付ける
   * @param config
   * @param context VSCode拡張機能情報
   */
  public static async execOne(config: ConfigData, context: vscode.ExtensionContext): Promise<void> {
    const processor = new SchemaScribeProcessor(config, context)
    await processor.loadTargetDBTables()
    switch (config.format.type) {
      case 'entity': {
        await processor.buildEntity()
        break
      }
      case 'create': {
        await processor.buildCreateSQL()
        break
      }
      case 'sqlite': {
        await processor.buildSQLite()
        break
      }
    }
  }
}

/**
 * Schema Scribe Processor
 */
class SchemaScribeProcessor {
  private config: ConfigData
  private dbAccessor: DBAccessorBase
  private tableNames: string[] = []

  /**
   * コンストラクタ
   * @param config 設定データ
   * @param context VSCode拡張機能情報
   */
  public constructor(config: ConfigData, context: vscode.ExtensionContext) {
    this.config = config
    this.dbAccessor = DBAccessor.create(config.database, context)
    this.checkDirectory(config.format.outputPath)
  }

  /**
   * テーブル名リストを取得
   */
  public async loadTargetDBTables(): Promise<void> {
    await this.dbAccessor.connection()
    this.tableNames = this.config.tableList.length > 0 ? this.config.tableList : await this.dbAccessor.getTables()
  }

  /**
   * Entity生成
   * @param config 設定データ
   */
  public async buildEntity(): Promise<void> {
    const template = fs.readFileSync(this.config.format.templatePath, 'utf8')
    const entityMaker = new EntityMaker(template, this.config.format)
    const contentMap = new Map<string, string>()
    for (const tableName of this.tableNames) {
      const dbTable = await this.dbAccessor.getTableInfo(tableName)
      const entityBuilder = entityMaker.createBuilder(dbTable)
      const tableColumns = await this.dbAccessor.getTableColumns(dbTable.getName())
      for (const dbTableColumn of tableColumns) {
        entityBuilder.addField(dbTableColumn)
      }
      const tableIndexes = await this.dbAccessor.getTableIndexes(dbTable.getName())
      for (const tableIndex of tableIndexes) {
        entityBuilder.addIndex(tableIndex)
      }
      const fileName = this.config.format.combineFileName || entityBuilder.getClassName()
      const content = entityBuilder.generateContent(this.config.format.eol)
      const previousContent = contentMap.get(fileName) ?? ''
      contentMap.set(fileName, `${previousContent}${content}`)
    }
    this.deleteFiles()
    for (const [fileName, content] of contentMap) {
      this.output(fileName, content, this.config.format.fileExtension)
    }
  }

  /**
   * CREATE構文SQL生成
   */
  public async buildCreateSQL(): Promise<void> {
    this.deleteFiles()
    for (const tableName of this.tableNames) {
      let content = await this.dbAccessor.getTableCreate(tableName)
      content = content.replace(/(AUTO_INCREMENT)=\d+/g, '$1=1')
      this.output(tableName, content, 'sql')
    }
  }

  /**
   * SQLite生成
   */
  public async buildSQLite(): Promise<void> {
    const generator = new SQLiteGenerator()
    for (const table of this.tableNames) {
      const tableColumns = await this.dbAccessor.getTableColumns(table)
      generator.addTable(table, tableColumns)
    }
    this.deleteFiles()
    const fileName = this.config.format.combineFileName || 'noTitle'
    const content = generator.build()
    this.output(fileName, content, 'sql')
  }

  /**
   * ファイル出力
   * @param fileName
   * @param content
   * @param fileExtension
   */
  private output(fileName: string, content: string, fileExtension: string): void {
    const path = this.config.format.outputPath
    const nameOpt = this.optimizeFileName(fileName)
    const extension = fileExtension ? `.${fileExtension}` : fileExtension
    fs.writeFileSync(`${path}/${nameOpt}${extension}`, content, 'utf8')
  }

  /**
   * すでにあるファイルをすべて削除する
   */
  private deleteFiles(): void {
    if (this.config.format.outputReset) {
      const fileNames = fs.readdirSync(this.config.format.outputPath)
      for (const fileName of fileNames) {
        fs.unlinkSync(`${this.config.format.outputPath}/${fileName}`)
      }
    }
  }

  /**
   * ディレクトリが存在しないとファイル生成できないので用意する
   * @param dirPath
   */
  private checkDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      const parentPath = path.dirname(dirPath)
      this.checkDirectory(parentPath)
      fs.mkdirSync(dirPath)
    }
  }

  /**
   * ファイルシステムに使用できない文字を「_」に置き換える
   * ￥　／　：　＊　？　”　＜　＞　｜
   * @param fileName
   * @returns
   */
  private optimizeFileName(fileName: string): string {
    return fileName.replace(/(\\|\/|:|\*|\?|"|<|>|\|)/g, '_')
  }
}
