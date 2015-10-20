"use strict"

// Usage: node bibtex2json.js filename.bib
// Requires that parse-bibtex.js is in hte same directory as bibtex2json.js
var filepath = __dirname + "/" + process.argv[2];
var bib = require("fs").readFileSync(filepath).toString();
var parse = require(__dirname + "/parse-bibtex.js");

var parsed = parse(bib);

//Dictionary for converting latex special character codes into utf-8
//equivalents
var specialCharsDict = {
    '{\\"o}': 'ö',
    '\\"{o}': 'ö',
    "\\\x27{e}": 'é',
    "{\\\x27e}": 'é',
    "\\'{c}": 'ć',
    '{\\"a}': 'ä',
    '\\"{a}': 'ä',
    '\\&': '&'
};

var specialTitleWordsDict = {
    ': a': ': A',
    '3d': '3D'
}


var confJournNamesDict = {
    'User Interface Software and Technology': 'User Interface Software and Technology (UIST)',
    'Computer Supported Cooperative Work': 'Computer Supported Cooperative Work (CSCW)',
    'ACM Trans. Graph.': 'ACM Transactions on Graphics (MISSING SHORTNAME)',
    'Visualization and Computer Graphics': 'IEEE Trans. on Visualization and Computer Graphics (MISSING SHORTNAME)',
    'Comput. Graph. Forum': 'Computer Graphics Forum (EGSR)',
    'SIGCHI Conference on Human Factors in Computing Systems': 'ACM Human Factors in Computing Systems (CHI)',
    'Commun. ACM': 'Communications of the ACM (CACM)',
    'ACM Trans. Comput.-Hum. Interact.': 'ACM Trans. on Computer-Human Interaction',
    'Graphics Interface': 'Graphics Interface',
    'Applied Perception in Graphics and Visualization': 'Applied Perception in Graphics and Visualization (APGV)',
    'Visual Analytics Science and Technology': 'Visual Analytics Science and Technology (VAST)',
    'Eurographics Conference on Rendering Techniques':'Eurographics Conference on Rendering Techniques (EGSR)',
    'Computer Vision and Pattern Recognition': 'Computer Vision and Pattern Recognition (CVPR)',
    'Advanced Visual Interfaces': 'Advanced Visual Interfaces (AVI)',
    'International Conference on Human-Computer Interaction': 'International Conference on Human-Computer Interaction (INTERACT)',
    'International Conference on Document Analysis and Recognition': 'International Conference on Document Analysis and Recognition (ICDAR)',
    'Conference on Visualization': 'IEEE Visualization',
    'Symposium on Computer Animation': 'Symposium on Computer Animation (SCA)',
    'Interactive 3D Graphics': 'ACM Symposium on Interactive 3D Graphics (I3D)'
}

var monthsDict = {
    JANUARY: "Jan",
    FEBRUARY: "Feb",
    MARCH: "Mar",      
    APRIL: "Apr",
    MAY: "May",
    JUNE: "Jun",
    JULY: "Jul",
    AUGUST: "Aug",
    SEPTEMBER: "Sep",
    OCTOBER: "Oct",
    NOVEMBER: "Nov",
    DECEMBER: "Dec",
    JAN: "Jan",
    FEB: "Feb",
    MAR: "Mar",      
    APR: "Apr",
//    MAY: "May",
    JUN: "Jun",
    JUL: "Jul",
    AUG: "Aug",
    SEP: "Sep",
    OCT: "Oct",
    NOV: "Nov",
    DEC: "Dec"
  };


String.prototype.toTitleCase = function() {
  var i, j, str, lowers, uppers;
  str = this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });

  // Certain minor words should be left lowercase unless 
  // they are the first or last words in the string
  lowers = ['A', 'An', 'The', 'And', 'But', 'Or', 'For', 'Nor', 'As', 'At', 
  'By', 'For', 'From', 'In', 'Into', 'Near', 'Of', 'On', 'Onto', 'To', 'With'];
  for (i = 0, j = lowers.length; i < j; i++)
      str = str.replace(new RegExp('\\s' + lowers[i] + '\\s', 'g'), 
			function(txt) {
			    return txt.toLowerCase();
			});

    for (var stwkey in specialTitleWordsDict) {
	str = str.replace(stwkey,specialTitleWordsDict[stwkey]);
    }


  // Certain words such as initialisms or acronyms should be left uppercase
  uppers = ['Id', 'Tv'];
  for (i = 0, j = uppers.length; i < j; i++)
    str = str.replace(new RegExp('\\b' + uppers[i] + '\\b', 'g'), 
      uppers[i].toUpperCase());

  return str;
}

