const {Entity} = require('../database/entity.js');

class UserEntity extends Entity{
	constructor(db){
		super(db,'user');
		this.addField('id','uuid',null,true,true);
		this.addField('username','text');
		this.addField('fullname','text');
		this.addField('password','text');
		this.addField('roles','text');
		this.addField('mail','text');
		this.addField('enabled','boolean',true);
		this._setup();
	}
}
module.exports = {UserEntity}