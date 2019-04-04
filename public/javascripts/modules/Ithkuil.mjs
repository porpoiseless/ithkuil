// Ithkuil class
class IthkuilRoot {
    constructor({gloss, root, table, derived}) {
	this.root=root;
	this.gloss=gloss;
	this.table=table;
	this.derived=derived;
    }
    get stems () {
	const concatReducer = (a,b) => a.concat(b);
	return this.table
	    .reduce(concatReducer)
	    .reduceConcatReducer;
    }
}
