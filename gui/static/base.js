let $ = id => document.getElementById(id);

let g_toasting = false;

function toast(msg) {
  if (!g_toasting) {  /* handle multiple toast called, probably not perfect */
    g_toasting = true;

    let x = $("toast");
    x.innerHTML = msg;
    x.className = "show";
    setTimeout(function() {
      x.className = x.className.replace("show", "");
      g_toasting = false;
    }, 3000);
  } else {
    setTimeout(() => toast(msg), 1000);
  }
}
