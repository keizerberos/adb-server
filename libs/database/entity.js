


function toCamel(text) { 
	let texto = text;
	let letras = 'abcdefghijklmnopqrstuvwxyz';
	for (var i = 0; i < letras.length; i++) 
		texto = texto.replaceAll('_'+letras.charAt(i),letras.charAt(i).toUpperCase());
	return texto;
}

function toSnake(text) { 
	let texto = text;
	let letras = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
	for (var i = 0; i < letras.length; i++) 
		texto = texto.replaceAll(letras.charAt(i),'_'+letras.charAt(i).toLowerCase());
	return texto;
}

function setType(type){
	if(type=='text') return "TEXT";
	if(type=='uuid') return "TEXT";
	if(type=='number') return "INTEGER";
	if(type=='double') return "DOUBLE";
	if(type=='float') return "FLOAT";
	if(type=='blob') return "BLOB";
	if(type=='json') return "TEXT";
	if(type=='boolean') return "BOOLEAN";
}

function toColumnName(column, value){
	let values = value.split("|");
	let name = value.trim();
	if (values.length>1)
		name = values[0].trim();
	let pk = values.includes("pk");
	if (name == "number" && pk==true) return `'${column}' INTEGER PRIMARY KEY AUTOINCREMENT`;
	if (name == "uuid" && pk==true) return `'${column}' UUID PRIMARY KEY`;
	if (name == "string" && pk==true) return `'${column}' STRING PRIMARY KEY`;
	if (name == "number" || name == "integer" ) return `'${column}' INTEGER`;
	if (name == "uuid" ) return `'${column}' TEXT`;
	if (name == "float" ) return `'${column}' FLOAT`;
	if (name == "double" ) return `'${column}' FLOAT`;
	if (name == "blob" ) return `'${column}' BLOB`;
	if (name == "date" ) return `'${column}' DATE`;
	if (name == "time" ) return `'${column}' DATETIME`;
	if (name == "boolean" ) return `'${column}' BOOLEAN DEFAULT false NOT NULL`;
	if (name == "string" ) return `'${column}' TEXT`;
	if (name == "text" ) return `'${column}' TEXT`;
	if (name == "JSON" ) return `'${column}' TEXT`;
	if (name == "b64" ) return `'${column}' TEXT`;
	if (name == "b64aud" ) return `'${column}' TEXT`;        
	if (name == "b64zip" ) return `'${column}' TEXT`;
	if (name == "b64img" ) return `'${column}' TEXT`;  
	if (name == "softdelete" ) return `'${column}' BOOLEAN DEFAULT false NOT NULL`;        
}
class Entity{
	constructor(db,tableName,primaryKey){
		this._db 		= db;
		this._fields 	= {};
		this._relations	= [];
		this._nrelations= [];
		this._values	= {};
		this._pk 		= primaryKey?primaryKey:'id';
		this._tableName = tableName;
		this._isNew 	= true;
	}
	setNew(value){
		this._isNew = value;
	}
	struct(){
		
