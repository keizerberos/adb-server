"use strict";
const { Database } 		 = require('./database.js');
var fs 		             = require('fs');
const { UserEntity }     = require("./../entitys/user.entity.js");

class DBManager {
	constructor(){
        this.database = new Database("data");
		this.entitys = [];
		this.create();
	}
	addEntity(entity){
		this.entitys.push(entity);
	}
	build(){
        const me = this;
		this.entitys.forEach(e=>{
            const classEntity = new e(me);
            classEntity.struct();
		    //classEntity.setup(e);
        });
	};
	existTable(tableName){
		return this.database.existTable(tableName);
	}
    create(){                
        
        this.addEntity(UserEntity);  
        this.build();
    }
	createTriggerUuid(group_name, field_pk_uuid) {
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
		this.database.writeSQL(trigger);
	}
	batch(arraySql,callback,err){
		const me = this;
		me.database.dbx.serialize(()=>{			
			me.database.dbx.run("begin transaction");		
			try{
				arraySql.forEach(item => {
					me.database.dbx.prepare(item.sql).run(item.param);
				});
				me.database.dbx.run("commit",()=>{
					callback();
				});
			}catch(e){						
				err(e);	
			}    
		});
	}
    executeParams(sqlQuery,params){
        let response = null;
        try{
            response = this.database.db.prepare(sqlQuery).run(params)
        }catch(e){
			//console.log(e);
        }
        return response;
    }
    execute(sqlQuery){
        let response = null;
        try{
            response = this.database.db.prepare(sqlQuery).run()
        }catch(e){

        }
        return response;
    }
    sql(sql){
        console.log("db.sql:",sql);
        let res =null;
        try{
             res = this.database.db.prepare(sql).all();
        }catch(e){

        }
        return res;
    }
    sqlParams(sql,params){
        console.log("db.sql:",sql);
        let res =null;
        try{
             res = this.database.db.prepare(sql).all(params);
        }catch(e){

        }
        return res;
    }
    
}

module.exports = {DBManager};