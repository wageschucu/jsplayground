(function(exports) {

  var 
     nStore = require('nstore')
    ,nStore = nStore.extend(require('nstore/query')())
    ,async = require('./async')
    ;

  // Create a store
  // db:{}, partition:[], key:{}, sequence:{}, data:{}
  // data> key - data 
  // sentences:sentenceId : {[sentenceId:int, partition:[sentences]], sentence:{string} , parseString:{string} }
  // sentences:lastId - {int}

  var allPartitions = [];

  function nstoreCallbackToNodeFactory(errorback, okback, progressback) {
    return function (err, result) { 
      return err && errorback && errorback(err) || okback && okback(result) || err || result; 
    }
  }

  function openDb(partition, force, okback, errorback) {
    if (force || !partition.db.db) {
    	var path = _.reduce(partition.db, function(parts, part, key){
    		if (typeof part === 'string')
    			parts.push(part);
    		return parts;
    	}, []);
    	path = path.join("/");
    	partition.db.db = nStore.new( path, nstoreCallbackToNodeFactory(okback, errorback) );
    }
  	return partition;
  }

  function initPartition(partition, force, okback, errorback) { // read/init sequences
    if (force  || ! partition.initialized) {
      partition.currentSequences = [] ;
      _.each(partition.sequences, function(sequenceValue, key) {partition.currentSequences[key] = sequenceValue;});
      var key = partition.partition.join(":") + ':sequences';
      function callback(result) { 
        partition.currentSequences = JSON.parse(result);
        partition.initialized = true;  
  
        return okback && okback(result) || result; 
     }
      partition.db.db.read(key, nstoreCallbackToNodeFactory(callback, errorback));

    }
    return partition;
  }

  function initCheck(partition) { // init/inc sequences
    openDb(partition.db);
    initPartition(partition);
  }

  exports.initAllPartitions = function () {
    async
      .map(
        chain(
           openDb
          ,initPartition
          )
        )
      .go(allPartitions)
      ;
  }

  exports.makeDb = function (db) { return db;}
  exports.makePartition = function (db) { return db;}

/* 
  function readData(callback, partition, data) {
    // extract key, key teile, sequence teile

    function reduceKey(keys, part){ if (keys!=undefined && data[part]!==undefined ) keys.push(data[part]); return keys; else undefined; };

    var key = _.reduce(partition.sequences, reduceKey, 
      _.reduce(partition.key, reduceKey, [] ))
      .join(":")
      ;

    if (key!==undefined)
      partition.db.db.read(key, data, function(err, result) {
        return callback && (callback)(err, [result]) || err || result ;
      }) ; 
    else
      return partition.db.db.find(data, callback) ; 
  }


 function updateSequence(callback, partition, data) { // inc sequences
    _.each(partition.sequences, function(sequence) {
      var dataKey = _.reduce(partition.key, function(comp, keyValue, keyName) { data[keyValue] || throw "key ("+keyName+") value missing in data:"+JSON.stringify(data); comp+= ':'+data[keyValue]; return comp; }, "" );
      partition.currentSequences[dataKey]++;
      writeData(callback, partition, partition.partition.join(":")+':sequences', JSON.stringfy(partition.currentSequences));
    });
  }
  function writeData(callback, partition, key, data) {
    partition.db.db.store(key, data, callback);
  }
  function keyFromData(partition, data) {
    var partitionKey = partition.partition.join(":") ;
    var key = _.reduce(partition.key, function(comp, keyValue, keyName) { comp+= ':'+data[keyValue]; return comp; }, "" );
    return partitionKey + key + sequence;
  }
  function getKeyPartSequence(partition) {
      var sequenceKeyPart = _.reduce(partition.sequences, function(key, sequence, id) { key+= ':'+sequence; return key; }, "" );
      return sequenceKeyPart;
  }
  function getSequence(partition, data) {
    var dataKey = _.reduce(partition.key, function(comp, keyValue, keyName) { data[keyValue] || throw "key ("+keyName+") value missing in data:"+JSON.stringify(data); comp+= ':'+data[keyValue]; return comp; }, "" );
    return partition.currentSequences[dataKey];
  }

  exports.getData = function (callback, partition, data, augmentation) {
    // look if in db
    // optionally call augmentation
    // if not , inc sequences, put in db
     var args [
       callback      
      ,data 
      ,function lookup(callback, data) { partition.db.db.find(data, callback ); }
    ];
     
    if (augmentation)
      args.push(augmentation);
    
    args.push(
        ,function incSequence(callback, data) { updateSequence(partition); var key=makeKey(partition, data); partition.db.db.store(key, data, callback ); }
        ,function store(callback, data) { var key=makeKey(partition, data); partition.db.db.store(key, data, callback ); }
      );
     
    return chain( args);
    
  }
 */ 
  return exports;
} )( 
  typeof exports === 'undefined'?
  this['db']={}:
  exports
  );

