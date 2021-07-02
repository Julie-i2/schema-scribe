import * as fs from 'fs'
import { ConfigData } from './ConfigData'
import { DBAccessor, DBTableColumn } from './dbAccessor'

export class SQLBuilder {
  /**
   * 生成
   * @param config 設定データ
   */
  public static build(config: ConfigData): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // テーブル名リストを取得
        const dbAccessor = new DBAccessor(config.database)
        const tableNames = (config.tableList.length > 0) ? config.tableList : await dbAccessor.getTables()

        // テーブル詳細取得＆SQL出力
        const generator = new Generator()
        for (let table of tableNames) {
          const tableColumns = await dbAccessor.getTableColumns(table)
          generator.addTable(table, tableColumns)
        }
        const output = generator.toSQLite()

        // すでにあるファイルをすべて削除する
        if (config.io.outputReset) {
          const fileNames = fs.readdirSync(config.io.outputPath)
          for (const fileName of fileNames) {
            fs.unlinkSync(`${config.io.outputPath}\\${fileName}`)
          }
        }
        fs.writeFileSync(`${config.io.outputPath}\\${config.format.className}.sql`, output, 'utf8')
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }
}

/**
 * SQLファイル生成クラス
 */
class Generator {
  /** 構文ジェネレーターリスト */
  private tables: CreateTabelSQLGenerator[] = []

  /**
   * テーブル情報追加
   * @param {string} tableName テーブル名
   * @param {DBTableColumn[]} tableColumns テーブルカラム情報リスト
   */
  public addTable(tableName: string, tableColumns: DBTableColumn[]) {
    this.tables.push(new CreateTabelSQLGenerator(tableName, tableColumns))
  }

  /**
   * SQLiteのCreate構文を出力する
   * @returns {string}
   */
  public toSQLite(): string {
    return [
      'BEGIN TRANSACTION;',
      ...this.tables.map(gen => gen.toSQLite()),
      'COMMIT;',
    ].join('\n')
  }
}

/**
 * CREATE TABLE SQL構文ジェネレータークラス
 */
class CreateTabelSQLGenerator {
  /** テーブル名 */
  private tableName: string = ''
  /** テーブルカラム情報リスト */
  private tableColumns: DBTableColumn[] = []

  /**
   * コンストラクタ
   * @param {string} tableName テーブル名
   * @param {DBTableColumn[]} tableColumns テーブルカラム情報リスト
   */
  public constructor(tableName: string, tableColumns: DBTableColumn[]) {
    this.tableName = tableName
    this.tableColumns = tableColumns
  }

  /**
   * SQLiteのCreate構文を出力する
   * @returns {string}
   */
  public toSQLite(): string {
    const fields: string[] = []
    for (const tableColumn of this.tableColumns) {
      const typeWord = Converter.instance.type(tableColumn.type)
      const extraWord = Converter.instance.extra(tableColumn.extra)
      const nullWord = Converter.instance.null(tableColumn.null)
      // @todo 複合キーをどうするか考える
      //const keyWord = Converter.instance.key(tableColumn.key)
      const keyWord = ''
      fields.push(`  "${tableColumn.field}" ${typeWord}${nullWord}${keyWord}${extraWord}`)
    }
    return [
      `CREATE TABLE IF NOT EXISTS "${this.tableName}" (`,
      fields.join(',\n'),
      ');',
    ].join('\n')
  }
}

/**
 * キーワード置き換えクラス
 */
class Converter {
  /** インスタンス */
  private static _instance: Converter|null = null
  /** MySQL型置き換えリスト */
  private mysqlTypes = [
    new ConvertItem(/bigint(.*)/, 'INTEGER'),
    new ConvertItem(/int(.*)/, 'INTEGER'),
    new ConvertItem(/tinyint(.*)/, 'INTEGER'),
    new ConvertItem(/smallint(.*)/, 'INTEGER'),
    new ConvertItem(/mediumint(.*)/, 'INTEGER'),
    new ConvertItem(/varchar(.*)/, 'TEXT'),
    new ConvertItem(/character(.*)/, 'TEXT'),
  ]
  /** MySQL エクストラ(Auto Increment)置き換えリスト */
  private mysqlExtras = [
    new ConvertItem(/auto_increment/, ' PRIMARY KEY AUTOINCREMENT'),
  ]
  /** MySQL Null置き換えリスト */
  private mysqlNulls = [
    new ConvertItem(/YES/, ''),
    new ConvertItem(/NO/, ' NOT NULL'),
  ]
  /** MySQL Key置き換えリスト */
  private mysqlKeys = [
    new ConvertItem(/PRI/, ' PRIMARY KEY'),
    new ConvertItem(/UNI/, ' UNIQUE'),
  ]

  /**
   * インスタンス取得
   * @returns {Converter}
   */
  public static get instance(): Converter {
    if (this._instance === null) {
      this._instance = new Converter()
    }
    return this._instance
  }

  /**
   * コンストラクタ
   */
  private constructor() {}

  /**
   * MySQL型→SQLite型
   * @param {string} typeProp MySQL型
   * @returns {string}
   */
  public type(typeProp: string): string {
    return this.mysqlTypes.find(item => item.pattern.test(typeProp))?.value ?? 'TEXT'
  }

  /**
   * MySQLエクストラ→SQLiteエクストラ
   * @param {string} extraProp MySQLエクストラ
   * @returns {string}
   */
  public extra(extraProp: string): string {
    return this.mysqlExtras.find(item => item.pattern.test(extraProp))?.value ?? ''
  }

  /**
   * MySQL Null→SQLite Null
   * @param {string} nullProp MySQL Null
   * @returns {string}
   */
  public null(nullProp: string): string {
    return this.mysqlNulls.find(item => item.pattern.test(nullProp))?.value ?? ''
  }

  /**
   * MySQL Key→MySQL Key
   * @param {string} keyProp MySQL Key
   * @returns {string}
   */
  public key(keyProp: string): string {
    return this.mysqlKeys.find(item => item.pattern.test(keyProp))?.value ?? ''
  }
}

/**
 * 置き換え項目
 */
class ConvertItem {
  public pattern: RegExp
  public value: string
  constructor(pattern: RegExp, value: string) {
    this.pattern = pattern
    this.value = value
  }
}
