/////////////////////////////////
// todo
// 	overrides : match text change parent head: cats : use affix: with just stemTransform
//  ?? show abstractness as little bubble?? helo???, as static: display highest level abstractness
//		or word level abstractness is different to morph level: or?? 
//		i want to show abstractness levels all at once...
//	backend: store words and sentences and text and ids
//		text-sentence-words
//		last-text,last-sentence,last-dict-word
// 		stnf to node parsing: separate file
//		text: id(t-x-x-x)
//		sentence: text:id(t-s-x-x):parse
//		words: text:id(t-s-w-d):parse
//		dict-words ids:(d): words[(t-s-w-d),]:posMap(pos:count)
//		word-lengths: [].[(t-s-w-d),]
//		
// the irresistible cat ran into the burning house


EnglishRecategorizations = [
		 {matchExp: AbstractTag, transform: "abstract"}	
		,{matchExp: LeafTag, transform: "stem word" } 
		,{matchExp: /\bVBG\b/, transform: "adj open -?"}

			,{matchExp: /\bVerb-be\b/, transform: "VBN -?"}
		,{matchExp: /\bVBN\b/, transform: "verb past open -?"}

		,{matchExp: /\bVBP\b/, transform: "verb open head -?"}
		,{matchExp: /\bVBZ\b/, transform: "verb open head -?"}
		,{matchExp: /\bVBD\b/, transform: "verb open head -?"}
		,{matchExp: /\bMD\b/, transform: "verb modal head -?"}
		,{matchExp: /\bVB\b/, transform: "verb head -?"}
		,{matchExp: /\bVP\b/, transform: "verbPhrase -?"}
		,{matchExp: /\bWRB\b/, transform: "adv closed -?"}
		,{matchExp: /\bRB\b/, transform: "adv  -?"}
		,{matchExp: /\bADVP\b/, transform: "advPhrase -?"}
		,{matchExp: /\bNNS\b/, transform: "noun open -?"}
		,{matchExp: /\bNoun-Common\b/, transform: "noun open -?"}
		,{matchExp: /\bNN\b/, transform: "noun open -?"}
		,{matchExp: /\bNP\b/, transform: "nounPhrase -?"}
		,{matchExp: /\bADJP\b/, transform: "adjPhrase -?"}
		,{matchExp: /\bJJS\b/, transform: "adj head closed -?"}

			,{matchExp: /\bAdjective\b/, transform: "adj open -?"}
		,{matchExp: /\bJJ\b/, transform: "adj open -?"}

		,{matchExp: /\bPP\b/, transform: "prepPhrase -?"}
		,{matchExp: /\bIN\b/, transform: "prep head -?"}

			,{matchExp: /\bArticle-Indefinite\b/, transform: "DT -?"}
		,{matchExp: /\bDT\b/, transform: "det head -?"}

		,{matchExp: /\bPRP\$/, transform: "det head -?"}
		,{matchExp: /\bPRP\b/, transform: "noun closed -?"}
		,{matchExp: /CC/, transform: "conj -?"}
		,{matchExp: /S[^B]?/, transform: "sentence -?"}
		,{matchExp: /SBAR/, transform: "sentenceBar -?"}

		// VBN(part-ed), VBP(are head) VBZ(is head) PRP(them) PRP$(its - head) VBD (ran head) VBG(burning)
		// abstraction index: var shadow =  " text-shadow: 0 0 15px rgba(0,0,0,0.9);";

		// additions
		,{matchExp: "det", transform: "closed head"}
		,{matchExp: "prep", transform: "closed head"}
		,{matchExp: "conj", transform: "closed"}

		,{matchExp: "open stem noun", transform: "absIndex:1;"}
		,{matchExp: "open stem verb", transform: "absIndex:2;"}
		,{matchExp: "open stem adj", transform: "absIndex:3;"}
		,{matchExp: "open stem adv", transform: "absIndex:4;"}
		,{matchExp: "pref", transform: "absIndex:1;"}
		,{matchExp: "suf", transform: "absIndex:1;"}
];

// abstraction index: open: stem: noun:1, verb:2, adj:3, adv:4, 
//  affix: abstractions-addition: ? +1 default

// (ROOT
//   (S
//     (NP (DT the) (JJ irresistible) (NN cat))
//     (VP (VBD ran)
//       (PP (IN into)
//         (NP (DT the) (VBG burning) (NN house))))))

