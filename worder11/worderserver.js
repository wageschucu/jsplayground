
var port = 8085;
var sys = require("sys"),  
my_http = require("http"),  
path = require("path"),  
us = require('underscore'),
url = require("url"),  
_ = require("underscore"),
StnfParse = require('./client/StnfParse'),
filesys = require("fs"),
async = require('./async')
,db=require("./db")
,querystring = require('querystring')
,Q=require('q')
;

// titleSentences:{title}:{titleSentenceId} - {[title: {sentence}, sentenceId:{int}], titleSentenceId: {int}}  
// titleSentences:{title}:lastId - {title:, partition, sequence:int}

// parts:titles, sentences, words, ? phrases??
//data = { text: word.word, parseString: word.pos, title: title, sentenceNum: sentenceNums[title].sentenceNum, wordNum: index, length: word.word.length }
//data.key = data.title  + ":"+  data.sentenceNum + ":"+ data.wordNum ;
//data = { text: undefined, parseString: undefined, title: title, sentenceNum: undefined, wordNum: undefined, length: undefined }
//data.key = data.title  + ":"+  data.sentenceNum + ":"+ data.wordNum ;
//data = { text: sentence, parseString: parseString, title: title, sentenceNum: sentenceNums[title].sentenceNum++, wordNum: undefined, length: words.length }
//data.key = data.title  + ":"+  data.sentenceNum + ":"+ data.wordNum ;

var sentencesDb = db.makeDb({ path:"sentences.db" });
var sentencesPartition = db.makePartition({ db:sentencesDb, partition:['sentence'], sequences:{sentenceId:0}, key:{title:""}, data:{sentence:"", parseString:""}});
var titleSentencesPartition = db.makePartition({ db:sentencesDb, partition:['titleSentence'], sequences:{titleSentenceId:0}, key:{title:""}, data:{sentenceId:0}});
var titlesPartition = db.makePartition({ db:sentencesDb, partition:['title'], sequences:{titleId:0}, data:{title:""}});

var partsDb = db.makeDb({ path:"parts.db" });
var partsSentencesPartition = db.makePartition({ db:partsDb, partition:['sentence'], key:{sentenceId:0, titleId:0, titleSentenceId:0}, data:{length:0} });
var partsWordsPartition = db.makePartition({ db:partsDb, partition:['word'], sequences:{wordId:0}, key:{sentenceId:0, titleId:0, titleSentenceId:0}, data:{parseString:"", length:0}});

function initCheckPartsData() {

  sys.puts("initCheckPartsData");       
  // get titles: if no titles, init

  q.when(
      //partsSentencesPartition.getData
        sys.puts("test1")
      )
    .then( sys.puts("test2") )
    ;

  // return async.chain(
  //    partsSentencesPartition.getData
  //   ,async.quitOnResult
  //   ,titleSentencesPartition.getData
  //   ,async.map(
  //      partsSentencesPartition.getData
  //     ,wordsDataFromSentence
  //     ,async.map(partsWordsPartition.getData)
  //     )
  //   )
  // .go()
  // ;
}

function wordsDataFromSentence(parseString, callback) {

  var stnfNodeTree = StnfParse.getNodesFromStnfStringTrim( parseString );
  var words = findAllLeaves( stnfNodeTree );
  // convert to list of stnf strings
  words = words.map(function(word) { return { pos: word.head, word: word.children[0].head }; });
  return words;
}

function findAllLeaves(node)  {
  var list = [];
  if (node.children && node.children.length==1 && (! node.children[0].children || !node.children[0].children.length) )
    list.push(node);
  else if (node.children)
    node.children.forEach(function(child) { list=list.concat(findAllLeaves(child));});
  return list;
}

