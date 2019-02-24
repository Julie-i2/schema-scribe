import { Connection, MysqlError } from 'mysql';

export class DataBaseTable {
	name: string;
	engine: string;
	version: number;
	rowFormat: string;
	rows: number;
	avgRowLength: number;
	dataLength: number;
	maxDataLength: number;
	indexLength: number;
	dataFree: number;
	autoIncrement: number | null;
	createTime: string;
	updateTime: string | null;
	checkTime: string | null;
	collation: string | null;
	checksum: string | null;
	createOptions: string;
	comment: string;
	constructor(tableData: any) {
		this.name = tableData.Name;
		this.engine = tableData.Engine;
		this.version = tableData.Version;
		this.rowFormat = tableData.Row_format;
		this.rows = tableData.Rows;
		this.avgRowLength = tableData.Avg_row_length;
		this.dataLength = tableData.Data_length;
		this.maxDataLength = tableData.Max_data_length;
		this.indexLength = tableData.Index_length;
		this.dataFree = tableData.Data_free;
		this.autoIncrement = tableData.Auto_increment;
		this.createTime = tableData.Create_time;
		this.updateTime = tableData.Update_time;
		this.checkTime = tableData.Check_time;
		this.collation = tableData.Collation;
		this.checksum = tableData.Checksum;
		this.createOptions = tableData.Create_options;
		this.comment = tableData.Comment;
	}

	toString() {
		return ''
			+ this.name + "\n"
			+ this.engine + "\n"
			+ this.version  + "\n"
			+ this.rowFormat  + "\n"
			+ this.rows  + "\n"
			+ this.avgRowLength  + "\n"
			+ this.dataLength  + "\n"
			+ this.maxDataLength  + "\n"
			+ this.indexLength  + "\n"
			+ this.dataFree  + "\n"
			+ this.autoIncrement  + "\n"
			+ this.createTime  + "\n"
			+ this.updateTime  + "\n"
			+ this.checkTime  + "\n"
			+ this.collation  + "\n"
			+ this.checksum  + "\n"
			+ this.createOptions  + "\n"
			+ this.comment  + "\n";
	}
}

export function getTables(con: Connection): Promise<DataBaseTable[] | Error> {
	return new Promise((resolve, reject) => {
		const sql = 'SHOW TABLE STATUS;';
		con.query(sql, (err: MysqlError | null, results: any[]) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(results.map((tableRow: any) => {
				return new DataBaseTable(tableRow);
			}));
		});
	});
}
