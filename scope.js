var Hash = require('./hash').Hash;
var escapeId = require('./castname').escapeId;
var Declaration = function(name, isParameter, belongs){
	this.name = name;
	this.isParameter = isParameter;
	this.belongs = belongs
}
Declaration.prototype.toString = function(){
	return this.name;
}

var _N = 0;
var familyNumerings = {
	's' : 0,
	'r' : 0
}
var Scope = function(parent, semiparent){
	this.parent = parent;
	this.semiparent = semiparent;
	this.declarations = new Hash();
	this.avaliables = new Hash();
	this.uses = new Hash();
	this.firstUse = new Hash();

	if(this.parent && this.parent.macros){
		this.macros = Object.create(parent.macros)
	} else {
		this.macros = new Hash()
	}

	this.locals = [];
	this.resolved = false;
	this.temps = [];
	this._N = (_N)++;

	this.family = (parent ? parent.pFamily : semiparent ? semiparent.pFamily : 's') || 's';
	this.pFamily = this.family;
	if(!familyNumerings[this.family]) familyNumerings[this.family] = 0;
	this.N = (familyNumerings[this.family]++)
}
Scope.prototype.use = function(name) {
	var node = ['.id', name, this]
	this.uses.put(name, null);
	if(!this.firstUse.has(name)) {
		this.firstUse.put(name, node)
	}
	return node;
}
Scope.prototype.declare = function(name, isParameter) {
	if(typeof name !== 'string') debugger;
	var decl = new Declaration(name, isParameter, this)
	this.declarations.put(name, decl);
	return decl;
}
Scope.prototype.resolve = function(cache, strictQ){
	if(cache[this._N]) return cache[this._N];

	var t = this;
	var root = { hangedScopes : 0 };
	var _root = root;

	var avaliables = new Hash();
	var postDeclarations = new Hash();


	if(t.semiparent) {
		var mSemiParent = t.semiparent.resolve(cache, strictQ);
		var sroot = mSemiParent.root;
		mSemiParent.avaliables.forEachOwn(function(id, decl){
			avaliables.put(id, decl)
		});
	};

	// t.parent has a higher priority
	if(t.parent) {
		var mParent = t.parent.resolve(cache, strictQ);
		var proot = mParent.root;
		if(proot) root = proot;
		mParent.avaliables.forEachOwn(function(id, decl){
			avaliables.put(id, decl)
		});
	};
	if(root === _root) var N = root.hangedScopes = 0; else var N = root.hangedScopes += 1;

	t.declarations.forEachOwn(function(id, decl){
		avaliables.put(id, decl)
	});

	var uses = t.uses.mapOwn(function(id, ref){
		if(!avaliables.has(id)) {
			if(strictQ) {
				console.log(id, ref)
				var e = new Error();
				e.reason = e.message = "Undeclared variable " + id;
				e.relatedForm = t.firstUse.get(id);
				throw e;
			}
			var decl = new Declaration(id, false, t)
			postDeclarations.put(id, decl);
			avaliables.put(id, decl)
		};
		return avaliables.get(id);
	});

	var locals = [];
	t.declarations.forEachOwn(function(id, decl){ locals.push(id) });
	postDeclarations.forEachOwn(function(id, decl){ locals.push(id) });

	if(t.hanging) {
		th = t.semiparent || t.parent;
		while(th.hanging) th = th.semiparent || t.parent;
		cache[th._N].hangingSubscopes.push(t);
	}

	return cache[t._N] = {
		avaliables: avaliables,
		locals: locals,
		uses: uses,
		root: root,
		hangingSubscopes: []
	};
}
Scope.prototype.castName = function(name){
	return this.family + this.N + '_' + escapeId(name)
}
Scope.prototype.castTempName = function(name){
	return '_' + this.family + this.N + '_' + escapeId(name)
}
Scope.prototype.inspect = function(){ return "[scope#" + this._N + "]" }
Scope.prototype.newt = function(fn){
	return ['.t', (this.temps[this.temps.length] = (fn || 't') + this.temps.length), this]
}

exports.Declaration = Declaration;
exports.Scope = Scope;
exports.resolveIdentifier = function(id, scope, cache, strictQ){
	var match = scope.resolve(cache, strictQ);
	return match.uses.get(id).belongs.castName(id);
}
exports.resolveTemp = function(id, scope, cache){
	scope.resolve(cache);
	return scope.castTempName(id);
}
exports.escapeId = escapeId;