function processParts() {
  sys.puts("getProcessParts");       
  return async.chain(    
     partsSentencesPartition.getData
    ,wordsDataFromSentence // explode sentence into word array: parseString to nodes, get words, return array of words, save node tree in data:nodeTree
    ,async.map( 
      async.chain(
         convertWordInNodeTreeToParseString
        ,partsWordsPartition.getData
        )
     )
  )
  .go(arguments)
  ;

}
function getSentencesForTitle(data) { 
  delete data.titleSentenceId; 
  return titleSentencesPartition.getData(data ); 
}

function processText() {
  
  return chain(    
     sentencesPartition.getDataWithFactory(fetchParseString)
    ,titleSentencesPartition.getData
    ,getSentencesForTitle
    ,async.map( sentencesPartition.getData )
  ).go(arguments);
}


var stnfOptions = {
      host: 'nlp.stanford.edu',
      path: '/parser/',
      port: '8080',
      method: 'GET'
}

function stnfCallback(result, callback) {
  var treeString = result.substring(result.indexOf(">(ROOT")+1);
  treeString = treeString.substring(0, treeString.indexOf('</pre>'));
  var out = {treeString:treeString};
  return callback && (callback)(out) || out;
};

function fetchParseString() {
  return async.callServer( async.addArgs({options:stnfOptions, callback:stnfCallback, encoding: 'utf8'}) ) ;
}

function processQueryParameters(query) {

  for (var key in query) {

    if (key=="title")
      if (!query[key]) {
        query[key] = defaultTitle;
        continue;
      }

    if (!query[key])
      delete query[key];
    
    var intValue = parseInt(query[key]);
    if (intValue.toString()!=NaN.toString())
      query[key] = intValue;     
    
    if (query[key]=="undefined")
      query[key] = undefined;
    
  }

  if (query.sentenceNum == "*") { 
    delete query.sentenceNum;
  }

  if (query.length == "*") {
    query["wordNum"] = undefined;
    delete query.length ;
  }
  else if (query.length) {
    query["wordNum <>"] = undefined;
    if (query.length == "random")
      delete query.length ;
  }

  sys.puts("query : "+JSON.stringify(query));       

  return query ;  
}

function route(response, query, handler) {

  processQueryParameters(query);

  dependents.find(_.size(query)==0?{text:undefined}:query, function (err, result ) {

      if (err ) {
          sys.puts("all error in db:"+err);       
          response.writeHeader(404, {"Content-Type": "text/plain"});    
          response.write("404 Not Found:all\n");    
          response.end();  
      } else 
      {
          sys.puts("all results :"+JSON.stringify(result));       
          response.writeHeader(200, {"Content-Type": "text/plain"});    
          var data = (handler)(result);
          response.write(JSON.stringify(data));     
          response.end();    

      }
  });

}

