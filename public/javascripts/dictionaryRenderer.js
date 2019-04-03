const concatReduce = (a, b) => a.concat(b);

const flattenTable = table => table.reduce(concatReduce).reduce(concatReduce);

class IthkuilRoot {
    constructor ({gloss, root, table, derived}) {
	this.gloss = gloss;
	this.root = root;
	this.table = table;
	this.derived = derived;
    }
    get stems () {
	return flattenTable(this.table);
    }
}
// 
const Dictionary = {
    entries: ROOT_INDEX.map(function(o) {return new IthkuilRoot(o)}),
    search: function(field, searchTerm){
              // function to test a string based on the given regexp
              function testString(str) {
                  var term = new RegExp(searchTerm, "i");
                  return term.test(str);
              };
              // 
              function searchTest(entry) {
                  // if the field is an array, test to see if any elements contain term
                  var fieldData = entry[field];
                  if (fieldData instanceof Array) {
                      return fieldData.some(testString);
                  } else {
                      return testString(fieldData);
                  };
              };
              // 
              return this.entries.filter(searchTest);
          }
};

Ithkuil = {};
Ithkuil.fns = {
  "stative": [
    "(a)",
    "e",
    "u",
    "o",
    "ö",
    "î/û",
    "â",
    "ê",
    "ô"
  ],
  "dynamic": [
    "i",
    "ai",
    "ei",
    "au",
    "eu",
    "iu",
    "ia/ua",
    "ie/ue",
    "io/uo"
  ],
  "manifestive": [
    "ui",
    "ü/ou",
    "ëi",
    "ae",
    "ea",
    "oa",
    "üa/aì",
    "iù/uì",
    "iö/uö"
  ],
  "descriptive": [
    "oi",
    "eo",
    "eö",
    "oe",
    "öe",
    "ëu",
    "üo/oì",
    "üe/eì",
    "üö/aù"
  ]
}

window.onload = renderDictionary;

function renderDictionary() {
    var content = document.querySelector(".content-wrapper");
    var fragment = document.createDocumentFragment();
    var search = renderSearchBar();
    content.appendChild(search);
    Dictionary.entries.forEach(function(entry) {
        var node = renderDictionaryEntry(entry);
        entry.node = node;
        fragment.appendChild(node);
    });

    content.appendChild(fragment);
};

function elt(tag) {
    var node = document.createElement(tag);
    for (var i = 1; i < arguments.length; i++) {
        var child = arguments[i];
        if (typeof child == "string")
            child = document.createTextNode(child);
        node.appendChild(child);
    };
    return node;
};