var finalPubsList = [];

function escapeRegExp(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

for (var key in parsed) {
    // parse-bibtex always makes an extra @comments entry at end of pubs list.
    // We skip processing this entry.
    if(key == '@comments') continue;

    var pub = parsed[key];
    
    var finalPub = {};

    // Start by copying over all fields from pub to finalpub
    for (var pubkey in pub) {
	//	finalPub[pubkey.toLowerCase()] = pub[pubkey];

	// During first copy replace special latex chacters with utf-8 equivs.
	var value = pub[pubkey];
	for (var sckey in specialCharsDict) {
	    value = value.replace(new RegExp(escapeRegExp(sckey), 'g'),
				  specialCharsDict[sckey]);
	}
	for (var cjkey in confJournNamesDict) {
	    if(value.search(cjkey) > -1) {
		value = confJournNamesDict[cjkey];
	    }
	}
	
	finalPub[pubkey.toLowerCase()] = value;
    }

    // Reformat TITLE field to titleCase (see function above)
    var title = finalPub["title"];
    var finalTitle = title;
    if (title) {
	finalTitle = title.toTitleCase();
	finalPub["title"] = finalTitle;
    } else {
	finalPub["title"] = "MISSING TITLE";
    }
    
    // Reformat AUTHOR field into an array of authors in "first last" format.
    //
    var authors = finalPub["author"];
    var finalAuthorsList = [];
    if (authors) {
	var authorsArray = authors.split(" and ");
	// Check if format if "last, first" or "first last"
	// If using comma seprated format, reformat to "first last"
	for (var i=0; i < authorsArray.length; i++) {
	    var fullname = authorsArray[i];
	    var namesplit = fullname.split(", ");
	    if (namesplit.length == 2) {
		fullname = namesplit[1] + " " + namesplit[0];
	    }
	    finalAuthorsList[i] = fullname;
	}
	finalPub["author"] = finalAuthorsList;
    } else {
	finalPub["author"] = "MISSING AUTHORS";
    }

    // Reformat month into three letter month name
    var month = finalPub["month"];
    var finalMonth = month;
    if (month) {
	if (monthsDict[month.toUpperCase()]) {
	    finalMonth = monthsDict[month.toUpperCase()];
	}
	finalPub["month"] = finalMonth;
    } else {
	finalPub["month"] = "MISSING MONTH";
    }

    // Reformat pages to turn "--" to "-"
    var pages = finalPub["pages"];
    var finalPages = pages;
    if (pages) {
	var pageslist = pages.split("--");
	if (pageslist.length > 1) {
	    finalPages = pageslist[0] + "-" + pageslist[1];
	    finalPub["pages"] = finalPages;
	}
    } else {
	finalPub["pages"] = "MISSING PAGES";
    }

    // Reformat keywords as a list
    var keywordsList = finalPub["keywords"];
    var finalKeywords = keywordsList;
    if (keywordsList) {
	finalPub["keywords"] = keywordsList.split(", ");
    } else {
	finalPub["keywords"] = ["MISSING KEYWORDS"];
    }

    //Add in fields for (keywords, url, thumbnail, award, quicklinks)
    //with value MISSING
    finalPub["url"] = "MISSING URL";
    finalPub["thumbnail"] = "MISSING THUMBNAIL";
    finalPub["award"] = "MISSING AWARD";
    finalPub["quicklinks"] = [ { "type": "MISSING QLINK", "url": "MISSING QLINK" } ];

//    console.log(finalPub);
//    console.log("      ");

    finalPubsList.push(finalPub);
}
console.log(JSON.stringify(finalPubsList, null, "    "));
//console.log(parsed);