((EnglishAffixes = [
	 { name: "latin-verb", prio:1,
	 				matchExp: "(verb stem)", affixes:"ir in is", isPrefix:true, 
				 		absTrans:"abstract -stem latin -open", 
				 		affTrans:"pref closed morph -stem  latin -open", 
				 		stemTrans : "stem latin open morph " }
	,{ name: "latin-verb-from-adj", prio:1,
	 				matchExp: "(verb stem)", affixes:"iz ize", isPrefix:false, 
				 		absTrans:"abstract -stem latin -open", 
				 		affTrans:"suf closed morph -stem  latin -open", 
				 		stemTrans : "stem latin open morph adj -verb" }
	,{ name: "latin-adj-from-noun", prio:1, examples:"civil",
	 				matchExp: "(adj stem)", affixes:"il al", isPrefix:false, 
				 		absTrans:"abstract -stem latin -open", 
				 		affTrans:"suf closed morph -stem  latin -open", 
				 		stemTrans : "stem latin open morph noun -adj" }
	,{ name: "compound-prep", prio:1,
	 				matchExp: "(prep stem)", affixes:"in", isPrefix:true, 
				 		absTrans:"abstract -stem", 
				 		affTrans:"pref morph  -stem", 
				 		stemTrans : "pref morph " }
	,{ name: "compound-noun", prio:1,
	 				matchExp: "(noun stem)", affixes:"inter", isPrefix:true, 
				 		absTrans:"abstract -stem", 
				 		affTrans:"pref morph  -stem", 
				 		stemTrans : "pref morph " }
	,{ name: "latin-adj-from-verb", prio:1, 
					matchExp: "(stem adj)", affixes:"eble ible able ative ous", isPrefix:false, 
						absTrans:"adj abstract -stem latin verbToAdj -open", 
						affTrans:"suf closed morph -stem morph -open", 
						stemTrans : "stem -adj verb latin open morph" }
	,{ name: "latin-noun-from-verb", prio:1, 
					matchExp: "(stem noun)", affixes:"or", isPrefix:false, 
						absTrans:"abstract -stem latin verbToNoun -open", 
						affTrans:"suf closed morph -stem morph -noun", 
						stemTrans : "stem -noun verb latin open morph" }
	,{ name: "latin-adv-from-adj", prio:1, 
					matchExp: "(stem adv)", affixes:"ly", isPrefix:false, 
						absTrans:"abstract -stem latin adjToAdv -open", 
						affTrans:"suf closed morph -stem -open", 
						stemTrans : "stem -adv adj latin open morph" }
	,{ name: "latin-verb", prio:1,
	 				matchExp: "(stem verb)", affixes:"re pre", isPrefix:true, 
				 		absTrans:"pref verb abstract -stem latin -open", 
				 		affTrans:"pref closed morph -stem -open", 
				 		stemTrans : "stem verb latin open morph" }
	,{ name: "latin-verb", prio:1,  
					matchExp: "(stem verb)", affixes:"con com oc super", isPrefix:true,
						absTrans:"pref verb abstract -stem latin -open", 
						affTrans:"pref closed morph -stem morph -open", 
						stemTrans : "stem verb latin open morph" }
	,{ name: "verb past", prio:1,  
					matchExp: "(stem verb past)", affixes:"ed d", isPrefix:false,
						absTrans:"abstract -stem -open", 
						affTrans:"closed morph -stem -open", 
						stemTrans : "stem -past open morph" }

	,{ name: "gerund-adj-from-verb", prio:1, 
					matchExp: "(adj stem)", affixes:"ing ed", isPrefix:false, 
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
	,{ name: "noun-from-verb-agent", prio:1, 
					matchExp: "(noun stem)", affixes:"r er", isPrefix:false, 
						absTrans:"abstract -stem -open", 
						affTrans:"suf closed morph -stem -open", 
						stemTrans : "stem morph" }

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
		,{matchExp: 'word', actor: mergeAllAbsIndex } 
		,{matchExp: 'morph|word', actor: absIndexToTextShadow } 
		//,{matchExp: /.+Phrase|sentence/, transform: "padding-right:0.25em; padding-left:0.25em; padding-bottom:0.25em;"}	
];

// red, yellow, green, cyan, blue, purple
//    black,grey: function
//    red: modifier: adv: yellow, adj: purple
//        verb-noun: cyan?? ambigous suffixes and prefixes

EnglishCSSRecategorizations = [
		 {matchExp: "noun", transform: "color:#0066CC;" } 
		,{matchExp: "det", transform: "color:#3366CC;"}	
		,{matchExp: "nounPhrase", transform: "background-color:#66CCFF;" } 
		,{matchExp: "verb", transform: "color:#009933;" } 
		,{matchExp: "verbPhrase", transform: "background-color:#A1F793;" } 
		,{matchExp: "adj", transform: "color:#CC00CC;"}	// bubble command
		,{matchExp: "adjPhrase", transform: "background-color:#FF99FF;" } 
		,{matchExp: "adv", transform: "color:#FF9900;" } 
		,{matchExp: "advPhrase", transform: "background-color:#FBD6A1;" } 
		,{matchExp: "prep", transform: "color:#FF3300;" } 
		,{matchExp: "prepPhrase", transform: "background-color:#FF9999;" } 
		,{matchExp: "open", transform: "font-style:italic;" } 
		,{matchExp: "head", transform: "font-weight:bold;" } 
		//,{matchExp: "head", transform: "text-shadow:0px 0px 10px rgba(0,0,0,0.9);" } 
		,{matchExp: "sentence", transform: "background-color:LightGrey;" } 
];

		// abstraction index: var shadow =  " text-shadow: 0 0 15px rgba(0,0,0,0.9);";


// node = { head:"stem JJ" , children : [ {head:"recombinable"}] };
// printTree(node);
// morphProcessTree(node, EnglishRecategorizations, EnglishAffixes);
// printTree(node);
