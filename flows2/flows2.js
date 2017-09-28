// flow2.js

console.log("Hello World2 days");

// let days2 = genDays(start, end ) 

// function genFlows(start,end,contracts,accounts, units, contractProto) 
// {
// 	// => { "20170208": {  unit:"chf", flow:-1.0, balance:1.0 } }
// 	// each day until end date
// 	// 	walk contracts recursively gather flows for current day: => merge per day: contract 1 and 2: add all same days together (respect currency conversion)
// }

// function dateSequenceLength(start,end) {
// 	// momento: days between
// 	Math.round(moment.duration(end.diff(start)).asDays())
// }
// function dateSequenceGenerator(start) {
// 	return function (index ) {
// 		// momemento add day/index
// 		return start.add(index, 'days')
// 	}
// } 
// function daySequence(start, end) {
// 	return Lazy.generate(dateSequenceGenerator(start) , dateSequenceLength(start,end))
// }


// let genDates = function (start,end) { return Array.apply(0, Array(Math.round(moment.duration(end.diff(start)).asDays()) )).map((x,i)=> { console.log(i); return start.add(i, 'days')})}

//genDates(start,end)

// daySequence(moment().subtract(10,'days'), moment().subtract(8,'days')).each(day=>console.log(day))

// id => path to contract: contracts.household.swisscom, contracts.household.miete

const contractsOld = {
	acct: "zahlungs"
	,unit: "chf"
	,rythm: "M"
	,household: {
		swisscom:
		{
			start: "20170104", amount:184,
		}
		,miete:
		{
			start: "20170104", amount:1700
		}
		,ebm:
		{
			start: "20170104", amount:160, rythm:"q"
		}
		,hausrate:
		{
			start: "20170104", amount:200, rythm:"a"
		}
	}
	,auto: {
		gas:
		{
			start: "20170104", amount:184
		}
		,insurance:
		{
			start: "20170104", amount:1700
		}
		,tires:
		{
			rotation:
			{
				start: "20170104", amount:50, rythm:"s"
			}
			,replacements:
			{
				start: "20170104", amount:800, rythm:"a4"
			}
		}
		,oil:
		{
			start: "20170104", amount:100, rythm:"a"
		}
		,mfk:
		{
			start: "20170104", amount:500, rythm:"a4"
		}
		,service:
		{
			start: "20170104", amount:200, rythm:"a2"
		}
	}
	,income : {
		itp: {
			monthly:
			{
				start: "201701end", amount:-1000
				,month13:
				{
					start: "201712end", rythm: "a"
				}
			}
		}
		,farm: {
			start: "201703end", amount:-1000, rythm: "Q", acct: "checking"
		}
		,tnb: {
			start: "201703end", amount:-4000, rythm: "Q", acct: "checking"
		}
	}
	,post : {
		spar : {
				start: "201703end", amount:1000, rythm: "m", acct: "zahlungs"	
		}
		,'3a' : {
				start: "201712", amount:6000, rythm: "a", acct: "spar"	
		}
	}
}

const actuals = {
	contract : { date: null,  flow:-1.0, bal:1.0 }
	,post1: {
		date:null
		,balance:1.0
		,flow:-1.0
		,
	}
}
