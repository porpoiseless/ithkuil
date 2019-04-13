// Scraping text


// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Scraping%20text][Scraping text:1]]
// get a node's text or the empty string
const getText = el => el.textContent || "";
// wrap the text and the node itself in an object
const textAndElement = el => ({text: getText(el),
                               node: el});
// get the following sibling
const nextSibling = el => el.nextSibling || false;
// get the following element sibling
const nextElementSibling = el => el.nextElementSibling || false;
// get the text of the next element sibling
const nextSiblingText = el => nextSibling(el) ? getText(nextSibling(el)) : false;
// get the text of the next element sibling
const nextElementSiblingText = el => nextElementSibling(el) ?
      getText(nextElementSibling(el)) : false;
// Scraping text:1 ends here

// Concatenate all subsequent text nodes

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Concatenate%20all%20subsequent%20text%20nodes][Concatenate all subsequent text nodes:1]]
// get all following text nodes until the next element
function slurpTextNodes (start) {
    let slurpedText = "", next = nextSibling(start);
    while (next.nodeType &&
           (next.nodeType == Node.TEXT_NODE ||
            next.nodeName == "EM" ||
            next.nodeName == "STRONG")) {
        slurpedText += next.textContent;
        next = nextSibling(next);
    }
    return slurpedText;
}
// Concatenate all subsequent text nodes:1 ends here

// Destructuring a table

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Destructuring%20a%20table][Destructuring a table:1]]
// turn an HTML table into an array of cells
const tableToArray = tbl => [...tbl.querySelectorAll("tr")].map( // get rows
    tr => [...tr.querySelectorAll("td")]			 // get the cells
        .map(getText)		// get the text
        .filter(o=>o));		// discard empties
// Destructuring a table:1 ends here

// Walk a table

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Walk%20a%20table][Walk a table:1]]
// callback takes:
// 1. item in the table
// 2. row index of the item
// 3. column index
// 4. the table itself
const walkTable = (tbl, callback) => tbl.forEach(
    (row, rowIndex) => row.forEach(
        (col, colIndex) => callback(tbl[rowIndex][colIndex],
                                    rowIndex,
                                    colIndex,
                                    tbl)));
// Walk a table:1 ends here

// Root table utilities

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Root%20table%20utilities][Root table utilities:1]]
// Root tables have a <strong> element in the first row
const getTableRoot = tbl => tbl.querySelector("tr").querySelector("strong");
// Get root text
const getTableRootText = tbl => getText(getTableRoot(tbl));
// Gloss strings should immediately follow the root as a text node
const getTableGlossText = tbl => slurpTextNodes(getTableRoot(tbl));
// Collect all root tables from page
const getAllRootTables = doc => Array.from(doc.querySelectorAll("table"))
      .filter(getTableRoot);
// is a cell a table header 
const tableHeaderRegExp = /\s*(?:(?:(?:in)?formal)|(?:compleme.tary))\s*(?:stems?)?\s*$/i;
// filters out table headers
const tableHeaderFilter = row => row.every(str => ! tableHeaderRegExp.test(str));
// check if a string is a note
const noteRegExp = /^\s*note:\s*/i;
// remove leading and trailing garbage and eliminate extra spaces
const cleanText = txt => txt.replace(/^[0-9\s-–]\.?\s*|[\s-–]\s*$/i, "").
      replace(/\s+/g, " ");
// clean up an array-table for processing
const stripTable = tbl => tbl.filter(tableHeaderFilter);
// Root table utilities:1 ends here

// StemTableFactory (makes table and setter) 

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*StemTableFactory%20(makes%20table%20and%20setter)][StemTableFactory (makes table and setter):1]]
const StemTableFactory = () => ({
    table: [[Array(3), Array(3), Array(3)],
            [Array(3), Array(3), Array(3)]],
    set: function ({gloss, designation, pattern, stem}) {
        this.table[designation][pattern][stem] = gloss;
        return this;
    }
});
// StemTableFactory (makes table and setter):1 ends here

// Handle holistic and complementary stems

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Handle%20holistic%20and%20complementary%20stems][Handle holistic and complementary stems:1]]
// input is a table in array form
// output object is a stemtable with it's addressing method
const handleHolisticStems = (input, output) =>
      walkTable(input, (gloss, row, col, tbl) =>
                output.set({gloss: gloss,
                            stem: row,
                            pattern: 0,
                            designation: col % 2}));
// complementary stems have a more varied structure: half width and full width,
// plus (easier to handle) variation in number of rows
const handleComplementaryStems = (input, output) =>
      walkTable(input, (gloss, row, col, tbl) => tbl[row].length > 2 ?
                output.set({gloss: gloss,
                            stem: row,
                            pattern: col % 2 + 1,
                            designation: col > 2 ? 1 : 0}) :
                output.set({gloss: gloss,
                            stem: row,
                            pattern: col % 2 + 1,
                            designation: col % 2}));
