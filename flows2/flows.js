    // todo: 
    // zoom in gestures: pop up with/jump to stack for one level of detail or 2 more: M -> w or -> day explode 
    // balance differences show: flag when above threshold: flag all the account contracts
    // separate into files
    // filter like data tables?? at least on account
    // manual refresh button
    // work on color, font, ux coding of structure of display
    // add file load button and saving of last path to local storage 
    //     https://www.w3schools.com/howto/howto_js_popup.asp
    // gui jquery code redesign - collapse event handling!!

    let testContracts
    let testAccounts
    let contracts
    let accounts
    let units 

    // [accountNames],[all-flows]=> genAllAccountLines => [chunkFlows], Total-chunkedFlows
    function genAllAccountLines(accountNames, normalizedAcccounts, allFlows, start, end, unit, rythm) {
        // walk-contracts
        let result = { totalFlows: {}, allChunkedFlows: [], paths: [], accounts: [] }
        accountNames.forEach(accountName => {
            let account = findPropOnObject(accountName, normalizedAcccounts)
            let balances = findPropOnObject("balances", account)

            result.allChunkedFlows.push(genAccountLine(allFlows, start, end, balances, unit, rythm, accountName))
            result.paths.push(accountName)
            result.accounts.push(findPropOnObject(accountName, normalizedAcccounts))

        })
        return result
    }

    function getAllAccountNames(normalizedAcccounts) {
        let accountNames = []
        walkPojo(normalizedAcccounts, (account, name) => {
            if (!isAcccount(account)) return
            accountNames.push(name)
        })
        return accountNames
    }

    function isAcccount(account) {
        return account && account.balances !== undefined
    }

    function isContract(contract) {
        return contract && contract.amount !== undefined && contract.amount != 0 && contract.start !== undefined
    }
    // contracts,start,end => genAllContractLines => [all-chunkFlows],[all-flows]
    function genAllContractLines(normalizedContracts, start, end, rythm) {
        // walk-contracts
        let allResults = { allFlows: [], allChunkedFlows: [], allChunkedRowupFlows: [], paths: [], contracts: [], aggregateCounts: [], immediateChildren: [], hasDetail: [] }
        walkPojo(normalizedContracts, (contract, key, level, path, immediateChildren) => {
            if (!isContract(contract) && !immediateChildren) return
            let results = { allFlows: [], allChunkedFlows: [], allChunkedRowupFlows: [], paths: [], contracts: [], aggregateCounts: [] }
            let result = genContractLine(contract, start, end, rythm, immediateChildren)

            allResults.allFlows.unshift(result.flows)
            allResults.allChunkedFlows.unshift(result.chunkedFlows)
            allResults.allChunkedRowupFlows.unshift(result.chunkedRollupFlows)
            // rollup for each account, if there is subs 
            result.contract = contract;
            allResults.contracts.unshift(contract)
            result.path = path + (key ? key : "");

            allResults.paths.unshift(result.path)
            allResults.aggregateCounts.unshift(result.aggregateCount)
            allResults.immediateChildren.unshift(immediateChildren)
            allResults.hasDetail.unshift(result.hasDetail)

            return result.allFlows;
        })
        return allResults
    }

    // [all-flows],accountName,unit=>genAccountLine=>flows{windows:{ amount, unit, accounts, balance },...}
    function genAccountLine(allFlows, start, end, balances, unit, rythm, accountName) {

        let rolledUpFlows = genRollupFlows(start, end, allFlows, [accountName], unit)
        let actualFlows = actualizeFlows(rolledUpFlows, balances)
        let chunkedFlows = chunkFlows(start, end, actualFlows, rythm)
        return chunkedFlows
    }

    function genRollupFlows(start, end, allFlows, accountNames, unit) {
        let startOfFlows = _.chain(allFlows).values().head().keys().head().value()
        let rolledUpFlows = (startOfFlows && startOfFlows.split("-").length > 1) ?
            _.chain(allFlows).values().head().keys().reduce((flows, period) => {
                flows[period] = {};
                return flows;
            }, {}).value() :
            genFlows(start, end, "d")

        if (allFlows) {
            allFlows.forEach(flows => {
                // filter out none listed accounts
                let flow = _.chain(flows).values().head().value()
                if (accountNames && accountNames.length && accountNames[0] !== undefined && !(flow && flow.account && accountNames.indexOf(flow.account) != -1))
                    return

                _.reduce(rolledUpFlows, (dummy, rollup, day) => {
                    rolledUpFlows[day] = mergeFlow(rollup, flows[day], unit)
                }, 1)
            })
        }
        return rolledUpFlows
    }

    // contract,start,end,unit,rythm=>genContractLine=>chunkFlows
    function genContractLine(normalizedContract, start, end, rythm, immediateChildren) {
        let result = {}
        result.flows = genFlows(start, end, null, normalizedContract)
        result.chunkedFlows = chunkFlows(start, end, result.flows, rythm)

        // fetch all from this contract down: flag when there are not sub contracts:?some null value 
        result.allFlows = immediateChildren || []
        result.allFlows.push(result.flows)
        let rollupFlows = genRollupFlows(start, end, result.allFlows, null, normalizedContract.unit)
        result.chunkedRollupFlows = chunkFlows(start, end, rollupFlows, rythm)
        let aggregateCount = immediateChildren && immediateChildren.length || 0
        result.aggregateCount = aggregateCount
        result.hasDetail = isContract(normalizedContract)
        return result
    }

    function parseRythm(rythm) {
        let res = { length: 1, rythm: "" }
        let a = rythm.split("-")
        if (a.length == 1)
            res.rythm = a[0]
        else {
            res.rythm = a[1]
            res.length = parseInt(a[0])
        }
        if (res.rythm == "y")
            console.log("found")
        return res
    }

    // function parseRythmPeriod(rythm, current, period) {
    //     let parsedRythm = parseRythm(rythm)
    //     return  rythmNextPeriod(parsedRythm, current, period) 
    // }

    // function rythmNextPeriod(parsedRythm, current, period) {

    //     for (j = 0; j < period; j++) {
    //         current = rythmNext(parsedRythm, current)
    //     }
    //     return current
    // }

    function rythmNext(parsedRythm, current) {

        for (i = 0; i < parsedRythm.length; i++) {
            let next
            if (parsedRythm.rythm == "o") {
                next = "99991231"
            } else {
                next = moment(current, 'YYYYMMDD').add(1, parsedRythm.rythm).format('YYYYMMDD')
            }
            if (next == current) { // in case moment duration/rythm code is incorrect:moment returns same date
                throw "constant current date :" + current + " rythm: " + rythm
            }
            current = next;
        }
        return current
    }

    // contract,start,end,unit=>genFlows=>flows{day:{ amount, unit, account },...}
    function genFlows(start, end, rythm, normalizedContract) {
        let flows = {}
        let contractStart = start
        let contractEnd = end
        if (normalizedContract && normalizedContract.start)
            contractStart = normalizedContract.start
        if (normalizedContract && normalizedContract.end)
            contractEnd = normalizedContract.end
        if (normalizedContract && !rythm)
            rythm = normalizedContract && normalizedContract.rythm

        end = contractEnd < end ? contractEnd : end
        start = contractStart

        if (rythm) {
            let current = contractStart
            let next;
            let parsedRythm = parseRythm(rythm)

            while (current <= end) {
                if (start <= current) {
                    let flow = {}

                    flow.amount = normalizedContract && normalizedContract.amount
                    flow.unit = normalizedContract && normalizedContract.unit
                    flow.account = normalizedContract && normalizedContract.account
                    flows[current] = flow;
                }
                current = rythmNext(parsedRythm, current)
            }
        }
        return flows
    }


    // flows/actualFlows,rythm=>chunkFlows=>chunkedFlows{windows:{ amount, unit, accounts },...}
    // create window and gather flows and merge them
    function chunkFlows(start, last, flows, rythm) {
        let chunkedFlows = {}

        let current = start
        let next;

        // current and next: last-next-1-rythm

        while (current <= last) {
            next = moment(current, 'YYYYMMDD').add(1, rythm).format('YYYYMMDD')
            if (next == current) {
                throw "constant current date :" + current + " , rythm: " + rythm
            }
            let nextminusone = moment(next, 'YYYYMMDD').add(-1, "d").format('YYYYMMDD')
            let chunkName = current + "-" + nextminusone + "-" + rythm

            chunkedFlows[chunkName] = gatherAndMergeFlows(current, nextminusone, flows)

            current = next
        }
        return chunkedFlows
    }

    function gatherAndMergeFlows(start, last, flows) {
        let chunk = { flow: 0 }
        if (!flows) return chunk;

        let current = start
        while (current <= last) {
            chunk = mergeFlow(chunk, flows[current])
            next = moment(current, 'YYYYMMDD').add(1, "d").format('YYYYMMDD')
            current = next
        }
        return chunk
    }

    function round2(value) {
        return Math.round(value * 100) / 100
    }

    function round(value) {
        return Math.round(value)
    }

    function extendObject(obj, src) {
        if (src) {
            obj = obj || {}
            Object.keys(src).forEach(function(key) { if (obj[key] === undefined) obj[key] = src[key]; });
        }
        return obj;
    }

    function mergeFlow(oldFlow, flow, unit) {
        let merged = {}
        merged.unit = unit || oldFlow.unit || flow && flow.unit
        // account : if diff to array
        if ((oldFlow && oldFlow.account && Array.isArray(oldFlow.account)) || (flow && flow.account && Array.isArray(flow.account)) || (flow && oldFlow && oldFlow.account && flow.account && oldFlow.account != flow.account)) {
            merged.account = []
            if (oldFlow && oldFlow.account && Array.isArray(oldFlow.account))
                merged.account = [...new Set([...merged.account, ...oldFlow.account])];
            else if (oldFlow.account)
                merged.account.push(oldFlow.account)

            if (flow && flow.account && Array.isArray(flow.account))
                merged.account = [...new Set([...merged.account, ...flow.account])];
            else if (flow && flow.account)
                merged.account.push(flow.account)

        } else {
            merged.account = oldFlow.account || flow && flow.account
        }

        merged.amount = oldFlow.amount || 0
        merged.in = oldFlow.in || 0
        merged.out = oldFlow.out || 0

        let newBalance = (flow && flow.balance) || (oldFlow && oldFlow.balance)
        if (newBalance !== undefined) {
            merged.balance = round2(newBalance)
        }

        if (flow && flow.oldBalance || oldFlow && oldFlow.oldBalance)
            merged.oldBalance = extendObject(oldFlow.oldBalance, flow.oldBalance)

        if (flow && flow.in) {
            let inamount = convert(flow.in, flow.unit, merged.unit)
            merged.in += inamount
            merged.in = round2(merged.in)
        }

        if (flow && flow.out) {
            let out = convert(flow.out, flow.unit, merged.unit)
            merged.out += out
            merged.out = round2(merged.out)
        }

        if (flow && flow.amount) {
            let amount = convert(flow.amount, flow.unit, merged.unit)
            merged.amount += amount
            merged.amount = round2(merged.amount)
            if (amount > 0 && typeof flow.in === "undefined") {
                merged.in += amount
                merged.in = round2(merged.in)
            } else if (typeof flow.out === "undefined") {
                merged.out += amount
                merged.out = round2(merged.out)
            }
        }

        if (flow && flow.negative || oldFlow && oldFlow.negative)
            merged.negative = extendObject(oldFlow.negative, flow.negative)

        return merged
    }

    function convert(value, unit, targetUnit) {
        if (unit && unit != targetUnit) {
            let factor = getConversionFactor(unit, targetUnit)
            value = value * factor
        }
        return value;
    }

    function getConversionFactor(unit, targetUnit) {
        if (units[unit][targetUnit])
            return units[unit][targetUnit]
        else
            throw new Error("no conversion for : " + unit + " to " + targetUnit)
    }
    // flows,account:{balances,unit,...}=>actualizeFlows=>actualFlows{day:{ amount, unit, account, balance, oldBalance,.. },...}
    function actualizeFlows(flows, balances) {
        let balance = 0
        _.reduce(flows, (flows, flow, day) => {
            if (flow.amount !== undefined)
                balance += flow.amount
            flow.balance = balance
            if (balances[day] !== undefined) {
                let oldBalance = { balance: flow.balance, }
                flow.balance = balances[day]
                balance = balances[day]

                oldBalance.deltaBalance = flow.balance - oldBalance.balance
                flow.oldBalance = flow.oldBalance || {}
                flow.oldBalance[day] = oldBalance
            }
            if (flow.balance < 0) {
                flow.negative = flow.negative || {}
                flow.negative[day] = flow.balance
            }
            return flows
        }, flows)

        return flows
    }

    function findPropOnObject(prop, source) {
        for (var property in source) {
            let found = undefined
            if (prop == property) {
                found = source[property];
            } else if (typeof source[property] === "object") {
                found = findPropOnObject(prop, source[property]);
            }
            if (found)
                return found
        }
        return undefined
    }

    function normalizeAmount(contract) {
        // set start
        // norm start
        if (!contract.amount)
            return
        contract.amount = -contract.amount
    }

    function normalizeTransfers(contracts) {

        return function(contract, key, level, path) {
            if (!contract.contract)
                return
            let transferContract =
                _(path.split("."))
                .filter(elem => elem)
                .unshift(contract.contract)
                .push(key)
                .reduce((current, pathElement) => {
                    //current[pathElement] = current[pathElement] || {};
                    current[pathElement] = inherit({}, current, contractProto, true)
                    return current[pathElement]
                }, contracts)
            clone(contract, true, transferContract)
            transferContract.amount = -transferContract.amount
            transferContract.contract = undefined
            transferContract.account = transferContract.transferAccount || transferContract.account
            transferContract.transferAccount = undefined
        }
    }

    function normalizeDates(contract) {
        // set start
        // norm start
        if (!contract.start)
            return
        normalizeDate(contract, "start")
        normalizeDate(contract, "end")
    }

    function normalizeDate(contract, prop) {
        // set start
        // norm start
        let date = contract[prop];
        if (date) {
            let endMarker = "end"
            if (date.indexOf(endMarker) == date.length - endMarker.length) {
                if (date.length != 6 + endMarker.length)
                    throw "date not YYYYMM formate: " + JSON.stringify(contract, null, 2)
                let begin = moment(date.substring(0, 6), 'YYYYMM')
                let end = begin.endOf('month');
                contract[prop] = end.format('YYYYMMDD')
            }
        }
    }

    function normalizeCalc(contract, prop, level, path, res, parent) {
        if (!isContract(contract)) return
        //if (typeof contract.amount == "string" ) {
        if (contract.calc == "auto:match:..") {
            // calc : parent amount: period - div by my period 
            let end = rythmNext(parseRythm(parent.rythm), parent.start)
            let amount = parent.amount

            let numberPeriods = moment(end, "YYYYMMDD").diff(parent.start, contract.rythm, true)
            let myAmount = amount / numberPeriods;
            contract.amount = round2(myAmount)
        }
        // else {
        //     throw "unknown path : "+contract.calc
        // }
        //}
    }

    // source, key, level, path, res, parent
    function autoamotization(contract, prop, level, path, res, parent) {
        if (!isContract(contract)) return
        let parsedRythm = parseRythm(contract.rythm)
        if (parsedRythm.rythm == "y" && parsedRythm.length > 1) {
            // calc : parent amount: period - div by my period 
            let end = rythmNext(parsedRythm, parent.start)
            let amount = contract.amount

            let newContract = { contract: "amortizations", rythm: "M", start: contract.start, transferAccount: contract.account, account: parent.account, }
            let numberPeriods = moment(end, "YYYYMMDD").diff(contract.start, newContract.rythm, true)
            let myAmount = amount / numberPeriods;
            newContract.amount = round2(myAmount)
            contract.amortizations = newContract
        }
    }

    function normaliseContracts(contracts, contractProto) {
        contracts = inherit(contracts, {}, contractProto, true)
        walkPojo(contracts, normalizeDates)
        walkPojo(contracts, normalizeAmount)
        walkPojo(contracts, autoamotization)
        walkPojo(contracts, normalizeTransfers(contracts))
        return contracts
    }

    // bring last balance before start day forward, if start day does not have balance ??
    // go down balances until >= start day, if start day not defined and there is one before copy it in on start day
    function isTransfer(transfers, property) { return property == "transfers" }

    function normaliseAccounts(accounts, start, end, normalisedContracts, prototypeAccount) {

        let normalizedAcccounts = inherit(accounts, {}, prototypeAccount, true);

        walkPojo(normalizedAcccounts, bringFowardOldBalance)
        walkPojo(normalizedAcccounts, implementTransfers)

        function implementTransfers(transfers, property, level, path, res) {
            if (!isTransfer(transfers, property)) return
            _.each(transfers, transfer => {
                let toAccount = transfer.account
                let fromAccount = _.findLast(path.split("."))
                // create contracts: transfers.accountfrom, transfers.accountto
                normalisedContracts.transfers = normalisedContracts.transfers || {}
                normalisedContracts.transfers[toAccount] = normalisedContracts.transfers[toAccount] || {}
                let index = _.keys(normalisedContracts.transfers[toAccount]).length
                normalisedContracts.transfers[toAccount][index] = clone(transfer, true)

                normalisedContracts.transfers[fromAccount] = normalisedContracts.transfers[fromAccount] || {}
                index = _.keys(normalisedContracts.transfers[fromAccount]).length
                normalisedContracts.transfers[fromAccount][index] = clone(transfer, true)

                normalisedContracts.transfers[fromAccount][index].amount = -transfer.amount
                normalisedContracts.transfers[fromAccount][index].account = fromAccount


            })
        }

        function bringFowardOldBalance(account, accountName) {
            // find last balance before start
            if (!isAcccount(account)) return
            if (account.balances && !account.balances[start]) {

                let last = _(account.balances).reduce((found, balance, day) => {
                    if (day < start) {
                        return { day: day, balance: balance }
                    }
                    return found
                }, {})
                if (last && last.day) {
                    // calc flows,balance until start
                    let allFlows = genAllContractLines(normalisedContracts, last.day, start, 'd')

                    let rolledUpFlows = genRollupFlows(last.day, start, allFlows.allFlows, [accountName], account.unit)

                    let bals = {}
                    bals[last.day] = last.balance
                    let actualFlows = actualizeFlows(rolledUpFlows, bals)
                    let end = _.findLastKey(actualFlows)
                    // copy start balance to balances
                    account.balances[start] = actualFlows[end].balance
                }
            }
        }

        return normalizedAcccounts
    }
    // deep copy of undefined attributes
    function inherit(source, parent, prototype, deep, target) {
        // filter parent 
        target = target || {}

        // copy source props
        //   if prop in prototype: deep copy/clone 
        for (var prop in source) {
            if (prototype[prop] !== undefined) {
                if (typeof source[prop] == "object") {
                    target[prop] = clone(source[prop], true)
                } else {
                    target[prop] = source[prop]
                }
            }
        }

        // inheit from parent
        for (var prop in parent) {
            if (prototype[prop] === null && target[prop] === undefined && parent[prop] !== undefined) {
                target[prop] = parent[prop]
                if (prototype.inherited) {
                    target.inherited = target.inherited || []
                    target.inherited.push(prop)
                }
            }
        }

        for (var prop in source) {
            if (prototype[prop] === undefined && typeof source[prop] == "object") {
                if (deep)
                    target[prop] = inherit(source[prop], target, prototype, deep)
                else
                    target[prop] = source[prop]
            }
        }

        return target
    }

    // deep copy, but not overwriting dest leaves
    function clone(source, deep, destination) {
        if (!destination)
            if (Array.isArray(source))
                destination = []
        else
            destination = {}
        for (var property in source) {
            if (typeof source[property] === "object" && deep) {
                if (Array.isArray(source[property]))
                    destination[property] = []
                else
                    destination[property] = {}
                clone(source[property], deep, destination[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination
    }

    function walkPojo(source, iterator, key, level, path, parent) {

        if (level === undefined)
            level = 0
        if (path === undefined)
            path = "."
        let subPath = path
        if (key)
            subPath += key + "."
        let res;
        for (var property in source) {
            if (typeof source[property] === "object") {
                let subres = walkPojo(source[property], iterator, property, level + 1, subPath, source)
                if (subres !== undefined)
                    res = (res || []).concat(Array.isArray(subres) ? subres : [subres])
            }
        }
        res = iterator(source, key, level, path, res, parent)
        if (res !== undefined && !Array.isArray(res))
            res = [res]
        return res
    }

    Set.prototype.toJSON = function toJSON() {
        return [...Set.prototype.values.call(this)];
    }

    // function pluckMergeArrays(array,  property) {
    //     let res=[];
    //     if (array && Array.isArray(array)) {
    //         array.forEach(item=> { 
    //             res=res.concat(item && Array.isArray(item[property]) && item[property]|| [])
    //         }) }
    //     return res;
    // }


    const contractProto = {
        start: null,
        duration: null,
        end: null,
        amount: null,
        account: null,
        rythm: null,
        flows: [],
        unit: null,
        inherited: [],
        contract: "",
        transferAccount: "",
        calc: [],
    }
    const prototypeAccount = {
        unit: null,
        balances: [],
        inherited: [],
        transfers: []
    }



