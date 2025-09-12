//const sqlite3 = require('sqlite3').verbose();
const sqlite3 = require("better-sqlite3");
const sqlite3x = require('sqlite3');


class Database {
	constructor(name_db = 'local') {
		this.db = new sqlite3(`data/${name_db}.db`, { timeout: 20 });

		this.dbx = new sqlite3x.Database(`data/${name_db}.db`, { timeout: 20 });

		//console.log("dbbbbbb");
		//this.db = new sqlite3(`../databases/${name_db}.db`);
	}
	close() {
		this.db.close();
	}

	getTables() {
		let rows = this.db.prepare("select name from sqlite_master where type='table'").all();
		return rows;
	}

	createTriggerUuid(database, group_name, field_pk_uuid) {
		let trigger = `
        CREATE TRIGGER AutoGenerate_${group_name}_${field_pk_uuid}
        AFTER INSERT ON ${group_name}
        FOR EACH ROW
        WHEN (NEW.${field_pk_uuid} IS NULL)
        BEGIN
           UPDATE ${group_name} SET ${field_pk_uuid} = (select lower(hex( randomblob(4)) || '-' || hex( randomblob(2))
                     || '-' || '4' || substr( hex( randomblob(2)), 2) || '-'
                     || substr('AB89', 1 + (abs(random()) % 4) , 1)  ||
                     substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))) ) WHERE rowid = NEW.rowid;
        END;`;
		database.writeSQL(trigger);
	}


	getFields(table) {
		let fields = this.db.prepare(`PRAGMA table_info(${table});`).all();
		return fields;
	}

	compareTable(table) {
		let fields = this.db.prepare(`PRAGMA table_info(${table});`).all();
		return fields;
	}

	existTable(tableName) {
		try {
			this.db.prepare(`SELECT * FROM ${tableName}`).all();
			return true;
		} catch (e) {
			return false;
		}
	}

	getConnection() {
		return this.db;
	}
	iniciar() {
		console.log("iniciando");
	}
	writeSQL(sql) {
		try {
			this.db.exec(sql);
			return 'database=ok';
		} catch (e) {
			return '';
		}
	}
	runSQL(sql, param = []) {
		try {
			return this.db.run(sql, param);
		} catch (e) {
			return e;
		}
	}
	sql(sql, param = []) {
		const r = new Promise((resolve, reject) => {
			const me = this;
			this.db.serialize(function () {
				me.db.all(sql, (error, rows) => {
					resolve(rows);
				});
			});
		});
		return r;
	}

}

module.exports = { Database };