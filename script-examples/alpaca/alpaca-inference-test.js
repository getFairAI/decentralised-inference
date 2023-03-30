const CONFIG = require("./config.json");

const inference = async function (message) {
  // Do Inference
  const encoder = new TextEncoder();
  const data = Buffer.from(message, 'utf-8').toString();
  console.log(data);
  var res = await fetch(CONFIG.url + '?text='+data, {
    method: "GET",
  });
  var tempJSON;
  tempJSON = await res.json();
  var fullText = tempJSON.output;
  console.log(fullText);
  return fullText;
};

const inferencePOST = async function (message) {
  const data = Buffer.from(message, 'utf-8').toString();
  console.log(data);
  var res = await fetch(CONFIG.url, {
    method: "POST",
    body: message
  });
  var tempJSON;
  tempJSON = await res.json();
  var fullText = tempJSON.output;
  console.log(fullText);
  return fullText;
};

inferencePOST("test");
