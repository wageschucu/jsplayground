/////////////////////////////////

// the irresistible cat ran into the burning house


EnglishRecategorizations = [
		 {matchExp: AbstractTag, transform: "abstract"}	
		,{matchExp: LeafTag, transform: "stem word" } 
		,{matchExp: /VBG/, transform: "adj open -?"}
		,{matchExp: /V[^P].?/, transform: "verb open -?"}
		,{matchExp: /VB/, transform: "verb open -?"}
		,{matchExp: /MD/, transform: "verb modal -?"}
		,{matchExp: /VP/, transform: "verbPhrase -?"}
		,{matchExp: /RB/, transform: "adv  -?"}
		,{matchExp: /ADVP/, transform: "advPhrase -?"}
		,{matchExp: /NNS/, transform: "noun open -?"}
		,{matchExp: /NN/, transform: "noun open -?"}
		,{matchExp: /NP/, transform: "nounPhrase -?"}
		,{matchExp: /ADJP/, transform: "adjPhrase -?"}
		,{matchExp: /JJS/, transform: "adj closed -?"}
		,{matchExp: /JJ/, transform: "adj open -?"}
		,{matchExp: /PP/, transform: "prepPhrase -?"}
		,{matchExp: /IN/, transform: "prep -?"}
		,{matchExp: /DT/, transform: "det adj -?"}
		,{matchExp: /CC/, transform: "conj -?"}
		,{matchExp: /S[^B]?/, transform: "sentence -?"}
		,{matchExp: /SBAR/, transform: "sentenceBar -?"}

		// additions
		,{matchExp: "det", transform: "closed"}
		,{matchExp: "prep", transform: "closed"}
		,{matchExp: "modal", transform: "closed"}
		,{matchExp: "conj", transform: "closed"}
];

// (ROOT
//   (S
//     (NP (DT the) (JJ irresistible) (NN cat))
//     (VP (VBD ran)
//       (PP (IN into)
//         (NP (DT the) (VBG burning) (NN house))))))

((EnglishAffixes = [
	 { name: "latin-verb", prio:1,
	 				matchExp: "(adj stem)", affixes:"ir in is", isPrefix:true, 
				 		absTrans:"abstract -stem latin -open", 
				 		affTrans:"pref closed morph -stem  latin -open", 
				 		stemTrans : "stem latin open morph " }
	,{ name: "compound-prep", prio:1,
	 				matchExp: "(prep stem)", affixes:"in", isPrefix:true, 
				 		absTrans:"abstract -stem", 
				 		affTrans:"pref morph  -stem", 
				 		stemTrans : "pref morph " }
	,{ name: "latin-adj-from-verb", prio:1, 
					matchExp: "(stem adj)", affixes:"eble ible able", isPrefix:false, 
						absTrans:"adj abstract -stem latin verbToAdj -open", 
						affTrans:"suf closed morph -stem morph -open", 
						stemTrans : "stem -adj verb latin open morph" }
	,{ name: "latin-verb", prio:1,
	 				matchExp: "(stem verb)", affixes:"re pre", isPrefix:true, 
				 		absTrans:"pref verb abstract -stem latin -open", 
				 		affTrans:"pref closed morph -stem -open", 
				 		stemTrans : "stem verb latin open morph" }
	,{ name: "latin-verb", prio:1,  
					matchExp: "(stem verb)", affixes:"con com", isPrefix:true,
						absTrans:"pref verb abstract -stem latin -open", 
						affTrans:"pref closed morph -stem morph -open", 
						stemTrans : "stem verb latin open morph" }

	,{ name: "gerund-verb-to-adj", prio:1, 
					matchExp: "(adj stem)", affixes:"ing", isPrefix:false, 
						absTrans:"adj abstract -stem verbToAdj -open", 
						affTrans:"suf closed morph -stem -open ", 
						stemTrans : "stem -adj verb open morph " }
	,{ name: "german-noun", prio:1,
	 				matchExp: "(stem noun)", affixes:"mis", isPrefix:true, 
				 		absTrans:"abstract -stem german -open", 
				 		affTrans:"pref closed morph -stem -open -noun german ", 
				 		stemTrans : "stem noun german open morph " }
	,{ name: "noun-plural", prio:1, 
					matchExp: "(noun stem)", affixes:"s es", isPrefix:false, 
						absTrans:"abstract -stem -open", 
						affTrans:"suf closed morph -stem  -noun -open", 
						stemTrans : "stem open morph " }

]).afterEach = [
		// these rules are only applied to affix generated children immediately after they are created
	 	{ name: "no-inheritance of cat word", matchExp: "word", transform: "-word"}	
	] )// .inheritenceFactory=function(status) { return defaultRecatInheritenceFactory(status); } ;

