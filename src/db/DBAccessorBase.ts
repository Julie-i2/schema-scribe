import * as vscode from 'vscode'
import { SettingDataBase } from '../application/ConfigData'
import { DBTableBase, DBTableIndexBase, DBTableColumnBase } from './DBResultBase'

/**
 * 基底クラス: データベーステーブル情報接続
 */
export default abstract class DBAccessorBase {
  protected config: SettingDataBase

  /**
   * コンストラクタ
   * @param config DB接続情報
   * @param context VSCode拡張機能情報
   */
  public constructor(config: SettingDataBase, context: vscode.ExtensionContext) {
    this.config = config;
  }

  /**
   * コネクション
   */
  public abstract connection(): Promise<void>

  /**
   * テーブル名一覧を取得
   * @returns Promise
   */
  public abstract getTables(): Promise<string[]>

  /**
   * テーブル詳細情報を取得
   * @param tableName テーブル名
   * @returns
   */
  public abstract getTableInfo(tableName: string): Promise<DBTableBase>

  /**
   * テーブルのCreate構文を取得
   * @param tableName
   * @returns
   */
  public abstract getTableCreate(tableName: string): Promise<string>

  /**
   * テーブルのインデックス情報を取得
   * @param tableName
   * @returns
   */
  public abstract getTableIndexes(tableName: string): Promise<DBTableIndexBase[]>

  /**
   * テーブルカラム情報を取得
   * @param tableName テーブル名
   * @returns
   */
  public abstract getTableColumns(tableName: string): Promise<DBTableColumnBase[]>
}
