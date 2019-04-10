/** データ型 */
enum DataType {
    INT = 1,
    FLOAT = 2,
    DATETIME = 3,
    DATE = 4,
    TIME = 5,
    STRING = 6,
}

/** PHPデータ型名称リスト */
const DATA_TYPE_LIST = {
    [DataType.INT] : 'int',
    [DataType.FLOAT] : 'float',
    [DataType.STRING] : 'string',
    [DataType.DATETIME] : 'datetime',
    [DataType.DATE] : 'date',
    [DataType.TIME] : 'time',
};

/** PHP型ハンガリアン記法リスト */
const DEFAULT_HUNGARIAN_LIST = {
    [DataType.INT] : 'n',
    [DataType.FLOAT] : 'n',
    [DataType.STRING] : 's',
    [DataType.DATETIME] : 'dt',
    [DataType.DATE] : 'd',
    [DataType.TIME] : 't',
};

/** PHPデータ型デフォルト値リスト */
const DEFAULT_VALUE_LIST = {
    [DataType.INT] : '0',
    [DataType.FLOAT] : '0.0',
    [DataType.STRING] : "''",
    [DataType.DATETIME] : "'0000-00-00 00:00:00'",
    [DataType.DATE] : "'0000-00-00'",
    [DataType.TIME] : "'00:00:00'",
};


class DefaultValues
{
    private typeInt: string;
    private typeFloat: string;
    private typeDateTime: string;
    private typeDate: string;
    private typeTime: string;
    private typeString: string;
    public constructor(config: any) {
        config = config || {};
        this.typeInt = config.int || DEFAULT_VALUE_LIST[DataType.INT];
        this.typeFloat = config.float || DEFAULT_VALUE_LIST[DataType.FLOAT];
        this.typeDateTime = config.datetime || DEFAULT_VALUE_LIST[DataType.DATETIME];
        this.typeDate = config.date || DEFAULT_VALUE_LIST[DataType.DATE];
        this.typeTime = config.time || DEFAULT_VALUE_LIST[DataType.TIME];
        this.typeString = config.string || DEFAULT_VALUE_LIST[DataType.STRING];
    }
    public get(dataType: DataType) {
        switch (dataType) {
            case DataType.INT:
                return this.typeInt;
            case DataType.FLOAT:
                return this.typeFloat;
            case DataType.DATETIME:
                return this.typeDateTime;
            case DataType.DATE:
                return this.typeDate;
            case DataType.TIME:
                return this.typeTime;
            default:
                return this.typeString;
        }
    }
}

class DataTypeInformation
{
    public label: string;
    public hungarian: string;
    public defaultValue: string;
    public constructor(label: string, hungarian: string, defaultValue: string) {
        this.label = label;
        this.hungarian = hungarian;
        this.defaultValue = defaultValue;
    }
}

export class DataTypeFinder
{
    private defaultValues: DefaultValues;

    /**
     * コンストラクタ
     * @param defaultValues 初期値リスト
     */
    public constructor(defaultValues: Array<any>) {
        this.defaultValues = new DefaultValues(defaultValues);
    }

    /**
     * ソースから型を割り出し結果を返す
     * @param source ソース
     */
    public find(source: string): DataTypeInformation {
        const dataType = this.findType(source);
        return new DataTypeInformation(
            DATA_TYPE_LIST[dataType],
            DEFAULT_HUNGARIAN_LIST[dataType],
            this.defaultValues.get(dataType)
        );
    }

    /**
     * DBの型からPHP型を返す
     * @param source DB型情報
     * @returns PHP型
     */
    private findType(source: string) : DataType {
        if (/(int|bit)/i.test(source)) {
            return DataType.INT;
        } else if (/(decimal|float|double)/i.test(source)) {
            return DataType.FLOAT;
        } else if (/datetime/i.test(source)) {
            return DataType.DATETIME;
        } else if (/date/i.test(source)) {
            return DataType.DATE;
        } else if (/time/i.test(source)) {
            return DataType.TIME;
        } else {
            return DataType.STRING;
        }
    }
}
