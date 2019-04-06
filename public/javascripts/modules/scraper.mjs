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

// get all following text nodes until the next element
function slurpTextNodes (start) {
    let slurpedText = "", next = nextSibling(start);
    while (next.nodeType ? next.nodeType == Node.TEXT_NODE : false) {
        slurpedText += next.textContent;
        next = nextSibling(next)
    }
    return slurpedText;
}

// Root tables have a <strong> element in the first row
const getTableRoot = tbl => tbl.querySelector("tr").querySelector("strong");
// Get root text
const getTableRootText = tbl => getText(getTableRoot(tbl));
// Gloss strings should immediately follow the root as a text node
const getTableGlossText = tbl => getText(getTableRoot(tbl).nextSibling);
// Collect all root tables from page
const getAllRootTables = doc => Array.from(doc.querySelectorAll("table"))
      .filter(getTableRoot);

const tableToArray = tbl => Array.from(tbl.querySelectorAll("tr")) // table => array of rows...
      .map( tr => Array.from(tr.querySelectorAll("td"))	// row => array of cells
	    .map(textAndElement));				// cell => {text, element}

// regexp describing a root
const looseRootRegExp = /-? ?([^0-9: ]{1,6}) ?-?/;
// requires both hyphens to be present
const strictRootRegExp = /- ?([^0-9: ]{1,6}) ?-/;
// derived roots aren't children of a table
const derivedRootFilter = el => ! el.closest("table");
// all derived root labels
const getAllDerivedRoots = doc => Array.from(doc.querySelectorAll("strong"))
      .filter(derivedRootFilter);
const isolateDerivedRoot = el => looseRootRegExp.test(getText(el)) ?
      getText(el).match(looseRootRegExp)[1] : false;
// extract & parse derived roots
const extractDerivedRoot = el => ({root: isolateDerivedRoot(el),
                                   gloss: slurpTextNodes(el)});

class LexiconScraper {
    constructor (page) {
        this.allRootTables = LexiconScraper.rootTables(page);
        this.allDerivedRoots = LexiconScraper.derivedRoots(page);
    }
    static rootTables (page) {
        return getAllRootTables(page)
            .map(tbl => ({root: getTableRootText(tbl),
                          gloss: getTableGlossText(tbl),
                          node: tbl}));
    }
    static derivedRoots (page) {
        return getAllDerivedRoots(page).map(extractDerivedRoot);
    }
}
// inject 
window.Lexicon = new LexiconScraper(document);
