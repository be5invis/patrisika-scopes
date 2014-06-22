var Hash = require('./hash').Hash;

var Declaration = function(name, isParameter, belongs){
	this.name = name;
	this.isParameter = isParameter;
	this.belongs = belongs
}
Declaration.prototype.toString = function(){
	return this.name;
}

var N = 0;
var Scope = function(parent, semiparent){
	this.parent = parent;
	this.semiparent = semiparent;
	this.declarations = new Hash();
	this.avaliables = new Hash();
	this.uses = new Hash();

	if(this.parent && this.parent.macros){
		this.macros = Object.create(parent.macros)
	} else {
		this.macros = new Hash()
	}
	
	this.N = (++N);
	this.locals = [];
	this.resolved = false;
	this.temps = [];
}
Scope.prototype.use = function(name) {
	this.uses.put(name, null);
	return ['.id', name, this];
//	return new Reference(this, name)
}
Scope.prototype.declare = function(name, isParameter) {
	if(typeof name !== 'string') debugger;
	var decl = new Declaration(name, isParameter, this)
	this.declarations.put(name, decl);
	return decl;
}
Scope.prototype.resolve = function(){
	if(this.resolved) return;
	var t = this;
	if(t.parent) {
		t.parent.resolve();
		t.parent.avaliables.forEachOwn(function(id, decl){
			t.avaliables.put(id, decl)
		});
	};
	if(t.semiparent) {
		t.semiparent.resolve();
		t.semiparent.avaliables.forEachOwn(function(id, decl){
			t.avaliables.put(id, decl)
		});
	};
	t.declarations.forEachOwn(function(id, decl){
		t.avaliables.put(id, decl)
	});
	t.uses.rewriteOwn(function(id, ref){
		if(!t.avaliables.has(id)){
			t.avaliables.put(id, t.declare(id))
		};
		return t.avaliables.get(id);
	});
	t.declarations.forEachOwn(function(id, decl){
		t.locals.push(id);
	});
	t.resolved = true;
}
Scope.prototype.castName = function(name){
	return 's' + this.N + '_' + name;
}
Scope.prototype.castTempName = function(name){
	return '_s' + this.N + '_' + name;
}
Scope.prototype.inspect = function(){ return "[scope #" + this.N + "]" }
Scope.prototype.newt = function(fn){
	return ['.t', (this.temps[this.temps.length] = (fn || 't') + this.temps.length), this]
}

exports.Declaration = Declaration;
exports.Scope = Scope;
exports.resolveIdentifier = function(id, scope){
	scope.resolve();
	return scope.uses.get(id).belongs.castName(id);
}