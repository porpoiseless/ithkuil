function containsNewline(str) {
    if (str.search(/$/m) == -1){
	return false;
    }else{
	return true;
    };
};

function notJustSpace(str) {
    if (str.search(/\S/) == -1){
        return false;
    }else{
        return true;
    };
};

// get a node's text
function text(node) {
    return node.textContent;
};

function allDerivedRoots() {
    var allP = [].slice.call(
        document.querySelectorAll('p')).map(text);
    return allP.filter(isDerivedRoot);
};

function checkCombinedEntry(pText) {
    // if it contains a newline...
    if (containsNewline(pText)){
        // split it, eliminating strings consisting only of whitepace
        var potentials = pText.split(/$/m).filter(notJustSpace);
        // returns an array if there is more than one interesting string 
        if (potentials.length > 1) {
            return potentials;
        } else {
            // otherwise returns the only member of the array
            return potentials[0];
        };
    } else {
        // if it doesn't contain a newline, the string is good as is
        return pText;
    };
};

function makeLexEntry(lx, matches, index) {
    var majorRoot = matches[1].slice(1,-1);
    var derivedRoot = matches[0].slice(1,-1);
    // if there is already an entry for this majorRoot...
    if (index.hasOwnProperty(majorRoot)) {
        // put the derivedRoot in the appropriate place
        index[majorRoot].push(lx);
    } else {
        // otherwise make a new entry
        index[majorRoot] = Array.of(lx);
    };
};

function sortRoot(lexText, index, orphans) {
    var matches = lexText.match(/-\S+?-/g);
    if (matches == null){
        orphans.push(lexText);
    } else if (matches.length == 2) {
        makeLexEntry(lexText, matches, index);
        return;
    } else {
        orphans.push(lexText);
    };
};

// create a dictionary of Ithkuil roots
function derivedRoots() {
    // dictionary of major roots and their minor root followers
    var index = {};
    // a bucket for ill-formed strings that need human sorting 
    var orphans = [];
    // collect all derived roots
    var d = allDerivedRoots()
    // split combined entries
        .map(checkCombinedEntry)
    // flatten nested arrays
        .reduce(
            function(acc,val) {
                if (Array.isArray(val)) {
                    acc = acc.concat(val);
                } else {
                    acc.push(val);
                }
                return acc;
            }, []);
    // sort through the collection of roots
    // into the index and orphan containers
    d.forEach(function(lx) {
        sortRoot(lx, index, orphans);
    });
    return index;
};

function isDerivedRoot(text) {
    if (text.search(/pattern of stems|patterned/i) === -1) {
        return false;
    } else {
        return true;
    };
}

function isRootTable(tableNode) {
    if (tableNode.querySelector('tr').textContent.search(/-\s*\S+?\s*-/) === -1) {
        return false;
    } else {
        return true;
    };
};

function allTableRoots() {
    // get all <TABLE>
    var allTables = [].slice.call(document.querySelectorAll('table'));
    // quick and dirty test to see if it's a root table

    return allTables.filter(isRootTable);
};

function tableToRowArray(tbl) {
    var rows = [].slice.call(tbl.querySelectorAll('tr'));
    var result = [];
    rows.forEach(
        function (row){
            var cells = [].slice.call(row.querySelectorAll('td'));
            result.push(cells.map(
                function(node){
                    return node.textContent;
                }));		
        });
    return result;    
}

function handleRootAndGloss(str) {
    var rootPattern = /-\s*(\S+?)\s*-\s*(.*)/;
    var matches = str.match(rootPattern);
    return {"root": matches[1],
            "gloss": matches[2]};
};

function buildTestTables() {
    var allTables = allTableRoots();
    // the addressing here is hard-coded
    // not a problem because page static
    // and I'm working on locally archived copy
    var testSites = [[10,10], 	//  10 cell
                     [15,14],	// 14 cell
                     [20,15], 	// 15 cell
                     [68,16], 	// 16 cell
                     [90,19], 	// 19 cell
                     [98,23]];	// 23 cell
    var result = [];
    testSites.forEach( function(site) {
        var testIndex = site[0];
        var numberOfCells = site[1];
        result[numberOfCells] = allTables[testIndex];
    });
    return result;
}



