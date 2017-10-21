
var port = 8085;
var sys = require("sys"),  
log = require('./log'),
http = require("http"),  
path = require("path"),  
us = require('underscore'), 
url = require("url"),  
_ = require("underscore"),
filesys = require("fs"),
querystring = require('querystring'),
Q=require('q'),
httpp=require("./httpp"),
dbp=require("./dbp"),
extend = require('node.extend'),
makep=require("./makep")
;

function trimAllProperties(object) {
    _.each(object.data, function(elem, ind, list) {
        if (_.isString(elem))
            list[ind] = elem.trim();
    });
    log.info("trimAllProperties to "+JSON.stringify(object));  
    return object;
}
function serverProcessP() {

    arguments = Array.prototype.slice.call(arguments, 0);
    var response = arguments.shift();
    var data = arguments.shift();
    arguments.unshift(trimAllProperties);
    arguments.unshift(data);
    return makep.processP.apply(makep, arguments)
        .fail(function(err) {
             response.writeHeader(500, {"Content-Type": "text/plain"});    
             response.write(err&&err.stack + "\n");    
             response.end();    
             log.info("returned: "+err&&err.stack);  

        })
        .then(
            function(data) {
                response.writeHeader(200, {"Content-Type": "text/plain"});    
                response.write(JSON.stringify(_.pluck(data, "result")) + "\n");    
                response.end();    
                log.info("returned: "+JSON.stringify(_.pluck(data, "result")));  

            });
}

// // put data: fetch data, if missing call function and store -> date
// getData(data, initFunc, key) -> data and key
//  get parse tree
// return tree in http
// 
//         init - ajax
//        /    \
//       /------write   
//      /            \    
//read ------------------respond
//  
//  get sentence
// 
//         getParseTree
//        /    \
//       /------write   pass-on - cascade
//      /            \ /       \
//read -------------------------respond
//  

function sentenceToPStnfHttp(dbResult) {
    var httpData = {};
    httpData.requestIn = dbResult; 
    // set up http params
    var data = querystring.stringify({ query: dbResult.data.sentence} );
    var options = {
      host: 'nlp.stanford.edu',
      path: '/parser/?'+data,
      port: '8080',
      method: 'GET'
    };
    httpData.options=options;
    return httpData;
}

function stnfHttpToParseTreeString(httpData) {
    var dbResult = httpData.requestIn;

    // parse response for parseTreeString
    var treeString = httpData.responseData.substring(httpData.responseData.indexOf(">(ROOT")+1);
    treeString = treeString.substring(0, treeString.indexOf('</pre>'));

    log.info("stnfHttpToParseTreeString result :"+JSON.stringify(treeString));  
    dbResult.data.parseTreeString = treeString;
    return dbResult;
}

var initParseTreeStringP = makep.makeProcessP(sentenceToPStnfHttp, httpp.httpP, stnfHttpToParseTreeString );

var parseTreesDBP = dbp.newDbP("parsetrees.db");

var getParseTreeP = dbp.makeGetP(dbp.makeReadP(parseTreesDBP), dbp.makeWriteP(parseTreesDBP), initParseTreeStringP );

var textDBP = dbp.newDbP("texts.db");

function stripDownToSentenceProperty(queries) {
    queries = dbp.toArray(queries);
    var newQueries = [];
    queries.forEach(function(query) {
        var newquery = extend(true, {}, query);
        newquery.data = {sentence : newquery.data.sentence};
        delete newquery.key;
        newQueries.push( newquery );
    });
    log.info("stripDownToSentenceProperty to :"+JSON.stringify(newQueries));  
    return newQueries;
}

function stripDownToTitleProperty(queries) {
    queries = dbp.toArray(queries);
    var newQueries = [];
    queries.forEach(function(query) {
        var newquery = extend(true, {}, query);
        newquery.data = {title : newquery.data.title};
        delete newquery.key;
        newQueries.push( newquery );
    });
    log.info("stripDownToTitleProperty to :"+JSON.stringify(newQueries));  
    return newQueries;
}

// [ [ [] ], ]
function moveParseTreeResultIntoData(data) {
    data = dbp.toArray(data);
    data.forEach(function(item) {
        item.data.parseTreeString=item.result[0][1].parseTreeString;
        item.result=[];
    });
    log.info("moveParseTreeResultIntoData to :"+JSON.stringify(data));  
    return data;
}