// add css classes? styles?
// open,closed,adj,
// nounPhrase
// bold,italic,red,backRed,
SpacingCSSRecategorizations = [
		 {matchExp: "word", transform: "left-edge-padding-left:0.25em;"}	
		,{matchExp: "ROOT", transform: "font-size:20px;"}	
		//,{matchExp: /.+Phrase|sentence/, transform: "padding-right:0.25em; padding-left:0.25em; padding-bottom:0.25em;"}	
];

// red, yellow, green, cyan, blue, purple
//    black,grey: function
//    red: modifier: adv: yellow, adj: purple
//        verb-noun: cyan?? ambigous suffixes and prefixes

// EnglishCSSRecategorizations = [
// 		 {matchExp: "adj", transform: "nodecss-color-purple;"}	// bubble command
// 		,{matchExp: "det adj", transform: "nodecss-color-DarkPurple;"}	
// 		,{matchExp: "adjPhrase", transform: "nodecss-background-LightPurple" } 
// 		,{matchExp: "noun", transform: "nodecss-color-blue;" } 
// 		,{matchExp: "nounPhrase", transform: "nodecss-background-LightBlue" } 
// 		,{matchExp: "verb", transform: "nodecss-color-green;" } 
// 		,{matchExp: "verbPhrase", transform: "nodecss-background-LightGreen" } 
// 		,{matchExp: "adv", transform: "nodecss-color-yellow;" } 
// 		,{matchExp: "advPhrase", transform: "nodecss-background-LightYellow" } 
// 		,{matchExp: "prep", transform: "nodecss-color-red;" } 
// 		,{matchExp: "prepPhrase", transform: "nodecss-background-tomato" } 
// 		,{matchExp: "open", transform: "nodecss-fontstyle-italic;" } 
// 		,{matchExp: "sentence", transform: "nodecss-background-LightGrey" } 
// //		,{matchExp: "*", transform: "color:black"}	
// //		,{matchExp: "*", transform: "background-color:transparent"}	
// ];
EnglishCSSRecategorizations = [
		 {matchExp: "adj", transform: "color:purple;"}	// bubble command
		,{matchExp: "det adj", transform: "color:DarkPurple;"}	
		,{matchExp: "adjPhrase", transform: "background-color:violet;" } 
		,{matchExp: "noun", transform: "color:blue;" } 
		,{matchExp: "nounPhrase", transform: "background-color:LightBlue;" } 
		,{matchExp: "verb", transform: "color:green;" } 
		,{matchExp: "verbPhrase", transform: "background-color:LightGreen;" } 
		,{matchExp: "adv", transform: "color:yellow;" } 
		,{matchExp: "advPhrase", transform: "background-color:LightYellow;" } 
		,{matchExp: "prep", transform: "color:red;" } 
		,{matchExp: "prepPhrase", transform: "background-color:tomato;" } 
		,{matchExp: "open", transform: "font-style:italic;" } 
		,{matchExp: "sentence", transform: "background-color:LightGrey;" } 
];


// node = { head:"stem JJ" , children : [ {head:"recombinable"}] };
// printTree(node);
// morphProcessTree(node, EnglishRecategorizations, EnglishAffixes);
// printTree(node);
