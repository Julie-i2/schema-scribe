import * as path from 'path'
import * as vscode from 'vscode'
import * as oracledb from 'oracledb'
import { SettingDataBase } from '../application/ConfigData'
import { isObject } from '../application/Utility'
import DBAccessorBase from './DBAccessorBase'
import { DBTableOracle, DBTableIndexOracle, DBTableColumnOracle } from './DBResultOracle'

// OracleDBのResultをObject型で受け取るオプション
const options = { outFormat: oracledb.OUT_FORMAT_OBJECT }

/**
 * データベーステーブル情報取得クラス
 */
export default class DBAccessorMySQL extends DBAccessorBase {
  private con: oracledb.Connection|null = null

  /**
   * コンストラクタ
   * @param config DB接続情報
   * @param context VSCode拡張機能情報
   */
  public constructor(config: SettingDataBase, context: vscode.ExtensionContext) {
    super(config, context)
    const libDir = path.join(context.extensionPath, '/lib/instantclient_21_10')
    oracledb.initOracleClient({ libDir })
  }

  /**
   * コネクション
   * @param config DB接続情報
   */
  public async connection(): Promise<void> {
    this.con = await oracledb.getConnection({
        user : this.config.user,
        password : this.config.password,
        connectionString: `${this.config.host}:${this.config.port}/${this.config.database}`,
    })
  }

  /**
   * テーブル名一覧を取得
   * @returns Promise
   */
  public getTables(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = 'SELECT "TABLE_NAME" FROM "USER_TABLES" ORDER BY "TABLE_NAME"'
        this.con.execute(sql, (err: oracledb.DBError, result: oracledb.Result<unknown>): void => {
          if (err === null) {
            const results = result.rows ?? [];
            const names = []
            for (const result of results) {
              if (isObject(result)) {
                const name = String(Object.values(result)[0])
                names.push(name);
              }
            }
            resolve(names)
          } else {
            console.log(sql)
            reject(err)
          }
        })
      } else {
        reject('disconnection')
      }
    })
  }

  /**
   * テーブル詳細情報を取得
   * @param tableName テーブル名
   */
  public getTableInfo(tableName: string): Promise<DBTableOracle> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = [
          'SELECT a."TABLE_NAME", b."COMMENTS"',
          'FROM "USER_TABLES" a',
          'LEFT JOIN "USER_TAB_COMMENTS" b ON a."TABLE_NAME"=b."TABLE_NAME" AND b."TABLE_NAME"=:table_name_b',
          'WHERE a."TABLE_NAME"=:table_name_a',
        ].join(' ');
        const params = [tableName, tableName]
        this.con.execute(sql, params, options, (err: oracledb.DBError, result: oracledb.Result<unknown>): void => {
          const results = result.rows ?? []
          if (err === null && results.length > 0) {
            resolve(new DBTableOracle(results[0]))
          } else {
            console.log(sql)
            reject(err ?? new Error('テーブル情報の取得に失敗'))
          }
        })
      } else {
        reject('disconnection')
      }
    })
  }

  /**
   * テーブルのCreate構文を取得
   * @param tableName
   * @returns
   */
  public getTableCreate(tableName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      reject('OracleDBのCreate構文出力は非対応')
    })
  }

  /**
   * テーブルのインデックス情報を取得
   * @param tableName
   * @returns
   */
  public getTableIndexes(tableName: string): Promise<DBTableIndexOracle[]> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = [
          'SELECT a."CONSTRAINT_NAME", a."POSITION", a."COLUMN_NAME", c."UNIQUENESS", b."CONSTRAINT_TYPE"',
          'FROM "USER_CONS_COLUMNS" a',
          'LEFT JOIN "USER_CONSTRAINTS" b ON a."CONSTRAINT_NAME"=b."CONSTRAINT_NAME" AND b."TABLE_NAME"=:table_name_b',
          'LEFT JOIN "USER_INDEXES" c ON c."INDEX_NAME"=a."CONSTRAINT_NAME" AND c."TABLE_NAME"=:table_name_c',
          'WHERE a."TABLE_NAME"=:table_name_a',
        ].join(' ')
        const params = [tableName, tableName, tableName]
        this.con.execute(sql, params, options, (err: oracledb.DBError, result: oracledb.Result<unknown>): void => {
          if (err === null) {
            const results = result.rows ?? []
            resolve(results.map(result => new DBTableIndexOracle(result)))
          } else {
            console.log(sql)
            reject(err ?? new Error('テーブルのインデックス情報の取得に失敗'))
          }
        })
      } else {
        reject('disconnection')
      }
    })
  }

  /**
   * テーブルカラム情報を取得
   * @param tableName テーブル名
   */
  public getTableColumns(tableName: string): Promise<DBTableColumnOracle[]> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = [
          'SELECT a."COLUMN_NAME", a."DATA_TYPE", a."NULLABLE", a."DATA_DEFAULT", a."DATA_PRECISION", a."DATA_SCALE", b."COMMENTS"',
          'FROM "USER_TAB_COLUMNS" a',
          'LEFT JOIN "USER_COL_COMMENTS" b ON a."COLUMN_NAME"=b."COLUMN_NAME" AND b."TABLE_NAME"=:table_name_b',
          'WHERE a."TABLE_NAME"=:table_name_a',
          'ORDER BY a."COLUMN_ID" ASC',
        ].join(' ');
        const params = [tableName, tableName]
        this.con.execute(sql, params, options, (err: oracledb.DBError, result: oracledb.Result<unknown>): void => {
          if (err === null) {
            const results = result.rows ?? []
            resolve(results.map(tableColumn => new DBTableColumnOracle(tableColumn)))
          } else {
            console.log(sql)
            reject(err)
          }
        })
      } else {
        reject('disconnection')
      }
    })
  }
}
