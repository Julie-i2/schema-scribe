import { SQLGeneratorBase, ConvertItem } from './SQLBuilderBase'

/**
 * SQLiteファイル生成クラス
 */
export class SQLiteGenerator extends SQLGeneratorBase {

  public constructor() {
    super()
    this.converter.setType(
      new ConvertItem(/bigint(.*)/, 'INTEGER'),
      new ConvertItem(/int(.*)/, 'INTEGER'),
      new ConvertItem(/tinyint(.*)/, 'INTEGER'),
      new ConvertItem(/smallint(.*)/, 'INTEGER'),
      new ConvertItem(/mediumint(.*)/, 'INTEGER'),
      new ConvertItem(/varchar(.*)/, 'TEXT'),
      new ConvertItem(/character(.*)/, 'TEXT'),
    )
    this.converter.setExtras(
      new ConvertItem(/auto_increment/, ' PRIMARY KEY AUTOINCREMENT'),
    )
    this.converter.setNulls(
      new ConvertItem(/YES/, ''),
      new ConvertItem(/NO/, ' NOT NULL'),
    )
    this.converter.setKeys(
      new ConvertItem(/PRI/, ' PRIMARY KEY'),
      new ConvertItem(/UNI/, ' UNIQUE'),
    )
  }

  /**
   * SQLiteのCreate構文を出力する
   * @returns {string}
   */
  public build(): string {
    const tableSQLs: string[] = []
    for (const [tableName, tableColumns] of this.tables) {
      const fields: string[] = []
      for (const tableColumn of tableColumns) {
        const typeWord = this.converter.type(tableColumn.getType())
        const extraWord = this.converter.extra(tableColumn.getExtra())
        const nullWord = this.converter.null(tableColumn.getNull())
        // @todo 複合キーをどうするか考える
        //const keyWord = Converter.instance.key(tableColumn.key)
        const keyWord = ''
        const field = tableColumn.getField()
        fields.push(`  "${field}" ${typeWord}${nullWord}${keyWord}${extraWord}`)
      }
      tableSQLs.push(
        `CREATE TABLE IF NOT EXISTS "${tableName}" (`,
        ...fields,
        ');',
        '',
      )
    }
    return [
      'BEGIN TRANSACTION;',
      ...tableSQLs,
      'COMMIT;',
    ].join('\n')
  }
}
