"use strict"

var bib = require("fs").readFileSync(__dirname + "/template.bib").toString()
var parse = require("../parse-bibtex.js")

//require("tape")("parse-bibtex", function(t) {

  var parsed = parse(bib)
  console.log(parsed)

//  t.end()
//})
