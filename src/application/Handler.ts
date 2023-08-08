import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { ConfigData } from './ConfigData'
import DBAccessor from '../db/DBAccessor'
import DBAccessorBase from '../db/DBAccessorBase'
import { DTOMaker } from '../builder/dtoMaker'
import { SQLiteGenerator } from '../builder/SQLBuilderForSqlite'

/**
 * ハンドラー
 */
export class DTOMakerHandler {

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
   * DTO要件だけの処理を受け付ける
   * @param configs
   * @param context VSCode拡張機能情報
   */
  public static async execDTO(configs: ConfigData[], context: vscode.ExtensionContext): Promise<void> {
    for (const config of configs) {
      if (config.format.type === 'dto') {
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
    const processor = new DTOMakerProcessor(config, context)
    await processor.loadTargetDBTables()
    switch (config.format.type) {
      case 'dto': {
        await processor.buildDTO()
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
 * DTOメーカー処理機
 */
class DTOMakerProcessor {
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
    await this.dbAccessor.connection();
    this.tableNames = (this.config.tableList.length > 0) ? this.config.tableList : await this.dbAccessor.getTables()
  }

  /**
   * DTO生成
   * @param config 設定データ
   */
  public async buildDTO(): Promise<void> {
    const template = fs.readFileSync(this.config.format.templatePath, 'utf8')
    const dtoMaker = new DTOMaker(template, this.config.format)
    const contentMap = new Map<string, string>()
    for (const tableName of this.tableNames) {
      const dbTable = await this.dbAccessor.getTableInfo(tableName)
      const dtoBuilder = dtoMaker.createBuilder(dbTable)
      const tableColumns = await this.dbAccessor.getTableColumns(dbTable.getName())
      for (const dbTableColumn of tableColumns) {
        dtoBuilder.addField(dbTableColumn)
      }
      const tableIndexes = await this.dbAccessor.getTableIndexes(dbTable.getName())
      for (const tableIndex of tableIndexes) {
        dtoBuilder.addIndex(tableIndex)
      }
      const fileName = (this.config.format.combine) ? this.config.format.combineFileName : dtoBuilder.getClassName()
      const content = dtoBuilder.generateContent(this.config.format.eol)
      const previousContent = contentMap.get(fileName) ?? ''
      contentMap.set(fileName, `${previousContent}${content}`)
    }
    this.deleteFiles()
    for (const [fileName, content] of contentMap) {
      this.output({ fileName, content })
    }
  }

  /**
   * CREATE構文SQL生成
   */
  public async buildCreateSQL(): Promise<void> {
    this.deleteFiles()
    for (const table of this.tableNames) {
      let content = await this.dbAccessor.getTableCreate(table)
      content = content.replace(/(AUTO_INCREMENT)=\d+/g, '$1=1')
      this.output({ fileName: table, content, fileExtension: 'sql' })
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
    const content = generator.build()
    this.output({ content, fileExtension: 'sql' })
  }

  /**
   * ファイル出力
   * @param param0
   */
  private output({ fileName, fileExtension, content }: { fileName?: string, fileExtension?: string, content?: string }): void {
    const path = this.config.format.outputPath
    const name = fileName ?? this.config.format.combineFileName
    const nameOpt = this.optimizeFileName(name)
    const extension = fileExtension ?? this.config.format.fileExtension
    fs.writeFileSync(`${path}/${nameOpt}.${extension}`, content ?? '', 'utf8')
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
