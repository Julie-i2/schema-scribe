import { when } from '../application/Utility'
import { DataType } from './DataType'
import DataTypeFinderBase from './DataTypeFinderBase'
import { DBTableColumnBase } from '../db/DBResultBase'

/**
 * PHP用データ種別パーサー
 */
export default class DataTypeFinderForPHP extends DataTypeFinderBase {
  /** データ型名称リスト */
  private static get dataTypeList(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.int, 'int'],
      [DataType.float, 'float'],
      [DataType.double, 'double'],
      [DataType.string, 'string'],
      [DataType.dateTime, 'datetime'],
      [DataType.date, 'date'],
      [DataType.time, 'time'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get defaultValueList(): object {
    return {
      int: '0',
      float: '0.0',
      double: '0.0',
      string: "''",
      datetime: "'0000-00-00 00:00:00'",
      date: "'0000-00-00'",
      time: "'00:00:00'",
    }
  }

  /**
   * コンストラクタ
   * @param defaultValues 初期値リスト
   */
  public constructor(defaultValues: object) {
    super(DataTypeFinderForPHP.defaultValueList)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumnBase, dataType: DataType) : string {
    const dataTypeLabel = DataTypeFinderForPHP.dataTypeList.get(dataType) ?? ''
    return fieldInfo.isNull() ? `${dataTypeLabel}|null` : dataTypeLabel
  }

  /**
   * 初期値を求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns 初期値
   */
  protected createDefaultValue(fieldInfo: DBTableColumnBase, dataType: DataType) : string {
    const value = fieldInfo.getDefault()
    if (value === null) {
      return fieldInfo.isNull() ? 'null' : this.defaultValues.getDefaultValue(dataType)
    } else {
      return when(dataType)
        .on((v) => v === DataType.int, () => value)
        .on((v) => v === DataType.float, () => value)
        .on((v) => v === DataType.double, () => value)
        .otherwise(() => `'${value}'`)
    }
  }
}
