
function asyncTimeoutFactory( action ) {
	if ( action.delayMs ) {
		return function(node, action, status) {  
			var delayMs;
			if ( _.isFunction(action.delayMs) )
				delayMs = action.delayMs(node, action, status);
			else 
				delayMs = action.delayMs;
			console.log('setting timeout : delayMs:'+delayMs);
			setTimeout( status.context.asyncReentry, delayMs ) ; 

			status.setTimeout=true; 
		}
	}
}

function iterateStructure(walker, node, action, matcherFactory, actorFactory, delayFactory, inheritance) {

	var context = {
		 node:node
		,action:action
		,status:{ 
				 inheritance : inheritance || defaultStatusInheritance
				,matcherFactory:matcherFactory
				,actorFactory:actorFactory
				,delayFactory:delayFactory || asyncTimeoutFactory
			}
	}

	context.status.context = context ;
	context.asyncReentry = function() { 
		walker(context.node, context.action, context.status); 
	}

	walker(context.node, context.action, context.status);		
}

function ifNull(override, defaultVal) {
	if (override === null )
		return override;
	if (override)
		return override;

	return defaultVal;
}

function defaultStatusInheritance(opts) {
	opts = opts || {};
	return  { 
		 phase: ifNull(opts.phase, this.phase) 
		,matcherFactory: opts.matcherFactory || this.matcherFactory
		,actorFactory: opts.actorFactory || this.actorFactory
		,delayFactory: opts.delayFactory || this.delayFactory
		,context: opts.context || this.context
		,inheritance:opts.inheritancePermOverride || this.inheritance
		,after:opts.after || this.after
		};
}

function walkTreeTDLR(node, action, status) {

	status.phase =  status.inheritance();
	status.phase.arrival = true ;
	applyAction(node, action, status.phase );

	status.phase.arrival = false ;

	if ( node.children ) {
		for (var index=0 ; index<node.children.length; index++) {

			walkTreeTDLR(node.children[index], action, status[index]=status.inheritance());

		}
	}

	status.phase.departure = true ;
	applyAction(node, action, status.phase);
	status.phase.departure = false ;
	
	applyPostTransform(node, action, status) ;
	
	status.complete = true;
}

function walkTreeTDLRAsync(node, action, status) {
	// assume status is clean object

	// status: headArrival, headDepart, child, phase, allChildren, index
	if ( ! status.phase ) {
		status.phase = status.phase || { arrival:true, step:0 };
		applyPreTransform(node, action, status) ;
	}

	if ( status.phase.arrival ) {
		status.headArrival=status.headArrival || status.inheritance();
		applyAction(node, action, status.headArrival);
		if ( status.headArrival.complete ) { 
			
			// advance to next phase
			status.phase.arrival = false ;
			status.phase.children = true ;
			status.phase.step++;
		}
		applyPostTransform(node, action, status) ;

	}

	if ( status.phase.children ) {

		status.children=status.children || status.inheritance();
		if ( node.children ) {
			status.children.index = status.children.index || 0 ;
			for (; status.children.index<node.children.length; ) {

				walkTreeTDLRAsync(node.children[status.children.index], action, (status.children.child = status.children.child || status.inheritance( { phase:null } )) );

				if (status.children.child.complete) {
					status.children.index++;
					delete status.children.child ;
					if ( status.children.index>=node.children.length )
					{
						status.children.complete = true ;	
					}
				}
				else 
					break; // async case
			}
		}
		else 
		{
			status.children.complete = true ;	
		}

		if (status.children.complete) {
			// advance to next phase
			status.phase.children = false;
			status.phase.departure=true;
			status.phase.step++;
			applyPreTransform(node, action, status) ;
		}

	}

	if ( status.phase.departure ) {

		status.headDepart=status.headDepart || status.inheritance();				

		applyAction(node, action, status.headDepart);
		// mark complete
		if ( status.headDepart.complete  ) {

			// advance phase
			status.phase.departure=false;
			status.phase.complete=true;
			status.phase.step++;

		}
		applyPostTransform(node, action, status) ;
	}

	if ( status.phase.complete  ) {
		status.complete = true ; 
	}

}
function actorTrap(node, action, status) {
	if (action.actorTrap)
	{
		if (action.actorTrap.head)
			if (node.head.match(action.actorTrap.head)) {
				//debugger;
				console.log("actionTrap: node:"+node.head);
			}
	}	
}
// assume status is clean
function applyAction(node, action, status) {

	var matcher = action.matcher || status.matcherFactory && status.matcherFactory(action) ;
	var actor = action.actor || status.actorFactory && status.actorFactory(action) ;
	var delay = action.delay || status.delayFactory && status.delayFactory(action) ;

	if ( ! _.isArray(action) )
	{
		// four stages: match:?complete, action:?complete,matched, delay:complete,matched,async, delayComplete:complete,matched,async,timeoutSet
		// when last stage complete: then we are complete
		status.actionPhase =  status.actionPhase || { matching:true }; 
		if (status.actionPhase.matching) {

			status.matcher = status.matcher || status.inheritance();
			
			// match
			if ( matcher )
				(status.matcher.matched=(matcher)(node, action, status.matcher));
			else 
				status.matcher.matched = true;

			// advance
			status.matcher.complete = true; 

			status.actionPhase.matching = false;
			status.actionPhase.acting = true;

		}

		if (status.actionPhase.acting) {

			status.actor = status.actor || status.inheritance();
			status.actor.matcher = { matches: status.matcher.matches };
			
			// act 
			if ( status.matcher.matched && actor ) {
				if (action.name) console.log("apply:"+action.name+" head:"+node.head);
				actorTrap(node, action, status.actor);
				(actor)(node, action, status.actor);

				if ( status.actor.complete ) 
					if (action.action) {

																// problem: there could be cases where one wants phase to be inherited
						status.action = status.action || status.inheritance( { phase:null, after : action.afterEach } );

						applyAction( node, action.action, status.action );

					}

				status.actor.acted=true;
			}
			else 
				status.actor.complete = true; 

			if ( status.actor.complete ) {
				// advance
				status.actionPhase.acting = false;
				status.actionPhase.delaying = true;
			}
		}

		if (status.actionPhase.delaying) {

			status.delay = status.delay || status.inheritance();
		
			// delay
			if ( ! status.delay.setTimeout ) {
				if (status.matcher.matched && delay)
					(delay)(node, action, status.delay);
				else 
					status.delay.complete = true;
			}
			else {
				status.delay.complete = true;
			}

			if ( status.delay.complete ) {
				// advance to next phase
				status.actionPhase.delaying = false;
				status.actionPhase.complete = true;
			}


			if ( status.actionPhase.complete ) {
				status.complete = true; 
			}
		}
	}
	else
	{
		status.index = status.index || 0 ;
		for (; status.index<action.length; ) {

			status.child = status.child || status.inheritance( { after : action.afterEach } );

			applyAction( node, action[status.index], status.child );

			if (status.child.complete) {
				
				status.index++;
				delete status.child ;
			}
			else 
				break; // async case
		}

		if ( status.index>=action.length )
		{
			status.complete = true ;	
		}

	}

}


