import DataTypeFinderBase from './DataTypeFinderBase'
import DataTypeFinderForJava from './DataTypeFinderForJava'
import DataTypeFinderForPHP from './DataTypeFinderForPHP'
import DataTypeFinderForTS from './DataTypeFinderForTS'

/**
 * データ種別パーサー生成
 */
export default class DataTypeFinder {
  public static create(defaultValues: object, fileExtension: string): DataTypeFinderBase|undefined {
    switch (fileExtension) {
      case 'java': {
        return new DataTypeFinderForJava(defaultValues)
      }
      case 'php': {
        return new DataTypeFinderForPHP(defaultValues)
      }
      case 'ts': {
        return new DataTypeFinderForTS(defaultValues)
      }
      default: {
        return undefined
      }
    }
  }
}
