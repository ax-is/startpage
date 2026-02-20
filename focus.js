/* focus.js */
(function () {
  // If the URL doesn't have the ?autofocus parameter, redirect instantly
  // to bypass the Chrome/Edge New Tab Page omnibox focus restriction.
  if (window.location.search !== "?autofocus") {
    window.location.replace("index.html?autofocus");
  }
})();