my_http.createServer(function(request,response){  

  function serverErrorBack(callback) {

    var res = { errorBack: function(err) {
        sys.puts("all error in db:"+err);       
        response.writeHeader(404, {"Content-Type": "text/plain"});    
        response.write("404 Not Found:all\n");    
        response.end();  
      }
    }
    return callback && callback(res) || res;
  }

  function serverOkBack(callback) {

    sys.puts("all results :"+JSON.stringify(result));       
    response.writeHeader(200, {"Content-Type": "text/plain"});    
    var data = (handler)(result);
    response.write(JSON.stringify(data));     
    response.end();    

    return callback && callback() ;
  }

  function answerClient(result) {

    sys.puts("all results :"+JSON.stringify(result));       
    response.writeHeader(200, {"Content-Type": "text/plain"});    
    var data = (handler)(result);
    response.write(JSON.stringify(data));     
    response.end();    

    return callback && callback() ;
  }

  function failToClient(err ) {
          sys.puts("all error in db:"+err);       
          response.writeHeader(500, {"Content-Type": "text/plain"});    
          response.write("500 server err:"+err+"\n");    
          response.end();  
      } ;

  function map (arr, func) {
    return Q().then(function () {
      // inside a `then`, exceptions will be handled in next onRejected
      return arr.map(function (el) { return func(el) })
    }).all() // return group promise
  }
  
  [
  {
    title: 
    sentences: [
      {
        sentence:
        words: [
          {
            word:
            struct:
            lenght:
          }
        ]
        struct:
        length:
      }];
  }
  ]

  parentId:
  title:
  word:
  sentence:

  function storeItems(items, parentId) {
    _.each(titles, function(item) {
      // put item - objects, and arrays
      Q
        .when( putItem(item, parentId))
        .then( function(parentId) { return putItemObjects(item, parentId); } )
        ;
    });
  }
    var parsedUrl = url.parse(request.url, true);  
    var my_path  = parsedUrl.pathname;
    // this should return list of 
    // getTextTitles - 
    // getTitleSentences - title
    // getLengths - title, sentenceNum
    // processText - title,text
    if (my_path == "/processText") {
      var findP = Q.denodeify(nStore.find);
      var saveP = Q.denodeify(nStore.write);

      Q.when(
          // put title 
          parsedUrl.query.title = parsedUrl.query.title.upperCase().trim();
          return findP({part:"title", title:parsedUrl.query.title});
        )
      .then( function(res) { 
        if (res && res.key)
          return res.key;
        else 
          return saveP({part:"title", title:parsedUrl.query.title}); 
        })
      .then(
        function(titleId) {
          // split into sentences
          var match;
          if (parsedUrl.query.text && (match=parsedUrl.query.text.match(/[^.;?!]+[.;?!]/g))) {
            var sentences = [];
            match.each(function(sentence) {
              sentences.push( sentence.trim() );
            }
            return map(sentences, findP);               
          }
        } )
       .then( function(res) { 
          if (res) {
            res.each(function(sentenceFound) {
              if (sentenceFound && sentenceFound.key)
                return sentenceFound.key;
              else {}
            });
          }          
                if (res && res.key)
                  return res.key;
                else 
                  // get parseTreeString
                  return saveP({part:"sentence", titleId:titleId, sentence:sentence}); 
                })


            });
          }

        })
      .then( function(res) { sys.puts("test2.5"+res); return 2000; })
      .then ( function(res) { return map([1000, 2000, 3000], setTimeoutPromise); } )
      .then( function(res) { sys.puts("test3"+res)})
      .fail(failToClient)
      .done(answerClient)
      ;



      // put title, put sentences ? parse sentences
      //  put words
      // 
    }
    // getTree - title,sentenceNum,lengths : Array:stnfTreeString

    // if no dependants, processAllTrees 
    //   trees: sentence:stnfString
    //   dependants:
    //    titles, sentences, lengths, stnfTreeString


  if (my_path == "/getTextTitles")
     route(response, parsedUrl.query, function(result) {
        var titles = [];
        for (var key in result) {
          var entry = result[key];
          titles.push(entry.title);
        };
        return titles;
      });

  else if (my_path == "/test") {
      //sys.puts("initCheckPartsData");       
  // get titles: if no titles, init
  
  // one async call, then multiple, then return 
  var count=0;
  function testFunc(param) {
    count++;
    console.log(count+" param is : "+ param + "; ");
    return count;
  } ;
  function map (arr, func) {
    return Q().then(function () {
      // inside a `then`, exceptions will be handled in next onRejected
      return arr.map(function (el) { return func(el) })
    }).all() // return group promise
  }
  
  //map(['list', 'of', 'files'], testFunc).then(console.log, console.error)
  
  var setTimeoutPromise = function(millisec) {
    var deferred = Q.defer()
    setTimeout(function(period) {
      deferred.resolve("time out :"+period)
    }, millisec, millisec);
    return deferred.promise
  }
  //var promise = setTimeoutPromise(2000);
  //promise.then(console.log, console.error)

  sys.puts("");
  sys.puts("start");
  Q.when(
      //partsSentencesPartition.getData
        sys.puts("test1")
      )
    .then( function(res) { sys.puts("test2"+res); return 2000; })
    .then(setTimeoutPromise)
    .then( function(res) { sys.puts("test2.5"+res); return 2000; })
    .then ( function(res) { return map([1000, 2000, 3000], setTimeoutPromise); } )
    .then( function(res) { sys.puts("test3"+res)})
    .fail(function(res) { sys.puts("test4"+res)})
    .done()
    ;
    
  sys.puts("end");
  sys.puts("");
  
    // async.chain(
    //      serverErrorBack
    //     ,db.initAllPartitions
    //     ,initCheckPartsData
    //     ,serverOkBack
    //   )
    // .go()
    // ;
  }
  else if (my_path == "/getTitleSentences")
    route(response, parsedUrl.query, function(result) {
        var sentences = [];
        for (var key in result) {
          var entry = result[key];
            sentences[entry.sentenceNum]=entry.text;
          };
          return sentences;
        });

  else if (my_path == "/getLengths")    
    route(response, parsedUrl.query, function(result) {

          var lengths = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
          return lengths;
        });

  else if (my_path == "/getTree")
    route(response, parsedUrl.query, function(result) {
        var stnfTreeString = [];
        for (var key in result) {
            var entry = result[key];
            if (entry.length==1)
              continue;
            stnfTreeString.push({text:entry.text, parseString:entry.parseString, wordNum:entry.wordNum});
          };
          return stnfTreeString;
        });

  else if (my_path == "/processText") {
    function callback(err, result) {
      if (err ) {
          sys.puts("all error in db:"+err);       
          response.writeHeader(500, {"Content-Type": "text/plain"});    
          response.write("500 server err:"+err+"\n");    
          response.end();  
      } else 
      {
        // get sentences 
        route(response, {title:parsedUrl.query.title}, function(result) {
            var sentences = [];
            for (var key in result) {
              var entry = result[key];
                sentences[entry.sentenceNum]=entry.text;
              };
              return sentences;
            });

      }
    };

    processText(parsedUrl.query.text, response, parsedUrl.query.title, callback);

  }
  else {
        var full_path = path.join(process.cwd(),my_path);  
        path.exists(full_path,function(exists){  
            if(!exists){  
                response.writeHeader(404, {"Content-Type": "text/plain"});    
                response.write("404 Not Found\n");    
                response.end();  
            }  
            else{  
                filesys.readFile(full_path, "binary", function(err, file) {    
                     if(err) {    
                         response.writeHeader(500, {"Content-Type": "text/plain"});    
                         response.write(err + "\n");    
                         response.end();    
                     
                     }    
                     else{  
                        response.writeHeader(200);    
                        response.write(file, "binary");    
                        response.end();  
                    }  
                           
                });  
            }  
        });  
  }
    
}).listen(port );  