function moveTitleResultIntoData(data) {
    data = dbp.toArray(data);
    data.forEach(function(item) {
        item.data.title=item.result[0][1].title;
        item.data.titleId=item.result[0][0];
        item.result=[];
    });
    log.info("moveTitleResultIntoData to :"+JSON.stringify(data));  
    return data;
}

// getTitle first, then getParseTree : parallel init and merge
var pInitSentence = makep.makeProcessP( 
    stripDownToSentenceProperty, getParseTreeP, moveParseTreeResultIntoData 
    );

var pInitTitle = makep.makeProcessP( 
    stripDownToTitleProperty, 
    dbp.makeGetP(
              dbp.makeReadP(textDBP), 
              dbp.makeWriteP(textDBP)
        ), 
    moveTitleResultIntoData 
    );

var DefaultTitle = "defaultTitle";

function defaultTitle(query) {
    query =dbp.toArray(query);
    query.forEach(function(query) {
        query.data.title=query.data.title||DefaultTitle;
    });
    log.info("defaultTitle check to : now title="+JSON.stringify(query.data));  
    return query;
}

// look up words based on sentence id, {data:[{sentence}]} - dont need this it is getSentences
// var lookupSentenceIdsP=makep.makeProcessP( 

//     );
// if word not there init it:pos, length, ordinal, put word array in results sentence object 
// [length:,][,sentence:,title:]>[sentenceId]=>[[sentenceId, {}]]
function moveIdsToSentenceIds(data) {
    //replace array with { data:sentenceId:}
    // data is arary with results properties in each object
    var newQuery = [];
    _.pluck(data, "result").forEach(function(result) {
        result.forEach(function(item) {
                item[1].sentenceId=item[0];
                newQuery.push({data:item[1]});
           });
        });
    log.info("moveIdsToSentenceIds : now newQuery="+JSON.stringify(newQuery));  
    return newQuery; 
}

var pInitWords;
var getWordsP =makep.makeProcessP( 
        moveIdsToSentenceIds,
        dbp.makeGetP(
              dbp.makeReadP(textDBP), 
              dbp.makeWriteP(textDBP)
             ,pInitWords
        )
        );


var getSentenceP = makep.makeProcessP( 
        defaultTitle, 
        dbp.makeGetP(
            dbp.makeReadP(textDBP), 
            dbp.makeWriteP(textDBP),  
            pInitTitle,
            pInitSentence
        ),
        getWordsP
    );

var getTitlesP = makep.makeProcessP( 
        defaultTitle, 
        dbp.makeReadP(textDBP) 
    );

