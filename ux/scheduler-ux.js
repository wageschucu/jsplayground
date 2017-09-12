// scheduler ux

let testfunc = ()  =>  {console.log("test funct!!!")}

// task list, appointment list
// calendar
//   timeslots,items 

// data - calendar
// tasks []
//    id:number, name:string, due-date:date, start-date:date, duration:minutes, prio:[number], location:[string], target:[string], requirements:[number], dependencies : [number]

// relations graph: family tree, organigrams, smedia, emails, contacts, bank-accts, 

var events = [
	{id:1000, name:"wakeup", repeat:"daily", start:moment().startOf('day').add(7, 'h')}
]

var tasks = [
	{id:1, name:"write emails", dueDate:moment().endOf('week'), start:moment().add(1, 'd'), duration:moment.duration(30, 'minutes'), prio:[1], location:["home"], target:["domestic"], requirements:[2], dependencies : [], minchunck:moment.duration(15, 'minutes')}
	,{id:2, name:"mail application", dueDate:moment().endOf('day').add(-6, 'hours'), start:moment().add(1, 'h'), duration:moment.duration(15, 'minutes'), prio:[1], location:["home"], target:["domestic"], requirements:[], dependencies : [1],}
	,{id:3, name:"breakfast", start:moment().startOf('day').add(7, 'h'), duration:moment.duration(30, 'minutes'), prio:[1], location:["home"], target:["domestic"], requirements:[], dependencies : [1000], repeat:"daily"}
]

var taskScheduleStatus = [
	{taskid: 1, status:"red", schedule:[{start:moment(), chucks:2}]}
]

var schedule =[
	{
	 day:moment(), 
	 tasks : [
		{ taskid:1, start:moment().add(1, 'h')}
		,{taskid:2, start:moment().add(2, 'h'), chunks:2 }
		,{taskid:3, start:moment().add(3, 'h')  }
		,{taskid:1000, start:moment().add(3, 'h')  }
		]
	}
]

function puttasks(tasks, $elem) {
	let tableid=$elem.attr("id") || (""+Math.random())
	tableid += "_"
	let $table = $("<table class='tasktable'>").attr("id", tableid).appendTo($elem.empty());
	// headers
	_([_(tasks).first()]).each((task, index)=>{ 
		puttaskth(task, $table); 
	} )
	// data rows 
	_(tasks).each((task, index)=>{ puttask(task, $table); })

	//$("td", $table ).css("border","1px solid red")
}

function puttask(task, $table) {
	let tableid=$table.attr("id")
	let recid=task.id
	_(task).reduce( ($memo, value, key )=>{$("<td>").append($('<input>').attr("id", tableid+recid+"_"+key).val(value)).appendTo($memo); return $memo}, $("<tr>").attr("id", tableid+recid).appendTo($table))
}
function puttaskth(task, $table) {
	let tableid=$table.attr("id")
	let recid="header"
	_(task).reduce( ($memo, value, key )=>{$("<th>").attr("id", tableid+recid+"_"+key).appendTo($memo).text(key); return $memo}, $("<tr>").attr("id", tableid+recid).appendTo($table))
}

function gettaskelembyid(recid, $table) {
	return $('#'+$table.attr("id")+recid)
}

function gettaskattrelembyid(attr, recid, $table) {
	return $('#'+$table.attr("id")+recid+"_"+attr)
}
function gettaskattrvaluebyid(attr, recid, $table) {
	return $('#'+$table.attr("id")+recid+"_"+attr).val()
}

 