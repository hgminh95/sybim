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

function generateRandomLightColor() {
  var letters = 'BCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++ ) {
    color += letters[Math.floor(Math.random() * letters.length)];
  }
  return color;
}

function getWSAddr() {
  let loc = window.location, new_uri;
  if (loc.protocol === "https:")
    new_uri = "wss:";
  else
    new_uri = "ws:";
  new_uri += "//" + loc.host + "/ws";

  return new_uri;
}