function renderDictionaryEntry(entry) {
    //
    //
    // get us a document fragment to package this up in
    // unpack the entry
    var root = entry.root;
    var gloss = entry.gloss;
    var table = entry.table;

    function renderEntryHeader(root, gloss) {
        // the root
        var rootNode = elt("h1", root);
        rootNode.className = "lx-root";
        // the gloss
        var glossNode = elt("p", gloss);
        glossNode.className = "lx-gloss";
        // the wrapper
        var header = elt("header", rootNode, glossNode);
        header.className = "lx-header";
        header.id = root + "-header";
        // 
        return header;
    };
    //
    function renderStemTable(tbl, root, gloss) {
        var tabMap = {};
        var tableWrapper = elt("div");
        tableWrapper.className = "lx-table-wrapper";
        for (var dsn in tbl) {
            var dsnLabel = ["informal", "formal"][dsn];
            var tbody = elt("tbody");
            // 
            var designation = elt("table", tbody);
            designation.className = "lx-designation";
            // 
            var designationId = [root, dsnLabel].join("-");
            designation.id = designationId;
            //
            // add the dsnLabel to our tab map, along with the designation node
            tabMap[dsnLabel] = designation;
            // for each pattern...
            for (var ptn in tbl[dsn]) {
                // make a container for it
                // var pattern = createEl("div");
                var ptnLabel = ptn;
                var ptnNum = (1 * ptn) + 1;
                var patternId = [designationId, "pattern", ptnLabel]
                    .join("-");
                // setProperty(pattern, "className", "lx-pattern");
                // setProperty(pattern, "id", patternId);
                var patternLabel = elt("th", "Ptn. " + ptnNum);
                var pattern = elt("tr", patternLabel);
                pattern.id = patternId;
                tbody.appendChild(pattern);
                // for each stem
                for (var s in tbl[dsn][ptn]) {
                    // locate the stem's gloss
                    var stemGloss = tbl[dsn][ptn][s];
                    // 
                    var stem = elt("td");
                    // give it a class for styling & DOM manipulation purposes
                    stem.className = "lx-stem " + "pattern-"
                        + ptn + " stem-" + s;
                    // put the data on the node
                    stem.setAttribute("ithkuil-designation", dsn);
                    stem.setAttribute("ithkuil-pattern", ptn);
                    stem.setAttribute("ithkuil-stem", s);
                    for (var fn in Ithkuil.fns) {
                        var rowMajor = (1 * s) + (3 * ptn);
                        var vowel = Ithkuil.fns[fn][rowMajor];
                        var instantiatedStem = vowel + root.toLowerCase();
                        dsn == 0 ? undefined : instantiatedStem += "á";
                        stem.setAttribute("ithkuil-" + fn, instantiatedStem);
                    };
                    // 
                    var stemP = elt("p");
                    stemP.textContent = stemGloss;
                    var stemLabel = s;
                    var stemId = [patternId, "stem", stemLabel]
                        .join("-");
                    stem.id = stemId;
                    stem.appendChild(stemP);
                    // pattern.appendChild(stem);
                    pattern.appendChild(stem);
                };
                // designation.appendChild(pattern);
            };
            tableWrapper.appendChild(designation);
        };
        var tabs = new TabBar(tabMap).init();
        var nav = tabs.node;
        tableWrapper.prepend(nav);
        return tableWrapper;
    }
    function renderDerivedRoots(derivedRoots) {
        var minorWrapper = elt("div");
        minorWrapper.className = "lx-minorRoots-wrapper";

        var minorHeading = elt("h2", "Roots patterned after -" + root + "-");
        minorHeading.className = "lx-minorRoots-heading";

        minorWrapper.appendChild(minorHeading);
        var derivedRootsList = elt("ul");
        derivedRootsList.className = "lx-minorRoots-list";

        for (var derivedRoot in derivedRoots) {
            var dr = elt("li", derivedRoots[derivedRoot]);
            dr.className = "lx-minorRoots-item";
            derivedRootsList.appendChild(dr);
        };
        minorWrapper.appendChild(derivedRootsList);
        return minorWrapper;
    }
    var header = renderEntryHeader(root, gloss);
    var stemTable = renderStemTable(table, root, gloss);
    var wrapper = elt("div", header, stemTable);
    wrapper.className = "lx-wrapper stative";
    wrapper.id = root + "-wrapper";
    if (entry.derived) {
        wrapper.appendChild(
            renderDerivedRoots(entry.derived));
    };
    return wrapper;
};

function Tab(label, target){
    var node = document.createElement("li");
    node.className = "tab-item";
    node.textContent = label;

    this.label = label;
    this.node = node;
    this.target = target;

    return this;

};

// 
Tab.prototype.activate = function(){
    this.node.classList.add("active");
    this.target.classList.remove("hidden");
    return this;
};
//

Tab.prototype.deactivate = function(){
    this.node.classList.remove("active");
    this.target.classList.add("hidden");
    return this;
};
//

function TabBar(map) {
    var self = this;
    var fragment = document.createDocumentFragment();

      var wrapper = document.createElement("nav");
      wrapper.className = "tab-bar";

      var list = document.createElement("ul");
      list.className = "tab-list";

      wrapper.appendChild(list);
      fragment.appendChild(wrapper);

      var tabs = [];

      for (var key in map) {
          var tab = new Tab(key, map[key]);
          var node = tab.node;
          // place the tab's list item in the tab bar's list node
          list.appendChild(node);
          node.addEventListener("click", (function(theTab) {
              return function() {
                  self.reset();
                  theTab.activate();
              };
          })(tab));

          // add it to our collection of Tab objects
          tabs.push(tab);
      };
    this.node = fragment;
    this.tabs = tabs;
    return this;

  };

TabBar.prototype.reset = function() {
    this.tabs.forEach(function(tab) {
        tab.deactivate();
    });
    return this;
};

TabBar.prototype.init = function() {
    this.reset();
    this.tabs[0].activate();
    return this;
}

function renderSearchBar() {
    var searchBox = elt("input");

    var gloss = elt("option", "gloss");
    var root = elt("option", "root");
    var derived = elt("option", "derived");
    var stems = elt("option", "stems");
    var all = elt("option", "all")

    var select = elt("select", gloss, root, stems, derived, all);
    // add event listeners
    searchBox.addEventListener("keyup", search);
    select.addEventListener("change", search);
    // 
    function dictionarySearch(field, value) {
        var results = Dictionary.search(field, value);
        Dictionary.entries.forEach(function(entry) {
            entry.node.classList.add("hidden");
        });
        results.forEach(function(entry) {
            entry.node.classList.remove("hidden");
        })
    };

    function search() {
        dictionarySearch(select.value, searchBox.value);
    };
    var form = elt("form", searchBox, select);
    form.className = "search-bar";
    return form

}