// Handle holistic and complementary stems:1 ends here

// Make Ithkuil root factory

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Make%20Ithkuil%20root%20factory][Make Ithkuil root factory:1]]
const IthkuilRootFactory = (table) => {
    // populate our return object
    let output = {gloss: cleanText(getTableGlossText(table)),
                  root: cleanText(getTableRootText(table))};
    // make a stemtable object to sort data from html tables
    let stems = StemTableFactory();
    // turn the table into an array
    let tblArray = stripTable(tableToArray(table).slice(1));
    // extract a leading "note: " row
    if (noteRegExp.test(tblArray[0][0])) {
        output.note = tblArray[0][0];
        tblArray = tblArray.slice(1);
    };
    // the first three rows are holistic stems
    handleHolisticStems(tblArray.slice(0,3), stems);
    // everything after is complementary
    handleComplementaryStems(tblArray.slice(3), stems);
    // pack the finished table into our result  
    output.table = stems.table;
    return output;
};
// Make Ithkuil root factory:1 ends here

// Scraping derived roots

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Scraping%20derived%20roots][Scraping derived roots:1]]
// regexp describing a root
const laxRootRegExp = /([SŠPTŢKBDGQMNŇJXRŘFVZŻŽLĻÇCČ][WY’hSŠPTŢKBDGQMNŇJXRŘFVZŻŽLĻÇCČ]*)/;
const strictRootRegexp =  /[\-–]([SŠPTŢKBDGQMNŇJXRŘFVZŻŽLĻÇCČ][WY’hʰHSŠPTŢKBDGQMNŇJXRŘFVZŻŽLĻÇCČ]*)\b/;

// derived roots aren't children of a table
const derivedRootFilter = el => ! el.closest("table");

// all derived root labels
const getAllDerivedRoots = doc => Array.from(doc.querySelectorAll("strong"))
      .filter(derivedRootFilter);
// 
const isolateDerivedRoot = el => getText(el).match(/\//) ? false : getText(el).replace(/[–\-\ ]/g,"");
// 
const cleanGloss = gloss => gloss.replace(/^\W*|\W*$/g, "") // remove quotes etc.
      .replace(/\s\s+/g, " ");			// remove extraneous space
// extract & parse derived roots
const extractDerivedRoot = el => ({root: isolateDerivedRoot(el),
                                   gloss: cleanGloss(slurpTextNodes(el)),
                                   next: nextElementSiblingText(el)});
// Scraping derived roots:1 ends here

// Guess the major root

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Guess%20the%20major%20root][Guess the major root:1]]
// best guess at major root, mark as orphan if no guess can be made
const guessMajorRoot = ({root, gloss, next}) => {
    if (next && laxRootRegExp.test(next)) {
        return {root: root, gloss: gloss, major: next.match(laxRootRegExp)[1]};
    } else if (gloss && strictRootRegexp.test(gloss)) {
        return {root: root, gloss: gloss, major: gloss.match(strictRootRegexp)[1]};
    } else {
        return {root: root, gloss: gloss, major: false, attempted: next};
    }
};
// Guess the major root:1 ends here

// Finish processing derived roots

// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Finish%20processing%20derived%20roots][Finish processing derived roots:1]]
const processDerivedRoot = el => guessMajorRoot(extractDerivedRoot(el))
// Finish processing derived roots:1 ends here

// Organize derived roots
//   designed to be an accumulator
//   1. accumulator
//   2. current value
//   3. +current index+
//   4. +source array+


// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Organize%20derived%20roots][Organize derived roots:1]]
// designed to be an accumulator
  // 1. accumulator
  // 2. current value
const derivedRootReducer = (acc={index:{},orphans:[]}, item) => {
    const index=acc.index, orphans=acc.orphans, major=item.major;
    if (item.root && major) {    // if we have a candidate for the derived and major roots 
        const newMajorIndex = index.hasOwnProperty(major) ? // add it to the existing entry
              index[major].concat(item) : Array.of(item); // or create a new one
        const newIndex = {...index, [major]: newMajorIndex };
        return {...acc, index: newIndex};
    } else {
        const newOrphans = orphans.concat(item);
        return {...acc, orphans: newOrphans};
    }
};
// Organize derived roots:1 ends here

// Behold, the scraper!


// [[file:~/Projects/ithkuil/ithkuil/literate/scraper_modules.org::*Behold,%20the%20scraper!][Behold, the scraper!:1]]
module.exports = {
    major: [],
    derived: {index: {},
              orphans: []},
    scrape: function (doc) {
        this.derived = getAllDerivedRoots(doc)	// get derived roots on page
            .map(processDerivedRoot) // parse into objects 
            .reduce(derivedRootReducer, this.derived); // reduce by major root
        this.major = this.major.concat(getAllRootTables(document).map(IthkuilRootFactory));
        return this;
    }
};
// Behold, the scraper!:1 ends here
