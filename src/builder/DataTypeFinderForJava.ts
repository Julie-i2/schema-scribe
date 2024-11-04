import { when } from '../application/Utility'
import { DataType } from './DataType'
import DataTypeFinderBase from './DataTypeFinderBase'
import { DBTableColumnBase } from '../db/DBResultBase'

/**
 * Java用データ種別パーサー
 */
export default class DataTypeFinderForJava extends DataTypeFinderBase {
  /** データ型名称リスト */
  private static get dataTypeList(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.int, 'int'],
      [DataType.long, 'long'],
      [DataType.float, 'float'],
      [DataType.double, 'double'],
      [DataType.string, 'String'],
      [DataType.dateTime, 'LocalDateTime'],
      [DataType.date, 'LocalDateTime'],
      [DataType.time, 'LocalDateTime'],
    ])
  }

  /** データ型名称リスト(Nullable) */
  private static get dataTypeNullableList(): Map<DataType, string> {
    return new Map<DataType, string>([
      [DataType.int, 'Integer'],
      [DataType.long, 'Long'],
      [DataType.float, 'Float'],
      [DataType.double, 'Double'],
      [DataType.string, 'String'],
      [DataType.dateTime, 'LocalDateTime'],
      [DataType.date, 'LocalDateTime'],
      [DataType.time, 'LocalDateTime'],
    ])
  }

  /** データ型デフォルト値リスト */
  private static get defaultValueList(): object {
    return {
      int: '0',
      float: '0f',
      double: '0f',
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
    super(DataTypeFinderForJava.defaultValueList)
    this.defaultValues.overwrite(defaultValues)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected createDataTypeLabel(fieldInfo: DBTableColumnBase, dataType: DataType) : string {
    const dataTypeLabel = DataTypeFinderForJava.dataTypeList.get(dataType) ?? ''
    const nullableLabel = DataTypeFinderForJava.dataTypeNullableList.get(dataType) ?? ''
    return fieldInfo.isNull() ? nullableLabel : dataTypeLabel
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
