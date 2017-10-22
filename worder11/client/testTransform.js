function process(text) {
    // take sentence
    // get pos
    // trans to my tree form
    // morph tree 
    // sort by word length
    // run drills by word length, display secs, time between displays
    //   random sort list
    //   run through list 

    //  /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --user-data-dir /U 
    // /Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --disable-web-security --user-data-dir /Users/paulgettel/code/jsplayground/worder11/client/worder11.html
    //  but point to canary
    //this works 
let tree = StnfParse.getNodesFromStnfStringTrim(newText)

// load text from file?? oops?

transformWords(tree)
   //  newText
   //  let sents 
   //      $.get("http://pos-en.apphb.com/RESTProcessHandler.ashx?text="+text, (data) => {
   //      	console.log(data)
		 //    sents = data.sents
		 //    let stringTree ="(ROOT (S "
		 //    _(sents).forEach(sentence=>_(sentence).forEach(word=>{
		 //    	stringTree += "( "+word.pos+addAm(word)+addNf(word)+" "+word.v+") "  
		 //    }))
		 //    stringTree += ") )"
			// let tree = StnfParse.getNodesFromStnfStringTrim(stringTree)
		 //    transformWords(tree)
   //      })


    // let tree = StnfParse.getNodesFromStnfStringTrim(testStandfordTreeLong)
    // transformWords(tree)

}
$(process)
function addAm(word) {
	return (word.morpho&&word.morpho.ma&&word.morpho.ma!="-"?"-"+word.morpho.ma:"")	
}

function addNf(word) {
	return (word.morpho&&word.morpho.nf&&word.morpho.nf=="be"?"-"+word.morpho.nf:"")	
}

function transformWords(tree) {

    iterateStructure(walkTreeTDLRAsync, tree, EnglishRecategorizations, recatRuleMatcherFactory, recatRuleActorFactory);
    printTree(tree);

    iterateStructure(walkTreeTDLRAsync, tree, EnglishAffixes, affixRuleMatcherFactory, affixRuleActorFactory);
    printTree(tree);

}

var newText = 
"(ROOT\n\
  (S\n\
    (NP (NNP Never))\n\
    (VP (VBZ has)\n\
      (NP\n\
        (NP (DT the) (NN term))\n\
        (SBAR\n\
          (S (`` ``)\n\
            (S\n\
              (VP (VBG massaging)\n\
                (NP (DT the) (NNS media))))\n\
            ('' '')\n\
            (VP (VBD seemed)\n\
              (ADJP (RB so) (JJ accurate)))))))\n\
    (. .)))\n\
"

var testStandfordTreeMorph =
    "(ROOT \n" +
    "	(S \n" +
    "		(NP \n" +
    "			(DT:word \n" +
    "				(morph:stem:close:dt The) \n" +
    "			) \n" +
    "			(JJ:word \n" +
    "				(morph:suf:verbToAdj:adj \n" +
    "					(morph:pref:verb  \n" +
    "						(morph:pref:latin:close ir) \n" +
    "						(morph:pref:verb  \n" +
    "							(morph:pref:latin:close re) \n" +
    "							(morph:stem:verb:open sist)\n" +
    "						)\n" +
    "					) \n" +
    "					(morph:suf:adj:verbToAdj:latin:close ible) \n" +
    "					) \n" +
    "				) \n" +
    "				(NN:word (morph:stem:noun:open cat)\n" +
    "			)\n" +
    "		) \n" +
    "		(VP \n" +
    "			(VBD:word \n" +
    "				(morph:stem:verb:open ran)\n" +
    "			) \n" +
    "			(PP \n" +
    "				(IN:word \n" +
    "					(morph:comp \n" +
    "						(morph:prep:close in) \n" +
    "						(morph:prep:close to)\n" +
    "					)\n" +
    "				) \n" +
    "				(NP \n" +
    "					(DT:word \n" +
    "						(morph:stem:close:dt the)\n" +
    "					) \n" +
    "					(VBG:word \n" +
    "						(morph:suf:adj:verbToAdj \n" +
    "							(morph:stem:verb:open burn) \n" +
    "							(morph:suf:close:adj:verbToAdj ing)\n" +
    "						)\n" +
    "					) \n" +
    "					(NN:word \n" +
    "						(morph:stem:noun:open house)\n" +
    "					)\n" +
    "				)\n" +
    "			)\n" +
    "		)\n" +
    "		(. .)\n" +
    "	)\n" +
    ")";



var testStandfordTreeLong = "(ROOT\n\
  (S\n\
    (NP (JJS Most) (NNS men))\n\
    (, ,)\n\
    (ADVP (RB even)\n\
      (PP (IN in)\n\
        (NP (DT this)\n\
          (ADJP (RB comparatively) (JJ free))\n\
          (NN country))))\n\
    (, ,)\n\
    (PP (IN through)\n\
      (NP (JJ mere) (NN ignorance)\n\
        (CC and)\n\
        (NN mistake)))\n\
    (, ,)\n\
    (VP (VBP are)\n\
      (ADJP (RB so) (VBN occupied)\n\
        (PP (IN with)\n\
          (NP\n\
            (NP (DT the) (JJ factitious) (NN cares))\n\
            (CC and)\n\
            (NP\n\
              (NP (JJ superfluously) (JJ coarse) (NNS labors))\n\
              (PP (IN of)\n\
                (NP (NN life))))))\n\
        (SBAR (IN that)\n\
          (S\n\
            (NP (PRP$ its) (NN finer) (NNS fruits))\n\
            (VP (MD can) (RB not)\n\
              (VP (VB be)\n\
                (VP (VBN plucked)\n\
                  (PP (IN by)\n\
                    (NP (PRP them))))))))))\n\
    (. .)))";