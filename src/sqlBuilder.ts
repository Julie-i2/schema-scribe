import * as fs from 'fs';
import { ConfigData } from './ConfigData';
import { DataTypeFinder } from './dataType';
import { DBAccessor, DBTable, DBTableColumn } from './dbAccessor';

export class SQLBuilder {
    /**
     * 生成
     * @param config 設定データ
     */
    public static build(config: ConfigData): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const dbAccessor: DBAccessor = new DBAccessor(config.database);

                // すでにあるファイルをすべて削除する
                if (config.io.outputReset) {
                    fs.readdirSync(config.io.outputPath).forEach(fileName => {
                        fs.unlinkSync(config.io.outputPath + '\\' + fileName);
                    });
                }

                // テーブル名リストを取得
                const tableNames = (config.tableList.length > 0) ? config.tableList : await dbAccessor.getTables();

                // テーブル詳細取得＆テンプレート置き換え＆出力
                const generator = new Generator();
                for (let table of tableNames) {
                    const tableColumns: DBTableColumn[] = await dbAccessor.getTableColumns(table);
                    generator.addTable(table, tableColumns);
                }
                const output = generator.getQueries();
                fs.writeFileSync(`${config.io.outputPath}\\${config.format.className}.sqlite`, output, 'utf8');
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }
}

class Generator {
    private tables: Array<TabelGenerator> = [];

    public constructor() {

    }

    public addTable(tableName: string, tableColumns: Array<DBTableColumn>) {
        this.tables.push(new TabelGenerator(tableName, tableColumns));
    }

    public getQueries(): string
    {
        const queries: Array<string> = [];
        queries.push('BEGIN TRANSACTION;');
        this.tables.forEach((gen: TabelGenerator) => {
            const tableQuery = gen.getQuery();
            queries.push(tableQuery);
        });
        queries.push('COMMIT;');
        return queries.join('\n');
    }
}

class TabelGenerator {
    private queries: Array<string> = [];

    public constructor(tableName: string, tableColumns: Array<DBTableColumn>) {
        const fields = Array<string>();
        tableColumns.forEach((tableColumn: DBTableColumn) => {
            const type = TypeConverter.convertType(tableColumn.type);
            const extra = TypeConverter.convertExtra(tableColumn.extra);
            fields.push(`  "${tableColumn.field}" ${type}${extra}`);
        });
        this.queries.push(`CREATE TABLE IF NOT EXISTS "${tableName}" (`);
        this.queries.push(fields.join(',\n'));
        this.queries.push(');');
    }

    public getQuery(): string
    {
        return this.queries.join('\n');
    }
}

class TypeConverter {
    public pattern: RegExp;
    public value: string;
    constructor(pattern: RegExp, value: string) {
        this.pattern = pattern;
        this.value = value;
    }

    public static convertType(type: string): string {
        const mysqlTypes: Array<TypeConverter> = [];
        mysqlTypes.push(new TypeConverter(/bigint(.*)/, 'integer'));
        mysqlTypes.push(new TypeConverter(/int(.*)/, 'integer'));
        mysqlTypes.push(new TypeConverter(/tinyint(.*)/, 'integer'));
        mysqlTypes.push(new TypeConverter(/smallint(.*)/, 'integer'));
        mysqlTypes.push(new TypeConverter(/mediumint(.*)/, 'integer'));
        mysqlTypes.push(new TypeConverter(/varchar(.*)/, 'text'));
        mysqlTypes.push(new TypeConverter(/character(.*)/, 'text'));
        return mysqlTypes.find((typeCnv: TypeConverter) => typeCnv.pattern.test(type))?.value ?? 'text';
    }

    public static convertExtra(extra: string): string {
        let extraQuery = '';
        if (extra === 'auto_increment') {
            extraQuery = ' primary key autoincrement';
        }
        return extraQuery;
    }
}
