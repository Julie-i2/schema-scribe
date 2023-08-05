import { DataType, DefaultValues, DataTypeInformation } from './DataType'
import { DBTableColumnBase } from '../db/DBResultBase'

/**
 * 基底クラス: データ種別パーサー
 */
export default abstract class DataTypeFinderBase {
  protected defaultValues: DefaultValues

  /**
   * コンストラクタ
   * @param defaultValues 初期値リスト
   */
  public constructor(defaultValues: object) {
    this.defaultValues = new DefaultValues(defaultValues)
  }

  /**
   * ソースから型を割り出し結果を返す
   * @param fieldInfo ソース
   */
  public find(fieldInfo: DBTableColumnBase): DataTypeInformation {
    const dataType = fieldInfo.findDataType()
    const label = this.createDataTypeLabel(fieldInfo, dataType)
    const hungarian = this.defaultValues.getHungarian(dataType)
    const defaultValue = this.createDefaultValue(fieldInfo, dataType)
    return new DataTypeInformation(label, hungarian, defaultValue)
  }

  /**
   * データ種別ラベルを求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns データ種別ラベル
   */
  protected abstract createDataTypeLabel(fieldInfo: DBTableColumnBase, dataType: DataType) : string

  /**
   * 初期値を求めて返す
   * @param fieldInfo DB Field情報
   * @param dataType データ種別
   * @returns 初期値
   */
  protected abstract createDefaultValue(fieldInfo: DBTableColumnBase, dataType: DataType) : string
}
