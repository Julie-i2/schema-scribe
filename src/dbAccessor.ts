import { Connection, createConnection } from 'mysql2'

/**
 * データベーステーブル情報取得クラス
 */
export class DBAccessor {
  con: Connection

  /**
   * コンストラクタ
   * @param con DBコネクション
   */
  constructor(config: any) {
    this.con = createConnection({
      host : config.host || 'localhost',
      port : config.port || 3306,
      user : config.user || 'root',
      password : config.password || '',
      database : config.database || '',
    })
  }

  /**
   * テーブル名一覧を取得
   * @returns Promise
   */
  getTables(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const sql = 'SHOW TABLES;'
      this.con.query(sql, (err: Error|null, results: any[]) => {
        if (err === null) {
          resolve(results.map(table => String(Object.values(table)[0])))
        } else {
          reject(err)
        }
      })
    })
  }

  /**
   * テーブル詳細情報を取得
   * @param tableName テーブル名
   */
  getTableInfo(tableName: string): Promise<DBTable> {
    return new Promise((resolve, reject) => {
      const sql = this.con.format('SHOW TABLE STATUS LIKE ?;', [tableName])
      this.con.query(sql, (err: Error|null, results: any[]) => {
        if (err === null && results.length > 0) {
          resolve(new DBTable(results[0]))
        } else {
          reject(err ?? new Error('テーブル情報の取得に失敗'))
        }
      })
    })
  }

  /**
   * テーブルのCreate構文を取得
   * @param tableName
   * @returns
   */
  getTableCreate(tableName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const sql = `SHOW CREATE TABLE \`${tableName}\`;`
      this.con.query(sql, (err: Error|null, results: any[]) => {
        if (err === null && results.length > 0) {
          resolve(String(Object.values(results[0])[1]))
        } else {
          reject(err ?? new Error('テーブル生成構文の取得に失敗'))
        }
      })
    })
  }

  /**
   * テーブルのインデックス情報を取得
   * @param tableName
   * @returns
   */
  getTableIndexes(tableName: string): Promise<DBTableIndex[]> {
    return new Promise((resolve, reject) => {
      const sql = `SHOW INDEX FROM \`${tableName}\`;`
      this.con.query(sql, (err: Error|null, results: any[]) => {
        if (err === null) {
          resolve(results.map(result => new DBTableIndex(result)))
        } else {
          reject(err ?? new Error('テーブルのインデックス情報の取得に失敗'))
        }
      })
    })
  }

  /**
   * テーブルカラム情報を取得
   * @param tableName テーブル名
   */
  getTableColumns(tableName: string): Promise<DBTableColumn[]> {
    return new Promise((resolve, reject) => {
      const sql = `SHOW FULL COLUMNS FROM \`${tableName}\`;`
      this.con.query(sql, (err: Error|null, results: any[]) => {
        if (err === null) {
          resolve(results.map(tableColumn => new DBTableColumn(tableColumn)))
        } else {
          reject(err)
        }
      })
    })
  }
}

/**
 * データベーステーブル情報クラス
 */
export class DBTable {
  name: string
  engine: string
  version: number
  rowFormat: string
  rows: number
  avgRowLength: number
  dataLength: number
  maxDataLength: number
  indexLength: number
  dataFree: number
  autoIncrement: number|null
  createTime: string
  updateTime: string|null
  checkTime: string|null
  collation: string|null
  checksum: string|null
  createOptions: string
  comment: string

  /**
   * コンストラクタ
   * @param tableData テーブル情報
   */
  constructor(tableData: any = {}) {
    this.name = tableData.Name || ''
    this.engine = tableData.Engine || ''
    this.version = tableData.Version || 0
    this.rowFormat = tableData.Row_format || ''
    this.rows = tableData.Rows || 0
    this.avgRowLength = tableData.Avg_row_length || 0
    this.dataLength = tableData.Data_length || 0
    this.maxDataLength = tableData.Max_data_length || 0
    this.indexLength = tableData.Index_length || 0
    this.dataFree = tableData.Data_free || 0
    this.autoIncrement = tableData.Auto_increment || null
    this.createTime = tableData.Create_time || ''
    this.updateTime = tableData.Update_time || null
    this.checkTime = tableData.Check_time || null
    this.collation = tableData.Collation || null
    this.checksum = tableData.Checksum || null
    this.createOptions = tableData.Create_options || ''
    this.comment = tableData.Comment || ''
  }
}

/**
 * データベースインデックス情報クラス
 */
export class DBTableIndex {
  table: string
  nonUnique: number
  keyName: string
  seqInIndex: number
  columnName: string
  collation: string|null
  cardinality: number|null
  subPart: number|null
  packed: string|null
  nullable: string
  indexType: string
  comment: string|null

  /**
   * コンストラクタ
   * @param indexData インデックス情報
   */
  constructor(indexData: any) {
    this.table = indexData.Table
    this.nonUnique = indexData.Non_unique
    this.keyName = indexData.Key_name
    this.seqInIndex = indexData.Seq_in_index
    this.columnName = indexData.Column_name
    this.collation = indexData.Collation
    this.cardinality = indexData.Cardinality
    this.subPart = indexData.Sub_part
    this.packed = indexData.Packed
    this.nullable = indexData.Null
    this.indexType = indexData.Index_type
    this.comment = indexData.Comment
  }
}

/**
 * データベーステーブルカラム情報クラス
 */
export class DBTableColumn {
  field: string
  type: string
  collation: string|null
  null: string
  key: string
  default: string|null
  extra: string
  privileges: string
  comment: string

  /**
   * コンストラクタ
   * @param columnData テーブル情報
   */
  constructor(columnData: any) {
    this.field = columnData.Field
    this.type = columnData.Type
    this.collation = columnData.Collation
    this.null = columnData.Null
    this.key = columnData.Key
    this.default = columnData.Default
    this.extra = columnData.Extra
    this.privileges = columnData.Privileges
    this.comment = columnData.Comment
  }
}
