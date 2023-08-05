import * as mysql from 'mysql2'
import DBAccessorBase from './DBAccessorBase'
import { DBTableMySQL, DBTableIndexMySQL, DBTableColumnMySQL } from './DBResultMySQL'

/**
 * データベーステーブル情報取得クラス
 */
export default class DBAccessorMySQL extends DBAccessorBase {
  private con: mysql.Connection|null = null

  /**
   * コネクション
   * @param config DB接続情報
   */
  public connection(): Promise<void> {
    return new Promise((resolve) => {
      const settings = {
        host : this.config.host,
        port : this.config.port,
        user : this.config.user,
        password : this.config.password,
        database : this.config.database,
      };
      this.con = mysql.createConnection(settings)
      resolve();
    });
  }

  /**
   * テーブル名一覧を取得
   * @returns Promise
   */
  public getTables(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = 'SHOW TABLES;'
        this.con.query(sql, (err: Error|null, results: any[]) => {
          if (err === null) {
            resolve(results.map(table => String(Object.values(table)[0])))
          } else {
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
  public getTableInfo(tableName: string): Promise<DBTableMySQL> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = this.con.format('SHOW TABLE STATUS LIKE ?;', [tableName])
        this.con.query(sql, (err: Error|null, results: any[]) => {
          if (err === null && results.length > 0) {
            resolve(new DBTableMySQL(results[0]))
          } else {
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
      if (this.con) {
        const sql = `SHOW CREATE TABLE \`${tableName}\`;`
        this.con.query(sql, (err: Error|null, results: any[]) => {
          if (err === null && results.length > 0) {
            resolve(String(Object.values(results[0])[1]))
          } else {
            reject(err ?? new Error('テーブル生成構文の取得に失敗'))
          }
        })
      } else {
        reject('disconnection')
      }
    })
  }

  /**
   * テーブルのインデックス情報を取得
   * @param tableName
   * @returns
   */
  public getTableIndexes(tableName: string): Promise<DBTableIndexMySQL[]> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = `SHOW INDEX FROM \`${tableName}\`;`
        this.con.query(sql, (err: Error|null, results: any[]) => {
          if (err === null) {
            resolve(results.map(result => new DBTableIndexMySQL(result)))
          } else {
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
  public getTableColumns(tableName: string): Promise<DBTableColumnMySQL[]> {
    return new Promise((resolve, reject) => {
      if (this.con) {
        const sql = `SHOW FULL COLUMNS FROM \`${tableName}\`;`
        this.con.query(sql, (err: Error|null, results: any[]) => {
          if (err === null) {
            resolve(results.map(tableColumn => new DBTableColumnMySQL(tableColumn)))
          } else {
            reject(err)
          }
        })
      } else {
        reject('disconnection')
      }
    })
  }
}
