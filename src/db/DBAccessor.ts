import * as vscode from 'vscode'
import { SettingDataBase } from '../application/ConfigData'
import DBAccessorBase from './DBAccessorBase'
import DBAccessorMySQL from './DBAccessorMySQL'
import DBAccessorOracle from './DBAccessorOracle'

/**
 * データベーステーブル情報接続生成
 */
export default class DBAccessor {
  /**
   * DBアクセッサ生成
   * @param config DB接続情報
   * @param context VSCode拡張機能情報
   * @returns DBアクセッサ
   */
  public static create(config: SettingDataBase, context: vscode.ExtensionContext): DBAccessorBase {
    switch (config.application) {
      case 'oracle': {
        return new DBAccessorOracle(config, context);
      }
      default: {
        return new DBAccessorMySQL(config, context);
      }
    }
  }
}