sys.puts("cwd:"+process.cwd());
sys.puts("Server Running on :"+port);       


/*

var dependents = nStore.new('dependents.db');

var  sentenceNums = {};

var defaultTitle= "";

function initCheckPartsData() {

  sys.puts("initCheckPartsData");       
  // get titles: if no titles, init

  async.chain(
     titleSentencesPartition.getData
    ,async.quitOnResult
    ,titleSentencesPartition.getData
    ,async.map(
      partsSentencesPartition.getData
      partsWordsPartition.getData
      )
    )
  .go()
  ;

  sentenceNums = {};

  dependents.all(function (err, result ) {

    if( err  ) {
        throw err;
    }

    var length=0;
    for (var key in result) length++;  
    if( ! length) {
      processTrees(callback);
    }
    else {
      sys.puts("proces data:length:"+result.length);       

      for (var key in result ) {
          sentenceNums[result[key].title] = sentenceNums[result[key].title] || {sentenceNum:0};
          if (sentenceNums[result[key].title].sentenceNum<result[key].sentenceNum) {
            sys.puts("set result[key].sentenceNum: "+key+" : "+result[key].sentenceNum);       
            sentenceNums[result[key].title].sentenceNum=result[key].sentenceNum;
          }
      }

      callback && callback();
    }
  });
}

function processTrees(callback) {

  sys.puts("processTrees:");       
  parseTrees.all(function (err, result ) {

    if( err )
      throw err;
    if (!result ) {
        sys.puts("no data in db");  

         callback && callback();

        return ;      
    }

    for (var key in result)
      processParseTree(key, result[key], callback);

  });
}

function processParseTree(sentence, treeString, callback) {
  sys.puts("processParseTree:");       
  var match=sentence.match(/([^:]+:)?(.+)/);
  processDependents(match[2], treeString, !match[1]?defaultTitle:match[1].match(/[^:]+/)[0], callback);
}

function processDependents(sentence, parseString, title, callback) {

  sys.puts("processDependents:");       
  var stnfNodeTree = StnfParse.getNodesFromStnfStringTrim( parseString );
  var words = findAllLeaves( stnfNodeTree );
  // convert to list of stnf strings
  words = words.map(function(word) { return { pos: word.head, word: word.children[0].head }; });
  
  var data;
  if ( ! sentenceNums[title] ) {
    // save title
    data = { text: undefined, parseString: undefined, title: title, sentenceNum: undefined, wordNum: undefined, length: undefined }
    data.key = data.title  + ":"+  data.sentenceNum + ":"+ data.wordNum ;
    dependents.save(data.key, data, function (err) {
        if (err) { throw err; }
        sys.puts("saved dependents title to db:"+data.key);       

    });

    sentenceNums[title] = {sentenceNum:0};
  }

  // save sentence only if not existing 


  words.forEach(function(word, index) {
    var data;
    data = { text: word.word, parseString: word.pos, title: title, sentenceNum: sentenceNums[title].sentenceNum, wordNum: index, length: word.word.length }
    data.key = data.title  + ":"+  data.sentenceNum + ":"+ data.wordNum ;
    data.parseString = "(ROOT ("+data.parseString + " " +data.text + ") )";
    dependents.save(data.key, data, function (err) {
        if (err) { throw err; }
        sys.puts("saved dependents to db:"+data.key);       

    });

  });

  data = { text: sentence, parseString: parseString, title: title, sentenceNum: sentenceNums[title].sentenceNum++, wordNum: undefined, length: words.length }
  data.key = data.title  + ":"+  data.sentenceNum + ":"+ data.wordNum ;
  dependents.save(data.key, data, function (err, result) {
      if (err) { throw err; }
      sys.puts("saved dependents to db:"+data.key);       

      callback && callback(data);

  });

  return stnfNodeTree;
}

function findAllLeaves(node)  {
  var list = [];
  if (node.children && node.children.length==1 && (! node.children[0].children || !node.children[0].children.length) )
    list.push(node);
  else if (node.children)
    node.children.forEach(function(child) { list=list.concat(findAllLeaves(child));});
  return list;
}

function processParse(sentence, treeString, textName, callback) {

  if (!textName)
    textName=null;

  parseTrees.save(textName+':'+sentence, treeString, function (err) {
      if (err) { throw err; }
      // The save is finished and written to disk safely
      sys.puts("saved to db:"+treeString);       
      processDependents(sentence, treeString, textName, callback);

  });

}

var lastSentenceId;
function initLastSentenceId(callback) {
  parseTree.read("lastId:", function(err, result) {
    if (err)
      throw "error initializing lastSentenceId!! : "+err;
    lastSentenceId = parseInt(result) || 0;
    callback && callback(err, result, lastSentenceId);
  });
}

function getLastResults(results) {
  return results.length && results[results.length-1];
}

function getParseTreeString(sentence, textName, callback) {
  ????
  ??// at init, load last id to global 
  // lastId:{lastId}

  // sentences sentence:{id} { sentenceId:id, sentence:sentence, parseString:parseString}
  // titleSentence titleSentence:{title}:{titleSentenceId} { title: , sentenceId: }

  // look for sentence
  chain(callback 
    , {sentence:sentence}
    , sentences.find  // <sentence >parseTree,sentence,sentenceId
    , fetchParseTree  // <sentence ? sentenceId >parseTree,sentence
    , saveSentence    // <parseTree,sentence ? sentenceId >parseTree,sentence, sentenceId
    , updateSentenceId // ? sentenceId
    , findTitleSentence  // <sentenceId, title >sentence, title
    , updateTitleSentenceId // ? titleSentenceId
    , saveTitleSentence  //  <sentence, title, sentenceId ? titleSentenceId >sentence, title
    );
}

function chain() {
  var args = arguments;
  var callback = args.pop();
  var input = args.pop();
  function exec(funcs, results) {
    var func=funcs.pop();
    function myCallback(err, result) {
      if (err)
        callback && (callback)(err, getLastResult(results), results);
      results.push(result);
      exec(funcs, myCallback, results);
    }
    if (!func) 
      callback && (callback)(undefined, getLastResult(results), results);
  }
  exec(args, [input]);
}

function saveSentence(results, callback) {
  if ( ! getResult(-1,results).parseString) {
    lastSentenceId++;
    parseTree.save({"lastId:", lastSentenceId }); // fire and forget
    parseTree.save("sentence:"+lastSentenceId, {sentenceId:lastSentenceId, sentence:getResult(-2).sentence, parseString:getLastResult().parseString}, callback);
  }
  else
     callback(undefined, result);
}

function findTitleSentence(sentenceResult, callback) {
  parseTrees.find({}, callback);
}

function saveTitleSentence(result, callback) {
  if (!result.length)
    parseTree.save({}, callback);
  else
     callback(undefined, result);
}


  function sentenceCallback(err, sentence) {
      if (err ) {
        callback(err);
      } else {
      }    
  }
  getSentence();

  getSentenceText();

  parseTrees.find({sentenceKey:"sentence:"+sentence}, function (err, result ) {

      if (err ) {
        callback(err);
      } else 
      {
      }

  //   store sentence
  // look for sentence text
  //  store sentence text with ref to sentence
  // return parse tree string

}

// return current sentences
// look in db, if found
function processText(sentence, textName, callback) {

  function callbackParseTree(err, treeString) {
    if (err)
      callback(err);
    else 
      processParse(sentence, treeString, textName, callback);     
  }
  getParseTreeString(sentence, textName, callbackParseTree);
}

  parseTrees.find({sentenceKey:"sentence:"+sentence}, function (err, result ) {

      if (err ) {
        callback(err);
      } else 
      {
        if (result.length) {
          callback(err, result);
        else {

            var data = querystring.stringify({ query: sentence} );

            var options = {
              host: 'nlp.stanford.edu',
              path: '/parser/?'+data,
              //since we are listening on a custom port, we need to specify it by hand
              port: '8080',
              //This is what changes the request to a POST request
              method: 'GET'
            };

            var stnfcallback = function(response) {
              var str = ''
              response.setEncoding('utf8');
              response.on('data', function (chunk) {
                str += chunk;
              });

              response.on('end', function (data) {
                var treeString = str.substring(str.indexOf(">(ROOT")+1);
                treeString = treeString.substring(0, treeString.indexOf('</pre>'));

                parseTrees.save({sentenceKey:"sentence:"+sentence}, function (err, result ) {
                  if (err) { throw err; }
                  sys.puts("saved parseTrees to db:"+data.key);       
                  processParse(sentence, treeString, textName, callback); 

                });

              });
            }

            var req = my_http.request(options, stnfcallback);
            //This is the data we are posting, it needs to be a string or a buffer
            req.end();
        }
      }
  });



    return sentence;
} 
*/


// asdfasdfds
// asdfasdfds
// asdfasdfds
// asdfasdfds
// asdfasdfds

