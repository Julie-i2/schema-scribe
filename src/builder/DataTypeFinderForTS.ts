import { when } from '../application/Utility'
import { DataType } from './DataType'
import DataTypeFinderBase from './DataTypeFinderBase'
import { DBTableColumnBase } from '../db/DBResultBase'

/**
 * TypeScript用データ種別パーサー
 */
export default class DataTypeFinderForTS extends DataTypeFinderBase {
  /** データ型名称リスト */
  private static get dataTypeList(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.int, 'number'],
      [DataType.float, 'number'],
      [DataType.double, 'number'],
      [DataType.string, 'string'],
      [DataType.dateTime, 'Date'],
      [DataType.date, 'Date'],
      [DataType.time, 'Date'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get defaultValueList(): object {
    return {
      int: '0',
      float: '0.0',
      double: '0.0',
      string: '',
      datetime: 'null',
      date: 'null',
      time: 'null',
    }
  }

  /**
   * コンストラクタ
   * @param defaultValues 初期値リスト
   */
  public constructor(defaultValues: object) {
    super(DataTypeFinderForTS.defaultValueList)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumnBase, dataType: DataType) : string {
    const dataTypeLabel = DataTypeFinderForTS.dataTypeList.get(dataType) ?? ''
    const nullable = fieldInfo.isNull() ?? [DataType.dateTime, DataType.date, DataType.time].includes(dataType)
    return nullable ? `${dataTypeLabel}|null` : dataTypeLabel
  }

  /**
   * 初期値を求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns 初期値
   */
  protected createDefaultValue(fieldInfo: DBTableColumnBase, dataType: DataType) : string {
    const defaultValue = fieldInfo.isNull() ? 'null' : this.defaultValues.getDefaultValue(dataType)
    const value = fieldInfo.getDefault() ?? defaultValue
    return when(dataType)
      .on((v) => v === DataType.int, () => value)
      .on((v) => v === DataType.float, () => value)
      .on((v) => v === DataType.double, () => value)
      .on((v) => v === DataType.dateTime, () => 'null')
      .on((v) => v === DataType.date, () => 'null')
      .on((v) => v === DataType.time, () => 'null')
      .otherwise(() => `'${value}'`)
  }
}