// title, sentence, word
// {title:, titleId: }
http.createServer(function(request,response){   
    
    var parsedUrl = url.parse(request.url, true);  
    var my_path  = parsedUrl.pathname;
    log.info("path: "+my_path);  

    if (my_path == "/getParseTree") { // json?? {key:, data:{sentence}} or [{}]: => parseTreeString
        serverProcessP(response, JSON.parse(parsedUrl.query.query), getParseTreeP);
    }
    else if (my_path == "/getTitles") {  // no params
        serverProcessP(response, { data:{titleId:undefined}},  dbp.makeReadPs(textDBP));

    }
    else if (my_path == "/getTitle") {  // [title]: =>sentences & ids
        var query = parsedUrl.query.query?JSON.parse(parsedUrl.query.query):{};
        query.data = query.data || {};
        query.data.titleId = undefined;
        serverProcessP(response, query,  defaultTitle, dbp.makeGetP(
              dbp.makeReadP(textDBP), 
              dbp.makeWriteP(textDBP)
        ));
    }
    else if (my_path == "/getSentence") {  // sentence:[,title]: =>parseTreeString, [words]
        // getTitle first - if title
        serverProcessP(response, JSON.parse(parsedUrl.query.query), getSentenceP);
    }
    else if (my_path == "/getWords") {  // [length:][,sentence:,title:]>[sentenceId] =>[words]
        //   titleId ?? how to pre-process titles as part of getSentenceP??? 
        //      or for now just process sentence,title to list of sentenceIds : need iterate/apply function that takes object,list and returns an array/list (=>[object])
        //serverProcessP(response, {data:parsedUrl.query}, getSentenceP);
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

log.info("cwd:"+process.cwd()); 
log.info("Server Running on :"+port);       


// var data = {sentence:"the cat is blue."};

// //var pres=pProcess(makePromise({key:"bluecat4", data:data}), pGetSentence );
// var pres=makep.processP(makep.makeTestPromise({data:data}), pGetParseTree );

// pres
// //    .fail(function(err){log.info("fail : "+err)} )
//     .done(function(res) {log.info("done res : "+JSON.stringify(res))});


// split sentence and parts of speech: words: store each 

//var pres=pProcess("hi", "bye", makePromise("byebye"), function(res) { log.info("test2:"+res) ; return "bye2"});

//var pres=pProcess(makePromise({key:"testkey20", data:"testdata20"}), pGetSentence );
//var pres=pProcess(makePromise({key:"testkey20", data:"testdata20"}), deferedProcess );

        // saveDb("data", "key")
        //     .then(
        //         getDb)      
        //     .then( function() {
        //         return getData("testkey4", { text: "My name is Bill."}, setParseTreeString )
        //     })  
        //     .then( function() {
        //         return getData("testkey4")
        //     })      
        //     .fail(
        //         function(err) {
        //             log.info("error:"+err);
        //         }
        //     )
        //     .done(
        //         function(res) {
        //             log.info("done:"+res);
        //         }
        //     )
        //     ;

          
        // Q
        //     .when(
        //         whenFunc2("test111")
        //     )
        //     .then(
        //         function(dbName) { 
        //             var db=nStore.new(dbName, function(res) {
        //                 log.info("db created:"+dbName+" res:"+res);
        //                 db.save(null, "test.db", function() {});
        //             }); 
        //             return "test1.5"; 
        //         })
        //     .then(newDb)
        //     .then( 
        //         function(res) {
        //                 log.info("in step2:"+res);
        //                 return "step2"
        //             }
        //     )
        //     .fail(
        //         function(err) {
        //             log.info("error:"+err);
        //         }
        //     )
        //     .done(
        //         function(res) {
        //             log.info("done:"+res);
        //         }
        //     )
        // ;
      
            

// function oldsaveDb(db, data, key) {
//     var deferred = Q.defer();
//     db.save(key, data, function(err, key) {
//         log.info("save key"+key+" err:"+err);
//         //deferred.reject("error 1")            
//         if (err) deferred.reject(err)           
//         else deferred.resolve(key);
//     });
//     log.info("save setup"+db);
//     return deferred.promise;
// } 

//function saveDb(data,key) {
//     var deferred = Q.defer();
//     dbP
//         .then(function(db) {
//             db.save(key, data, function(err, key) {
//                 if (err) deferred.reject(err)           
//                 else deferred.resolve(key);
//             })
//         })
//     ;
//     return deferred.promise;
// } 

// function getDb(key) {
//     var deferred = Q.defer();
//     dbP.then(function(db) {
//         db.get(key, function(err, data, key) {
//             if (err) deferred.reject(err)           
//             else deferred.resolve(data);
//         })
//     })
//     ;
//     return deferred.promise;
// } 

//function pProcess(dataIn, process, passOn) {
//  return Q.resolve(dataIn).then(process).then(passOn);
//}
// function getData(keyIn, dataIn, initFunc) {
//     var deferred = Q.defer();
//     dbP
//         .then(function(db) {
//             db.get(keyIn, function(err, data, key) {
//                 if (err) {
//                     if (initFunc) { 
//                         Q.when(
//                             (initFunc)(dataIn, keyIn)
//                             )
//                         .done(function(data) {
//                             data = typeof data === 'undefined'?null:data;
//                             db.save(keyIn, JSON.stringify(data), function(err, key) {
//                                 log.info("getData - saving after init:"+keyIn);  
//                                 if (err) deferred.reject(err)           
//                                 else deferred.resolve({key:key, data:data});
//                             })
//                         })
//                     }
//                     else {
//                         dataIn = typeof dataIn === 'undefined'?null:dataIn;
//                         db.save(keyIn, JSON.stringify(dataIn), function(err, key) {
//                             log.info("getData - saving:"+keyIn);  
//                             if (err) deferred.reject(err)           
//                             else deferred.resolve({key:key, data:dataIn});
//                         })
//                     }
//                 }
//                 else {
//                     log.info("getData - found:"+key+" data: "+data);  
//                     deferred.resolve({key:key, data:data});
//                 }
//             })
//         })
//     ;
//     return deferred.promise;

// }
