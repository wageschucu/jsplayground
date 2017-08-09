// scheduler ux

let testfunc = ()  =>  {console.log("test funct!!!")}

// task list, appointment list
// calendar
//   timeslots,items 

// data - calendar
// tasks []
//    id:number, name:string, due-date:date, start-date:date, duration:minutes, prio:[number], location:[string], target:[string], requirements:[number], dependencies : [number]

var tasks = [
	{id:1, name:"write emails", dueDate:moment().endOf('week'), startDate:moment().add(1, 'd'), duration:moment.duration(30, 'minutes'), prio:[1], location:["home"], target:["domestic"], requirements:[], dependencies : []}
	,{id:2, name:"mail application", dueDate:moment().endOf('day').add(-6, 'hours'), startDate:moment().add(1, 'h'), duration:moment.duration(15, 'minutes'), prio:[1], location:["home"], target:["domestic"], requirements:[], dependencies : []}
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

 