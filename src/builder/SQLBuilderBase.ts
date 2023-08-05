import { DBTableColumnBase } from '../db/DBResultBase'

/**
 * SQLファイル生成クラス
 */
 export abstract class SQLGeneratorBase {
  /** 構文ジェネレーターリスト */
  protected tables: Map<string, DBTableColumnBase[]> = new Map()
  protected converter: Converter = new Converter()

  /**
   * テーブル情報追加
   * @param {string} tableName テーブル名
   * @param {DBTableColumn[]} tableColumns テーブルカラム情報リスト
   */
  public addTable(tableName: string, tableColumns: DBTableColumnBase[]) {
    this.tables.set(tableName, tableColumns)
  }

  /**
   * Create構文を出力する
   * @returns {string}
   */
  public abstract build(): string
}

/**
 * キーワード置き換えクラス
 */
class Converter {
  /** MySQL型置き換えリスト */
  private mysqlTypes: ConvertItem[] = []
  /** MySQL エクストラ(Auto Increment)置き換えリスト */
  private mysqlExtras: ConvertItem[] = []
  /** MySQL Null置き換えリスト */
  private mysqlNulls: ConvertItem[] = []
  /** MySQL Key置き換えリスト */
  private mysqlKeys: ConvertItem[] = []

  public setType(...items: ConvertItem[]): void {
    this.mysqlTypes.push(...items)
  }

  public setExtras(...items: ConvertItem[]): void {
    this.mysqlExtras.push(...items)
  }

  public setNulls(...items: ConvertItem[]): void {
    this.mysqlNulls.push(...items)
  }

  public setKeys(...items: ConvertItem[]): void {
    this.mysqlKeys.push(...items)
  }

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
export class ConvertItem {
  public pattern: RegExp
  public value: string
  constructor(pattern: RegExp, value: string) {
    this.pattern = pattern
    this.value = value
  }
}
