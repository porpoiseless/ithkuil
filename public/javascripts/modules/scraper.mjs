// Scraper modules
//
// ---- ROOT TABLE UTILITIES ----
// 
// Root tables have a <strong> element in the first row
const getTableRoot = tbl => tbl.querySelector("tr").querySelector("strong");
// Get root text
const getTableRootText = tbl => getTableRoot(tbl).textContent;
// Gloss strings should immediately follow the root as a text node
const getTableGlossText = tbl => getTableRoot(tbl).nextSibling.textContent;
// Extract all Root tables from page
const getAllRootTables = doc => Array.from(doc.querySelectorAll("table"))
      .filter(getTableRoot);
// 
// ---- DERIVED ROOT UTILITIES ----
//
const rootRegexp = /-? ?([^0-9:]{1,6}) ?-?/g;



class LexiconScraper {
    constructor (page) {
	this.page = page;
    }
    get rootTables () {
	return getAllRootTables(this.page)
	    .map(tbl => ({root: getTableRootText(tbl),
			  gloss: getTableGlossText(tbl),
			  node: tbl}));
    }
    get derivedRoots () {
	
    }
}

window.Lexicon = new LexiconScraper(document);
	