function countCells(table) {
    return table.querySelectorAll("td").length;
};

function countRows(table) {
    return table.querySelectorAll("tr").length;
};

MajorRootEntry.prototype.minorRootIndex = derivedRoots();

function MajorRootEntry(rowArray) {
    // strip first row from rowArray, parse root & gloss 
    var firstRowContents = rowArray.shift().shift();
    var header = handleRootAndGloss(firstRowContents);
    var root = header.root;
    var gloss = header.gloss
        .replace(/‘|’/g, "")
        .replace(/\s\s+/g, " ")
        .toLowerCase();
    // produce a table with header cells removed
    var strippedTable = rowArray.filter(
        // filter rows by what is NOT a table header
        function(row){
            return ! isRowTableHeader(row);
        });
    // search the index for minor roots
    var minorRoots = this.minorRootIndex[root];
    return {
        "gloss": gloss,
        "root": root,
        "table": new StemTable(strippedTable).stems,
        "minorRoots": minorRoots
        };

};

// a utility for going over a table
function tablewalk(tbl, callback) {
    for (var row = 0; row < tbl.length; row++) {
        for (var col = 0; col < tbl[row].length; col++) {
            // it passes the callback the table,
            // the cell under consideration
            // the row and column number where the cell was found
            callback(tbl, row, col);
        };
    };
};
//
StemTable.prototype.handleComplementaryPatterns = function(tbl) {
    var self = this;
    tablewalk(tbl.slice(3),
              function(t, row, col) {
                  // informal stems on the left, formal on right
                  var designation = col < 2 ? 0 : 1;
                  // every other col is pattern 1 or pattern 2
                  var pattern = col % 2 + 1;
                  // row is stem
                  var stem = row;
                  var gloss = t[row][col];
                  self.setStem(gloss, designation, pattern, stem)
              });
};

StemTable.prototype.handleHolisticPattern = function(tbl) {
    var reference;
    var self = this;
    tablewalk(tbl.slice(0,3),
              function(t, row, col) {
                  var gloss = t[row][col];
                  self.setStem(gloss, col, 0, row);
                  if (row == 0 && col == 1) {
                      // store reference if on row 0 col 1
                      // (i.e. Formal Designation, Pattern 1, Row 1)
                      reference = gloss;
                  } else if (t[row].length < 2) {
                      // if any subsequent row has fewer than two cells
                      // fill them in from the reference string
                      self.setStem(reference, 1, 0, row);
                  };
              });
};
// setter for the stemtable...
// 1. takes the gloss found in the table
// 2. an integer representing informal (0) or formal (1)
// 3. an integer representing the pattern, 0-2
// 4. an integer representing the stem number, 0-2
StemTable.prototype.setStem = function(stemGloss, designation, pattern, stem) {
    this.stems[designation][pattern][stem] = stemGloss
        .replace(/^\s*\d+\.\s*/, "")
        .replace(/\s\s+/g, " ");
    return this;
}
// makes an empty StemTable
StemTable.prototype.create = function() {
    var stems = [];
    for (var dsn = 0; dsn < 2; dsn++) {
        var designation = [];
        for (pattern = 0; pattern < 3; pattern++) {
            designation.push(new Array(3));
        };
        stems.push(designation);
    };
    return stems;
}
// constructor
function StemTable(tbl) {
    this.stems = this.create();
    this.handleHolisticPattern(tbl);
    this.handleComplementaryPatterns(tbl);
    return this;
};

function isTableHeader(str){
    var searchPattern = /(complementary|(in)?formal)\s*stems?/i;
    if (str.search(searchPattern) == -1){
        return false;
    } else {
        return true;
    };    
}

function isRowTableHeader(ary) {
    if (ary.map(isTableHeader)
        .includes(false)){
        return false;
    } else {
        return true;
    }
}

function Lexicon() {
    this.entries = allTableRoots().map(tableToRowArray)
            .map(function(rowArray) {
                return new MajorRootEntry(rowArray);
            });
    this.searchField = function(field, searchTerm) {
        var term = new RegExp(term, "i");
        return this.entries.filter(function(entry) {
            return term.test(entry[field]);
        });
    }
    return this;
};

var dict = new Lexicon();