		if(!this._db.existTable(this._db.name)){
			let values = [];
			let uuidPk = null;
			Object.keys(this._fields).forEach(key => {
				const field = this._fields[key];
				if (field.auto && field.type=='uuid') uuidPk = field;
				values.push(`'${field.name}' ${setType(field.type)} ${field.pk?'PRIMARY KEY':''} ${field.default!=null&&field.default!=''&&!field.pk&&field.type!='uuid'?'DEFAULT '+field.default:''} ${field.auto&&field.type!='uuid'?'AUTOINCREMENT':''}`);
			});
			const sql = `CREATE TABLE ${this._tableName} (${values.join(',')}) ;`;
			console.log("sql",sql);
			this._db.execute(sql);
			if (uuidPk!=null)
				this._db.createTriggerUuid(this._tableName, uuidPk.name);
		}else{
			
			let fields = this._db.database.getFields(this._tableName);
			let dataCreate = Object.keys(this._fields).map(k=>this._fields[k].name);
			let isDifferent = false;
			let isNewColumn = false;
			let newColumns = [];
			fields.forEach( f => {
				if (!dataCreate.includes(f.name)) { isDifferent = true;}
			} );
			dataCreate.forEach( c => {				
				if ( fields.find( f => f.name == c)==null ) { console.log("es columna nueva ", c); newColumns.push(this._fields[c]); isNewColumn = true;}
			} );          
			newColumns.forEach( field=> {
				//let colInsert = toColumnName(c.name,c.type );
				let query = `ALTER TABLE ${this._tableName} ADD ${field.name} ${setType(field.type)} ${field.pk?'PRIMARY KEY':''} ${field.default!=null&&!field.pk&&field.type!='uuid'?'DEFAULT '+field.default:''} ${field.auto&&field.type!='uuid'?'AUTOINCREMENT':''}`;
				//console.log("query",query);
				this._db.execute(query);
			});
			if (isDifferent){				
				//console.log("is different",isDifferent);
				this._db.execute(` DROP TABLE ${this._tableName}; `);
				let values = [];
				let uuidPk = null;
				Object.keys(this._fields).forEach(key => {
					const field = this._fields[key];
					if (field.auto && field.type=='uuid') uuidPk = field;
					values.push(`'${field.name}' ${setType(field.type)} ${field.pk?'PRIMARY KEY':''} ${field.default!=null&&!field.pk&&field.type!='uuid'?'DEFAULT '+field.default:''} ${field.auto&&field.type!='uuid'?'AUTOINCREMENT':''}`);
				});
				const sql = `CREATE TABLE ${this._tableName} (${values.join(',')}) ;`;
				this._db.execute(sql);
				if (uuidPk!=null)
					this._db.createTriggerUuid(this._tableName, uuidPk.name);
			}
			
			Object.keys(this._fields).forEach(key => {
				const field = this._fields[key];

			});
		}
	}
	addRelation(table,field_rel,field_own,classType){
		this._relations.push({
			table:table,
			field_own:field_own,
			field_rel:field_rel,
			classType:classType
		});
	}
	addRelationN(field,classType){
		this._nrelations.push({
			field:field,
			classType:classType,
		});
	}
	addField(name,type,def,pk,auto){
		this._fields[name]={
			name:name,
			default:def,
			type:type,
			pk:pk,
			auto:auto,
		};
	}
	get(obj){
		Object.keys(this._values).forEach(k=>{
			obj[k] = this._values[k];
		});
	}
	set(values){
		Object.keys(this._fields).forEach(f=>this._values[f] = values[f]);		
		this._isNew = false;
	}
	_setValue(name,value){
		this._values[name] = value;
	}
	setFields(fields){
		this._fields = fields;
	}
	_setup(){		
		Object.keys(this._fields).forEach(fieldName=>{	
			this[toCamel('findBy_'+fieldName)] = (value,order,desc,limit,offset)=>{ return this.findBy(`${fieldName} = ?`,value,order,desc,limit,offset)};
			this[toCamel('set_'+fieldName)] = (value)=>{ this._setValue(fieldName,value); };
		});		
	}
	convField(field,value){
		if (field.type=='json') return JSON.stringify(value);
		return value;
	}
	parseField(field,value){
		if (field.type=='json') return JSON.parse(value);
		return value;
	}
	saveArray(arrayValues,callback){
		if (!Array.isArray(arrayValues)) return;
		let sqlArray = [];
		let cFields = Object.keys(this._fields).map(f=>`'${f}'`);
		arrayValues.forEach(values=>{
			let cParam = Object.keys(this._fields).map(f=>'?');
			let cValues = Object.keys(this._fields).map(f=>this.convField(this._fields[f],values[f]));
			const sql = `INSERT INTO ${this._tableName} (${cFields.join(',')}) VALUES (${cParam.join(',')})`;
			sqlArray.push({sql:sql,param:cValues});
		});
		//console.log("sqlArray",sqlArray);
		this._db.batch(sqlArray,()=>{		
			if (callback!=null) callback();
		});
	}
	save(){
		//if (this._values[this._pk]==null){
		if (this._isNew){
			let cParam = Object.keys(this._fields).map(fk=>'?');
			let cFields = Object.keys(this._fields).map(fk=>`'${fk}'`);
			let cValues = Object.keys(this._fields).map(fk=>this.convField(this._fields[fk],this._values[fk]));
			let sql = `INSERT INTO ${this._tableName} (${cFields.join(',')}) VALUES (${cParam.join(',')})`;
			const resultLast = this._db.executeParams(sql,cValues);
			console.log("resultLast",resultLast);
			if (resultLast == null){
				const id = this._values[this._pk];
				cFields = [];
				cValues = [];
				Object.keys(this._fields).forEach(f=>{
					if (this._values[f] != undefined){
						cFields.push(`${f}=?`);
						cValues.push(this._values[f]);					
					}
				});
				let sql = `UPDATE ${this._tableName} SET ${cFields.join(',')} WHERE ${this._pk}='${id}'`;
				this._db.executeParams(sql,cValues);
				return id;
			}
			const idIndex = resultLast.lastInsertRowid;//resultLast[0]['id'];
			const resultLastId = this._db.sql(`SELECT ${this._pk} FROM ${this._tableName} WHERE ROWID = ${idIndex}`);			
			const id = resultLastId[0][this._pk];
			this._setValue(this._pk,id);
			this._isNew = false;
			return id;

		}else{
			//UPDATE
			const id = this._values[this._pk];
			let cParam = Object.keys(this._fields).map(fk=>'?');
			let cFields = [];
			let cValues = [];
			Object.keys(this._fields).forEach(f=>{
				if (this._values[f] != undefined){
					cFields.push(`${f}=?`);
					cValues.push(this._values[f]);					
				}
			});
			let sql = `UPDATE ${this._tableName} SET ${cFields.join(',')} WHERE ${this._pk}='${id}'`;
			this._db.executeParams(sql,cValues);
			return id;
		}
	}
	findBy(condition,param,order,desc,limit,offset){
		const sql = `SELECT * FROM ${this._tableName} WHERE ${condition} ${(order==null|order=='')?'':'ORDER BY '+order} ${(desc==null||!desc)?'':'DESC'} ${(limit==null||limit<1)?'':'LIMIT '+limit} ${(offset==null||offset<1)?'':' OFFSET '+offset}`		
		const data = this._db.sqlParams(sql,param);
		data.forEach(row=>{
			Object.keys(row).forEach(k=>row[k]=this.parseField(this._fields[k],row[k]));
		})
		//this._values = data;		
		return data;
	}
	all(){
		return this._db.sql(`SELECT * FROM ${this._tableName}`);
	}
}
module.exports = {Entity}