// Classic script (not a module). If the game has not drawn anything, say why.
// The usual cause is opening index.html from disk: browsers block ES modules
// on file:// pages, so the app cannot start without a local web server.
(function () {
  function show() {
    var app = document.getElementById("app");
    if (!app || app.childNodes.length) return;

    var box = document.createElement("div");
    box.className = "app-message";

    var title = document.createElement("h1");
    title.textContent = "Pushback Quest needs a web server";

    var why = document.createElement("p");
    why.textContent =
      "Browsers block JavaScript modules on pages opened straight from disk, so the game cannot start from a file. Serve this folder instead:";

    var steps = document.createElement("ul");
    [
      "Windows: double-click play.cmd",
      "Any system with Node.js: run node tools/serve.mjs, then open http://localhost:8080/",
      "Any system with Python: run python3 -m http.server, then open http://localhost:8000/",
    ].forEach(function (text) {
      var item = document.createElement("li");
      item.textContent = text;
      steps.appendChild(item);
    });

    box.appendChild(title);
    box.appendChild(why);
    box.appendChild(steps);
    app.appendChild(box);
  }

  if (window.location.protocol === "file:") {
    document.addEventListener("DOMContentLoaded", show);
  } else {
    window.addEventListener("load", function () {
      setTimeout(show, 2000);
    });
  }
})();
