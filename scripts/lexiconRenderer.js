// create a new document fragment
function createFragment() {
    return document.createDocumentFragment();
};

// create a new HTML element
function createEl(tagName) {
    return document.createElement(tagName);
};

// set a property on an element
function setProperty(el, propertyName, propertyValue) {
    el[propertyName] = propertyValue
    return el;
};

function createLexiconHeader(root, gloss){
    // the header element contains a root and a gloss
    var header = createEl("header");
    setProperty(header, "id", root + "-header");
    setProperty(header, "className", "lx-header");
    // h contains the root text
    var h = createEl("h1");
    setProperty(h, "className", "lx-root");
    setProperty(h, "textContent", root);

    // p contains the gloss
    var p = createEl("p");
    setProperty(p, "className", "lx-gloss");
    setProperty(p, "textContent", gloss);
    //
    header.appendChild(h);
    header.appendChild(p);
    // 
    return header;
};

function render(entry) {
    var root = entry.root;
    var gloss = entry.gloss;
    // create a fragment
    var fragment = createFragment();
    // make a unique wrapper for the entry
    var wrapper = createEl("div");
    setProperty(wrapper, "id", root + "-wrapper");
    setProperty(wrapper, "className", "lx-wrapper");
    // put the wrapper in the fragment
    fragment.appendChild(wrapper);
    // make a header for the root
    var header = createLexiconHeader(root, gloss);
    var tabMap = {};

    wrapper.appendChild(header);
    //
    var tbl = entry.table;
    //
    var grid = createEl("div");
    grid.className = "lx-table-wrapper";
    // for each designation...
    for (var dsn in tbl) {
        // make a container for it
        var designation = createEl("div");
        setProperty(designation, "className", "lx-designation");
        var dsnLabel = ["informal", "formal"][dsn];
        var designationId = [root, dsnLabel].join("-");
        setProperty(designation, "id", designationId);
        //
        // add the dsnLabel to our tab map, along with the designation node
        tabMap[dsnLabel + " stems"] = designation;
        // for each pattern...
        for (var ptn in tbl[dsn]) {
            // make a container for it
            // var pattern = createEl("div");
            var ptnLabel = ptn;
            var patternId = [designationId, "pattern", ptnLabel]
                .join("-");
            // setProperty(pattern, "className", "lx-pattern");
            // setProperty(pattern, "id", patternId);

            // for each stem
            for (var s in tbl[dsn][ptn]) {
                // locate the stem's gloss
                var stemGloss = tbl[dsn][ptn][s];
                // 
                var stem = createEl("div");
                stem.className = "lx-stem " + "pattern-" + ptn + " stem-" + s;
                var stemP = createEl("p");
                var stemLabel = s;
                var stemId = [patternId, "stem", stemLabel]
                    .join("-");
                setProperty(stem, "id", stemId);
                stem.appendChild(stemP);
                // pattern.appendChild(stem);
                designation.appendChild(stem);
                stemP.textContent = stemGloss;
            };
            // designation.appendChild(pattern);
        };
        grid.appendChild(designation);
    };
    wrapper.appendChild(grid);
    // make a container for the minor roots
    // if the root has them
    if ("minorRoots" in entry) {
        var minorWrapper = document.createElement("div")
        minorWrapper.className = "lx-minorRoots-wrapper";

        var minorHeading = document.createElement("h2");
        minorHeading.className = "lx-minorRoots-heading";
        minorHeading.textContent = "Roots patterned after -" + root + "-";

        minorWrapper.appendChild(minorHeading);
        var minorRootsList = document.createElement("ul");
        minorRootsList.className = "lx-minorRoots-list";

        for (var minorRoot in entry.minorRoots) {
            var mr = document.createElement("li");
            mr.className = "lx-minorRoots-item";
            mr.textContent = entry.minorRoots[minorRoot];
            minorRootsList.appendChild(mr);
        };
        minorWrapper.appendChild(minorRootsList);
        wrapper.appendChild(minorWrapper);
    };




    var tabs = new TabBar(tabMap).init();
    var nav = tabs.node;
    header.appendChild(nav);
    var content = document.querySelector(".content-wrapper");
    content.appendChild(fragment);
    return wrapper;
};

window.onload = function() {
    var entries = Dictionary.entries;
    entries.forEach(function(entry) {
        var node = render(entry);
        entry.node = node;
    });
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

//
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

Dictionary.search = function(field, searchTerm) {
    var term = new RegExp(searchTerm, "i");
    return this.entries.filter(
        function(entry) {
            return term.test(entry[field]);
        });
};
