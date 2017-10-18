/////////////////////////////////


EnglishRecategorizations = [
		 {matchExp: AbstractTag, transform: "abstract"}	
		,{matchExp: LeafTag, transform: "stem word" } 
		,{matchExp: /V..[^P]/, transform: "verb"}
		,{matchExp: /V..P/, transform: "verbPhrase"}
		,{matchExp: /RB/, transform: "adv"}
		,{matchExp: /ADVP/, transform: "advPhrase"}
		,{matchExp: /NP/, transform: "nounPhrase -?"}
		,{matchExp: /N[^P].?/, transform: "noun -?"}
];

EnglishAffixes = [
	 { name: "latin-verb", prio:1,
	 				matchExp: "stem verb", affixes:"re pre", isPrefix:true, 
				 		absTrans:"pref verb abstract -stem latin", 
				 		affTrans:"pref closed morph -stem", 
				 		stemTrans : "stem verb latin open morph" }
	,{ name: "latin-adj-from-verb", prio:1, 
					matchExp: "adj stem", affixes:"eble ible able", isPrefix:false, 
						absTrans:"adj abstract -stem latin verbToAdj", 
						affTrans:"suf closed morph -stem morph", 
						stemTrans : "stem verb latin open morph" }
	,{ name: "latin-verb", prio:1,  
					matchExp: "stem verb", affixes:"con com", isPrefix:true,
						absTrans:"pref verb abstract -stem latin", 
						affTrans:"pref closed morph -stem morph", 
						stemTrans : "stem verb latin open morph" }
] ;


node = { head:"stem ADJ" , children : [ {head:"recombinable"}] };
printTree(node);
morphProcessTree(node, EnglishRecategorizations, EnglishAffixes);
printTree(node);
