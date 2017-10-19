    // console.log(JSON.stringify(allAcctflows, null, 2))

    // gen all contracts: if dates or rythm change
    // gen all accounts: if above or unit change
    // refresh/redraw, generate, loop contracts, expand logic, css, 
    // budget examples, mine, a house?, retirement 
    // expand path, max/one level
    //   if below expanding: has children&&contract? show detail: show aggregate
    // 
    let localStorageKeyPrefix = "flowsdatakey"
    let start = localStorage.getItem(localStorageKeyPrefix + "start") || '20170101'
    let end = localStorage.getItem(localStorageKeyPrefix + "end") || '20171231'
    let windowSize = localStorage.getItem(localStorageKeyPrefix + "windowSize") || "M"
    let deltaBalanceThreshold = localStorage.getItem(localStorageKeyPrefix + "deltaBalanceThreshold") || 200
    let targetCurrency = localStorage.getItem(localStorageKeyPrefix + "targetCurrency") || "chf"
    let startExpandLevel = localStorage.getItem(localStorageKeyPrefix + "startExpandLevel") || 1

    let filepath = localStorage.getItem(localStorageKeyPrefix + "filepath") || "mydata.js"
    let test

    $(createControls)
    $(loadFile)

    function createControls() {
        $('#flowscontrol').empty();

        $('<span>').text("window:").append($input = $('<input>').val(windowSize).on('blur', (e) => {
                windowSize = e.target.value;
                localStorage.setItem(localStorageKeyPrefix + "windowSize", windowSize)
            }))
            .appendTo($('#flowscontrol'))

        $('<span>').text("start:").append($input = $('<input>').val(start).on('blur', (e) => {
                start = "" + e.target.value;
                localStorage.setItem(localStorageKeyPrefix + "start", start)
            }))
            .appendTo($('#flowscontrol'))

        $('<span>').text("end:").append($input = $('<input>').val(end).on('blur', (e) => {
                end = "" + e.target.value;
                localStorage.setItem(localStorageKeyPrefix + "end", end)
            }))
            .appendTo($('#flowscontrol'))

        // $('<span>').text("targetAccounts:"+targetAccounts)
        //         .appendTo($('#flowscontrol'))

        $('<span>').text("currency:").append($('<input>').val(targetCurrency).on('blur', (e) => {
                targetCurrency = e.target.value;
                localStorage.setItem(localStorageKeyPrefix + "targetCurrency", targetCurrency)
            }))
            .appendTo($('#flowscontrol'))
        $('<span>').text("startExpandLevel:").append($('<input>').val(startExpandLevel).on('blur', (e) => {
                startExpandLevel = e.target.value;
                localStorage.setItem(localStorageKeyPrefix + "startExpandLevel", startExpandLevel)
            }))
            .appendTo($('#flowscontrol'))

        $('<span>').text("file path: ")
            .append($('<input id="filepath">').val(filepath).css("width", "220px"))
            .appendTo($('#flowscontrol'))
        $('<span>')
            .append($('<input type="button">').val("refresh").on('click', ()=>location.reload()))
            .appendTo($('#flowscontrol'))
    }

    function loadFile(e) {

        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.charset = 'utf-8';
        script.id = 'testing';
        script.defer = true;
        script.async = true;
        script.onload = function() {
            console.log('The script is loaded');
            $(refreshWindows)
        }
        script.src = $('#filepath').val()
        localStorage.setItem(localStorageKeyPrefix + "filepath", filepath)

        // script.text = ["console.log('This is from the script');",
        //                "var script = document.getElementById('testing');",
        //                "var event = new UIEvent('load');",
        //                "script.dispatchEvent(event);"].join('');
        head.appendChild(script);


        // var data = require(filepath);
        // $.getJSON(filepath, function(json) {
        //     console.log(json); // this will show the info it in firebug console
        // });
        //$(refreshWindows)
    }

    function collapse() {
        let $tr = $(this).closest('tr')
        let path = $tr.data("path")

        $('tr').each((index, tr) => {
            let $tr = $(tr)
            let myPath = $tr.data("path")

            if (path && (!myPath || !myPath.startsWith(path))) return

            let myIsDetail = $tr.hasClass("detail")
            let contract = $tr.data("contract")
            let hasChildren = $tr.data("aggregateCount")
            let hasDetail = $tr.data("hasDetail")

            let show = false
            // if equal paths
            // if has no children and has detail, show detail
            // else show rollup
            if (myPath == path) {
                if (myIsDetail && !hasChildren && hasDetail)
                    show = true
                else if (!myIsDetail && hasChildren)
                    show = true
                else
                    show = false
            } else
                show = false

            if (show)
                addExpandHandler($tr, expandone, "+")

            showRow($tr, show);
        })
        removeExpandHandler($tr, collapse, "-")

    }

    function expandmax() {
        let $tr = $(this).closest('tr')
        let path = $tr.data("path")

        $('tr').each((index, tr) => {
            let $tr = $(tr)
            let myPath = $tr.data("path")
            let hasChildren = $tr.data("aggregateCount")

            if (!myPath || path && (!myPath || !myPath.startsWith(path))) return

            let myIsDetail = $tr.hasClass("detail")
            let contract = $tr.data("contract")

            let isLeaf = myIsDetail && !hasChildren
            let show = false
            if (myIsDetail && isContract(contract))
                show = true
            else if (!myIsDetail && hasChildren > 1)
                show = true
            else
                show = false

            if (show && !isLeaf)
                addExpandHandler($tr, collapse, "-")

            showRow($tr, show);
        })
        removeExpandHandler($tr, expandmax)

    }

    function expandone(levelsIn) {
        let levels = typeof levelsIn === "number" ? levelsIn : 1
        let $tr = $(this).closest('tr')
        let path = $tr.data("path")
        let level = $tr.data("level")
        if (level === undefined) level = 0
        if (!path) path = "."

        $('tr').each((index, tr) => {
            let $tr = $(tr)
            let myPath = $tr.data("path")

            if (path && (!myPath || !myPath.startsWith(path))) return

            let myIsDetail = $tr.hasClass("detail")
            let myLevel = $tr.data("level")
            let contract = $tr.data("contract")
            let myIsContract = isContract(contract)
            let hasChildren = $tr.data("aggregateCount")

            let show = false
            if (myIsDetail && myIsContract && (level <= myLevel && level + levels >= myLevel))
                show = true
            else if (!myIsDetail && (!myIsContract && hasChildren > 1) && (level <= myLevel && level + levels >= myLevel))
                show = true
            else
                show = false
            let isLeaf = myIsDetail && !hasChildren
            if (!isLeaf) {
                if (show && (level <= myLevel && level + levels > myLevel))
                    addExpandHandler($tr, expandmax, "++")
                if (show && level + levels == myLevel)
                    addExpandHandler($tr, expandone, "+")
            }

            showRow($tr, show);
        })
        removeExpandHandler($tr, expandone)

    }

    function showRow($tr, show) {
        let row = $('td', $tr).first().data("rownumber")
        $trs = $('tr[data-rownumber=' + row + "]")
        if (show)
            $trs.show()
        else
            $trs.hide()

    }

    function addExpandHandler($tr, handler, symbol) {
        $('td', $tr).first().on("click", handler).text(symbol)
    }

    function removeExpandHandler($tr, handler) {
        $('td', $tr).first().off("click", handler)
    }

    function mergeFlows(flows) {
        let count = 0
        let mergedFlow = _.reduce(flows, (merged, flow, day) => {
            count++
            return mergeFlow(merged, flow)
        }, {})
        mergedFlow.average = round(mergedFlow.amount / count)
        return mergedFlow
    }

    function prettyContract(contract) {
        return "" + contract.amount + ", rythm: " + contract.rythm + (contract.unit ? ", unit: " + contract.unit : "")
    }

    function prettyOldBalance(balance) {
        return " balance: " + balance.balance + ", delta: " + balance.deltaBalance
    }
    //   name
    //.     date,amount,unit,balance
    // gather contracts and indexes and flows before day until last oldbalance or begin
    function getReconcileInfos(allFlows, wind, day, previousBalanceDate, accountName) {
        let title = ""
        title += " " + day + " " + prettyOldBalance(wind.oldBalance[day])

        let sorted = _(allFlows.contracts).reduce((indexes, contract, index) => {
                console.log(indexes, contract, index);
                if (isContract(contract) && contract.account == accountName)
                    indexes.push(index);
                return indexes
            }, [])
            .reduce((list, index) => {
                let totalFlow = getSpecFlows(day, allFlows.allFlows[index], previousBalanceDate)
                if (totalFlow)
                    list.push({ index: index, totalFlow: totalFlow })
                return list
            }, [])


        sorted = _(sorted)
            .orderBy(["totalFlow"], ["asc"])
        sorted = sorted
            .reduce((text, list) => {
                if (list.index) {
                    let index = list.index
                    text += "\n";
                    text += "  " + list.totalFlow;
                    text += " : " + allFlows.paths[index];
                    text += ": " + prettyContract(allFlows.contracts[index]);
                }
                return text
            }, "")

        let content = " " + sorted

        return { title: title, content: content, }
    }

    function prettyFlow(flow) {
        return " amount: " + flow.amount + (flow.unit ? ", unit: " + flow.unit : "") + (flow.balance ? ", balance: " + flow.balance : "")
    }

    function getSpecFlows(day, flows, previousBalanceDate) {
        let totalFlow = _(flows).reduce((totalFlow, flow, flowDate) => {
            if (flowDate < day && (!previousBalanceDate || previousBalanceDate < flowDate)) {
                totalFlow += flow.amount
            }
            return totalFlow
        }, 0)
        return totalFlow;
    }

    function getPreviousBalanceDate(account, firstBalance) {
        return _(account.balances).reduce((max, bal, day) => { if (day < firstBalance && (!max || day > max)) max = day; return max }, "")
    }

    function prettyNegatives(negatives) {
        return JSON.stringify(negatives, null, 2)
    }


    function refreshWindows() {

        let normalisedContracts = (test) ? normaliseContracts(testContracts, contractProto) : normaliseContracts(contracts, contractProto)

        let normalizedAcccounts = (test) ? normaliseAccounts(testAccounts, start, end, normalisedContracts, prototypeAccount) : normaliseAccounts(accounts, start, end, normalisedContracts, prototypeAccount)

        let allFlows = genAllContractLines(normalisedContracts, start, end, windowSize)

        let allAccountNames = getAllAccountNames(normalizedAcccounts)
        let allAcctflows = genAllAccountLines(allAccountNames, normalizedAcccounts, allFlows.allFlows, start, end, targetCurrency, windowSize)

        let $tableEnd = createTable(chunkFlows(start, end, null, windowSize));

        {
            allFlows.allFlows.forEach((flows, index) => {
                let level = (allFlows.paths[index].match(/\./g) || []).length;
                if (allFlows.paths[index].length == 1)
                    level = 0;

                appendRow($tableEnd, allFlows.contracts[index], allFlows.allChunkedRowupFlows[index], mergeFlows(allFlows.allChunkedRowupFlows[index]), allFlows.paths[index].split(".").pop(), level, allFlows.paths[index], "rollup", true, allFlows.aggregateCounts[index], allFlows.immediateChildren && allFlows.immediateChildren.length, allFlows.hasDetail[index])

                appendRow($tableEnd, allFlows.contracts[index], allFlows.allChunkedFlows[index], mergeFlows(allFlows.allChunkedFlows[index]), allFlows.paths[index].split(".").pop(), level, allFlows.paths[index], "detail", true, allFlows.aggregateCounts[index], allFlows.immediateChildren && allFlows.immediateChildren.length, allFlows.hasDetail[index])
            })
        }

        {
            allAcctflows.accounts.forEach((flows, index) => {

                appendFooter($tableEnd, allAcctflows.accounts[index], allAcctflows.allChunkedFlows[index], mergeFlows(allAcctflows.allChunkedFlows[index]), allAcctflows.paths[index], undefined, allFlows)

            })

        }
        let totalFlows = genRollupFlows(start, end, allAcctflows.allChunkedFlows, undefined, targetCurrency)

        appendFooter($tableEnd, { unit: targetCurrency }, totalFlows, mergeFlows(totalFlows), "Totals", true)

        function createTable(windowedSeq) {

            let $table = $('<table>')
            $table.css("border", "1px solid #000");
            let $header = $('<tr>').appendTo(
                $table
                //                .appendTo($('#flowsold'))
            )

            $header
                .append($('<td>').text("+-").on("click", expandmax))
                .append($('<td>').text("name")
                    .css("border", "1px solid #000"));

            let $header1 = $('<tr>')

            $header1
                .append($('<td>')
                    .text("+-").on("click", expandmax))
                .append($('<td>').text("name")
                    .css("border", "1px solid #000"));

            _.each(contractProto, (value, prop) => {
                if (value == null)
                    $header.append($('<td>').text(prop)
                        .css("border", "1px solid #000"));

            })
            _.each(contractProto, (value, prop) => {
                if (value == null)
                    $header1.append($('<td>').text(prop)
                        .css("border", "1px solid #000"));

            })

            let $header2 = $('<tr>')

            _.each(windowedSeq, (wind, day) => {
                $header.append($('<td>').text(day.split('-')[0])
                    .css("border", "1px solid #000")
                );
            })
            $header.append($('<td>').text("Total")
                .css("border", "1px solid #000"));

            _.each(windowedSeq, (wind, day) => {
                $header2.append($('<td>').text(day.split('-')[0])
                    .css("border", "1px solid #000")
                    .addClass("tableHeader")
                );
            })

            let $header3 = $('<tr>')
            $header3.append($('<td>').text("Total")
                .css("border", "1px solid #000")
                .addClass("tableHeader")
            );

            $header1.appendTo($('#leftHeaderData'))
            $header2.appendTo($('#rightHeaderData'))
            $header3.appendTo($('#endHeaderData'))
            return $table
        }

        function appendRow($appendPoint, targetContract, windowedFlows, total, contractName, level, path, cssClass, show, aggregateCount, hasChildren, hasDetail) {

            let $tr = $('<tr>')
                .data("path", path)
                .data("level", level)
                .data("aggregateCount", aggregateCount)
                .data("hasChildren", aggregateCount)
                .data("contract", targetContract)
                .data("hasDetail", hasDetail)
                .appendTo($appendPoint)
                //.on("click", toggle)
                .addClass(cssClass)

            let factor = 30
            let offset = 130
            let cssColor = "rgb(" + (offset + level * factor) + "," + (offset + level * factor) + "," + (offset + level * factor) + ")"
            $tr.css("background-color", cssColor)

            let symbol = "+"
            if (cssClass == 'detail') {
                if (aggregateCount > 1)
                    symbol = "-"
                else
                    symbol = ""

            } else {

            }

            let $leftRow = $('<tr>')
            $leftRow
                .data("path", path)
                .data("level", level)
                .data("aggregateCount", aggregateCount)
                .data("hasChildren", aggregateCount)
                .data("contract", targetContract)
                .data("hasDetail", hasDetail)
                .appendTo($appendPoint)
                //.on("click", toggle)
                .addClass(cssClass)


            $tr.append(
                $('<td>')
                .text(symbol)
                .addClass('expand/collapse')
            )

            $leftRow.append(
                $('<td>')
                .text(symbol)
                .addClass('expand/collapse')
                .addClass("tableFirstCol")
            )

            $tr.append($('<td>')
                .text((contractName ? contractName : ""))
                .css("padding-left", ' ' + (level * 10) + "px")
                .css("border", "1px solid #000")
            );

            $leftRow.append($('<td>')
                .text((contractName ? contractName : ""))
                .css("padding-left", ' ' + (level * 10) + "px")
                .css("border", "1px solid #000")
                .addClass("tableFirstCol")
            );

            _.each(contractProto, (value, prop) => {
                if (value == null) {
                    let $td;
                    let contractvalue = targetContract[prop]
                    let flow1 = _.chain(windowedFlows).values().head().value()
                    if (flow1 && flow1[prop] !== undefined && (prop == "account" || prop == "unit")) {
                        contractvalue = flow1[prop]
                    }
                    if (Array.isArray(contractvalue)) {
                        if (contractvalue.length > 1)
                            contractvalue = contractvalue[0] + ",..."
                    }
                    $tr.append($td = $('<td>').text(contractvalue)
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                    );
                    if (targetContract && targetContract.inherited && targetContract.inherited.indexOf(prop) != -1) {
                        $td.css("background-color", "lightgrey")
                    }
                }
            })

            _.each(contractProto, (value, prop) => {
                if (value == null) {
                    let $td;
                    let contractvalue = targetContract[prop]
                    let flow1 = _.chain(windowedFlows).values().head().value()
                    if (flow1 && flow1[prop] !== undefined && (prop == "account" || prop == "unit")) {
                        contractvalue = flow1[prop]
                    }
                    if (Array.isArray(contractvalue)) {
                        if (contractvalue.length > 1)
                            contractvalue = contractvalue.join("<br/>")
                    }
                    $leftRow.append($td = $('<td>').html(contractvalue)
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                        .addClass("tableFirstCol")
                    );
                    if (targetContract && targetContract.inherited && targetContract.inherited.indexOf(prop) != -1) {
                        $td.css("background-color", "lightgrey")
                    }
                }
            })

            let $rightRow = $('<tr>')

            if (cssClass == 'detail')
                _.each(windowedFlows, (wind, day) => {
                    $tr.append($('<td>')
                        .append($('<span>').text(wind.amount))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                    );
                })
            else
                _.each(windowedFlows, (wind, day) => {
                    let $td = $('<td>')
                    if (wind.in && wind.out) {
                        $td.append($('<span>').text("in:" + wind.in))
                            .append($('<br>'))
                            .append($('<span>').text("out:" + wind.out))
                            .append($('<br>'))
                    }

                    $tr.append($td
                        .append($('<span>').text(wind.amount))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                    );

                })

            if (cssClass == 'detail')
                _.each(windowedFlows, (wind, day) => {
                    $rightRow.append($('<td>')
                        .append($('<span>').text(wind.amount))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                    );
                })
            else
                _.each(windowedFlows, (wind, day) => {
                    let $td = $('<td>')
                    if (wind.in && wind.out) {
                        $td.append($('<span>').text("in:" + wind.in))
                            .append($('<br>'))
                            .append($('<span>').text("out:" + wind.out))
                            .append($('<br>'))
                    }

                    $rightRow.append($td
                        .append($('<span>').text(wind.amount))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                    );

                })

            if (cssClass == 'detail')
                _.each([total], (wind, day) => {
                    $tr.append($('<td>')
                        .append($('<span>').text(wind.amount))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                        .css("background-color", "white")
                    );
                })
            else
                _.each([total], (wind, day) => {
                    let $td = $('<td>')
                    if (wind.in && wind.out) {
                        $td
                            .append($('<span>').text("in:" + wind.in))
                            .append($('<br>'))
                            .append($('<span>').text("out:" + wind.out))
                            .append($('<br>'))
                    }
                    $tr.append($td
                        .append($('<span>').text(wind.amount))
                        .append($('<br>'))
                        .append($('<span>').text("avg:" + wind.average))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                        .css("background-color", "white")
                    );
                })

            let $endRow = $('<tr>')
            if (cssClass == 'detail')
                _.each([total], (wind, day) => {
                    $endRow.append($('<td>')
                        .append($('<span>').text(wind.amount))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                        .css("background-color", "white")
                    );
                })
            else
                _.each([total], (wind, day) => {
                    let $td = $('<td>')
                    if (wind.in && wind.out) {
                        $td
                            .append($('<span>').text("in:" + wind.in))
                            .append($('<br>'))
                            .append($('<span>').text("out:" + wind.out))
                            .append($('<br>'))
                    }
                    $endRow.append($td
                        .append($('<span>').text(wind.amount))
                        .append($('<br>'))
                        .append($('<span>').text("avg:" + wind.average))
                        .css("border", "1px solid #000")
                        .css("padding-left", ' ' + (level * 10) + "px")
                        .css("background-color", "white")
                    );
                })

            if (show)
                $tr.show();
            else
                $tr.hide();

            //show = true 

            if (show)
                $leftRow.show();
            else
                $leftRow.hide();
            $leftRow.appendTo($('#leftData')).css("background-color", cssColor)

            if (show)
                $rightRow.show();
            else
                $rightRow.hide();
            $rightRow.appendTo($('#rightData')).css("background-color", cssColor)

            if (show)
                $endRow.show();
            else
                $endRow.hide();
            $endRow.appendTo($('#endData')).css("background-color", cssColor)

        }

        function textToHtml(text) {
            text = text.replace(/\n/g, "<br/>")
            return text
        }

        function appendFooter($appendPoint, targetContract, windowedFlows, total, contractName, isTotalLine, allFlows) {

            let $tr = $('<tr>').appendTo($appendPoint)

            let $footer1 = $('<tr>')
            let $footer2 = $('<tr>')
            let $footer3 = $('<tr>')


            if (isTotalLine) {
                $tr.css("background-color", "white")
                $footer1.css("background-color", "white")
                $footer2.css("background-color", "white")
                $footer3.css("background-color", "white")
            } else {
                $tr.css("background-color", "yellow")
                $footer1.css("background-color", "yellow")
                $footer2.css("background-color", "yellow")
                $footer3.css("background-color", "yellow")
            }

            $tr.append($('<td>').text(''))
            $tr.append($('<td>').text(contractName)
                .css("border", "1px solid #000"));

            $footer1.append($('<td>').text(''))
            $footer1.append($('<td>').text(contractName)
                .css("border", "1px solid #000"));

            _.each(contractProto, (value, prop) => {
                if (value == null)
                    $tr.append($('<td>').text(targetContract[prop])
                        .css("border", "1px solid #000"));

            })

            _.each(contractProto, (value, prop) => {
                if (value == null)
                    $footer1.append($('<td>').text(targetContract[prop])
                        .css("border", "1px solid #000"));

            })

            _.each(windowedFlows, (wind, day) => {
                let $td = $('<td>')

                if (wind.in && wind.out) {
                    $td
                        .append($('<span>').text("in:" + wind.in))
                        .append($('<br>'))
                        .append($('<span>').text("out:" + wind.out))
                        .append($('<br>'))
                }

                $tr.append($td.append($('<span>').text(wind.amount))
                    .append($('<br>'))
                    .append($bal = $('<span>').text(" (" + (wind.balance ? wind.balance : '0') + ")"))
                    .css("border", "1px solid #000")
                );

                if (wind.oldBalance !== undefined) {
                    $bal.css("color", "black")
                    $bal.css("font-weight", "bold")
                }

                if (wind.negative !== undefined) {
                    $bal.css("color", "red")
                    $bal.css("font-weight", "bold")
                }
            })

            _.each(windowedFlows, (wind, day) => {
                let $td = $('<td>')

                if (wind.in && wind.out) {
                    $td
                        .append($('<span>').text("in:" + wind.in))
                        .append($('<br>'))
                        .append($('<span>').text("out:" + wind.out))
                        .append($('<br>'))
                }

                $footer2.append($td.append($('<span>').text(wind.amount))
                    .append($('<br>'))
                    .append($bal = $('<span>').text(" (" + (wind.balance ? wind.balance : '0') + ")"))
                    .css("border", "1px solid #000")
                );

                if (wind.oldBalance !== undefined) {
                    $bal.css("color", "black")
                    $bal.css("font-weight", "bold")
                    // pop up with flows details: contracts/flows since last oldbalance: amount,unit,date,balance
                    let firstBalance = _(wind.oldBalance).keys().head()
                    if (!isTotalLine) {
                        let text = getReconcileInfos(allFlows, wind, firstBalance, getPreviousBalanceDate(targetContract, firstBalance), contractName)
                        $bal.attr("title", text.title + "\n " + text.content)
                        $bal.on("click", openmodel(text.title, textToHtml(text.content)))
                    }
                    if (firstBalance) {
                        if (Math.abs(wind.oldBalance[firstBalance].deltaBalance) > Math.abs(deltaBalanceThreshold)) {
                            if (wind.oldBalance[firstBalance].deltaBalance > 0) {
                                $bal.css("color", "green")
                            } else {
                                $bal.css("color", "red")
                            }
                        }
                    }
                }

                if (wind.negative !== undefined) {
                    $bal.css("color", "orange")
                    $bal.css("font-weight", "bold")
                    // list 
                    $bal.attr("title", prettyNegatives(wind.negative))
                    $bal.on("click", openmodel("", textToHtml(prettyNegatives(wind.negative))))
                }
            })

            _.each([total], (wind, day) => {
                let $td = $('<td>')

                if (wind.in && wind.out) {
                    $td
                        .append($('<span>').text("in:" + wind.in))
                        .append($('<br>'))
                        .append($('<span>').text("out:" + wind.out))
                        .append($('<br>'))
                        .append($('<span>').text(wind.amount))
                        .append($('<br>'))
                }

                $tr.append(
                    $td
                    .append($bal = $('<span>').text(" (" + (wind.balance ? wind.balance : '0') + ")"))
                    .css("border", "1px solid #000")
                    .css("background-color", "white")
                );

                if (wind.oldBalance !== undefined) {
                    $bal.css("color", "black")
                    $bal.css("font-weight", "bold")
                }

                if (wind.negative !== undefined) {
                    $bal.css("color", "orange")
                    $bal.css("font-weight", "bold")
                }
            })

            _.each([total], (wind, day) => {
                let $td = $('<td>')

                if (wind.in && wind.out) {
                    $td
                        .append($('<span>').text("in:" + wind.in))
                        .append($('<br>'))
                        .append($('<span>').text("out:" + wind.out))
                        .append($('<br>'))
                        .append($('<span>').text(wind.amount))
                        .append($('<br>'))
                }

                $footer3.append(
                    $td
                    .append($bal = $('<span>').text(" (" + (wind.balance ? wind.balance : '0') + ")"))
                    .css("border", "1px solid #000")
                    .css("background-color", "white")
                );

                if (wind.oldBalance !== undefined) {
                    $bal.css("color", "black")
                    $bal.css("font-weight", "bold")
                }

                if (wind.negative !== undefined) {
                    $bal.css("color", "red")
                    $bal.css("font-weight", "bold")
                }
            })

            if (isTotalLine) {
                $footer1.appendTo($('#leftFooterTotalData'))
                $footer2.appendTo($('#rightFooterTotalData'))
                $footer3.appendTo($('#endFooterTotalData'))
            } else {
                $footer1.appendTo($('#leftFooterData'))
                $footer2.appendTo($('#rightFooterData'))
                $footer3.appendTo($('#endFooterData'))

            }
        }


        expandone(startExpandLevel)

        adjustTable($('#flows'))
        // this aint working...
        if (startExpandLevel<2)
            expandone(startExpandLevel)

    }

    function adjustTable($anchor) {

        function toArray($selector) {
            let res = []
            $selector.each((i, elem) => {
                res.push(elem)
            })
            return res
        }

        function doTableSizing($anchor) {
            let alltds = [];
            let $rowsleft = $('.headerminorleft tr,.dataminorleft tr,.footerminorleft tr,.footerminortotalleft tr', $anchor);
            let $rowsright = $('.headerminorright tr,.dataminorright tr,.footerminorright tr,.footerminortotalright tr', $anchor);
            let $rowsend = $('.headerminorend tr,.dataminorend tr,.footerminorend tr,.footerminortotalend tr', $anchor);
            let col, row, max = 0;
            let numrows = $rowsleft.length;
            if ($rowsleft.length != $rowsright.length || $rowsleft.length != $rowsend.length)
                throw "unequal rows "
            for (row = 0; row < numrows; row++) {
                let max = 0;
                let tds = toArray($('td', $rowsleft.get(row))).concat(toArray($('td', $rowsright.get(row)))).concat(toArray($('td', $rowsend.get(row))))
                $($rowsleft.get(row)).attr("data-rownumber", row)
                $($rowsright.get(row)).attr("data-rownumber", row)
                $($rowsend.get(row)).attr("data-rownumber", row)
                $(tds[0]).attr("data-rownumber", row)
                tds.forEach(function(elem) {
                    max = Math.max($(elem).height(), max);
                    alltds.push(elem)
                })
                tds.forEach(function(elem) {
                    $(elem).height(max);
                })
            }
            let numcols = alltds.length / numrows;
            for (max = 0, col = 0; col < numcols; col++) {
                if (col == numcols - 1)
                    console.log("here")
                for (max = 0, row = 0; row < numrows; row++) {
                    let index = col + row * numcols;
                    max = Math.max($(alltds[index]).width(), max);
                    if (max > 300)
                        console.log("there")
                }
                for (row = 0; row < numrows; row++) {
                    let index = col + row * numcols;
                    $(alltds[index]).width(max);
                }
            }
        }

        function fnScroll() {
            $('.headerminorright>div,.footerminorright>div,.footerminortotalright>div', $anchor).scrollLeft($('.dataminorright>div', $anchor).scrollLeft());
            $('.dataminorend>div,.dataminorleft>div').scrollTop($('.dataminorright>div', $anchor).scrollTop());
        };

        function fnScrolll() {
            $('.dataminorend>div,.dataminorright>div').scrollTop($('.dataminorleft>div', $anchor).scrollTop());
        };

        function fnScrolle() {
            $('.dataminorleft>div,.dataminorright>div').scrollTop($('.dataminorend>div', $anchor).scrollTop());
        };

        function fnScrollh() {
            $('.dataminorright>div,.footerminorright>div,.footerminortotalright>div', $anchor).scrollLeft($('.headerminorright>div', $anchor).scrollLeft());
        };

        function fnScrollhf() {
            $('.dataminorright>div,.headerminorright>div,.footerminortotalright>div', $anchor).scrollLeft($('.footerminorright>div', $anchor).scrollLeft());
            $('.footerminorend>div,.footerminorleft>div').scrollTop($('.footerminorright>div', $anchor).scrollTop());
        };

        function fnScrolllf() {
            $('.footerminorend>div,.footerminorright>div').scrollTop($('.footerminorleft>div', $anchor).scrollTop());
        };

        function fnScrolllfe() {
            $('.footerminorleft>div,.footerminorright>div').scrollTop($('.footerminorend>div', $anchor).scrollTop());
        };

        function fnScrollht() {
            $('.dataminorright>div,.footerminorright>div,.headerminorright>div', $anchor).scrollLeft($('.footerminortotalright>div', $anchor).scrollLeft());
        };

        $('td', $anchor)
            .attr('nowrap', 'nowrap');

        $('.dataminorright>div', $anchor).on('scroll', fnScroll);
        $('.dataminorleft>div', $anchor).on('scroll', fnScrolll);
        $('.dataminorend>div', $anchor).on('scroll', fnScrolle);

        $('.headerminorright>div', $anchor).on('scroll', fnScrollh);
        $('.footerminorright>div', $anchor).on('scroll', fnScrollhf);
        $('.footerminorleft>div', $anchor).on('scroll', fnScrolllf);
        $('.footerminorend>div', $anchor).on('scroll', fnScrolllfe);
        $('.footerminortotalright>div', $anchor).on('scroll', fnScrollht);

        $('.dataminorleft>div,.dataminorright>div', $anchor)
            .css('overflow', 'scroll')
            .css('position', 'relative');
        $('.headerminorleft>div,.headerminorright>div,.footerminorleft>div,.footerminorright>div,.footerminortotalright>div,.footerminorend>div', $anchor)
            .css('overflow', 'scroll')
            .css('position', 'relative');

        doTableSizing($anchor);

        function setMaxSize() {
            let offset = $('.dataminorleft>div').offset().left + $('.dataminorleft>div').width() + $('.dataminorend>div').width();
            let wwidth = $(window).width();
            let leftover = wwidth - offset * 1.05;
            $('.headerminorright>div,.dataminorright>div,.footerminorright>div,.footerminorright>div,.footerminortotalright>div', $anchor).css('max-width', leftover);

            offset = $('.headerminorleft>div').offset().top + $('.headerminorleft>div').height() + $('.footerminortotalleft>div').height();
            let wheight = $(window).height();
            leftover = wheight - offset * 1.05;
            let sharefraction = 0.75
            let share = leftover * sharefraction
            let accountshare = leftover * (1.0 - sharefraction)
            $('.dataminorleft>div,.dataminorright>div,.dataminorend>div', $anchor).css('max-height', share).css('height', share);
            $('.footerminorleft>div,.footerminorright>div,.footerminorend>div', $anchor).css('max-height', accountshare).css('height', accountshare);
        };
        setMaxSize();
        doTableSizing($anchor);
        let rtime;
        let timeout = false;
        let delta = 200;

        function resizeTimer() {
            rtime = new Date();
            if (timeout === false) {
                timeout = true;
                setTimeout(resizeend, delta);
            }
        };

        $(window).resize(resizeTimer);

        function resizeend() {
            if (new Date() - rtime < delta) {
                setTimeout(resizeend, delta);
            } else {
                //alert('Done resizing');
                setMaxSize();
                timeout = false;
            }
        }

    };

    var openmodel;
    var span;
    openmodel = function(title, content) {

        //    window.open('http://stackoverflow.com','mywindow','width=400,height=200,toolbar=yes,location=yes,directories=yes,status=yes,menubar=yes,scrollbars=yes,copyhistory=yes, resizable=yes')


        return () => {
            // let output = "hiiiii ";
            // let OpenWindow = window.open("/flows2/popup.html", "mywin", '');
            // OpenWindow.dataFromParent = output; // dataFromParent is a variable in child.html
            // OpenWindow.init();

            // return 

            $modal = $('#myModal');
            if (!span) {
                span = $('#myModal .close').get(0);
                span.onclick = function() {
                    $modal.get(0).style.display = "none";
                }

                // When the user clicks anywhere outside of the modal, close it
                window.onclick = function(event) {
                    if (event.target == $modal.get(0)) {
                        $modal.get(0).style.display = "none";
                    }
                }
            }
            $modal.get(0).style.display = "block";
            $('.modal-header h2', $modal).html(title)
            $('.modal-body', $modal).html(content)
        }
    }