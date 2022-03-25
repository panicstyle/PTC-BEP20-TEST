const PTC = artifacts.require("PTC");
const vestingData = require("./vestingData.json");
const util = require('util');
const fileLog = require("./fileLog.js");
var Web3 = require('web3');

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function leftPad(value) { if (value >= 10) { return value; } return `0${value}`; }
function toStringByFormatting(source, delimiter = '-') { const year = source.getFullYear(); const month = leftPad(source.getMonth() + 1); const day = leftPad(source.getDate()); return [year, month, day].join(delimiter); }

module.exports = async function(callback) {
        try {
        // Fetch the deployed Contract PTC
        const ptc = await PTC.at("0xe5e4A8c3d82318183D298473cb52c07A161F1205")
        console.log('PTC fetched', ptc.address)

        var cnt = 0;
        for(idx in vestingData){
            cnt++;
            const data = vestingData[idx];
            console.log("---------------------------------------------------------------------------------");
            console.log(data);

            fileLog.writeln("---------------------------------------------------------------------------------");
            fileLog.writeln(util.format("%d/%d", cnt, vestingData.length));
            fileLog.writeln(util.format("address: %s", data.address));
            fileLog.writeln(util.format("amount: %s", data.amount));
            fileLog.writeln(util.format("vestingCount: %d", data.vestingCount));
            fileLog.writeln(util.format("firstReleaseDate: %s", data.firstReleaseDate));
            fileLog.writeln(util.format("vestingInterval: %s", data.vestingInterval));

            // 계정의 현재 balanceOf(lock제외) 와 balanceOfTotal(lock포함) 을 표시한다.
            var weiValue = await ptc.balanceOf.call(data.address)
            var etherValue = Web3.utils.fromWei(weiValue, 'ether');
            console.log('balanceOf', etherValue)
            fileLog.writeln(util.format("balanceOf: %d", etherValue));

            var weiValue = await ptc.balanceOfTotal.call(data.address)
            var etherValue = Web3.utils.fromWei(weiValue, 'ether');
            console.log('balanceOfTotal', etherValue)
            fileLog.writeln(util.format("balanceOfTotal: %d", etherValue));

            // 최초 릴리즈일자가 오늘 이후여야 함. 금일이거나 금일보다 작으면 오류
            var firstReleaseDate = new Date(data.firstReleaseDate);
            var today = new Date();
            console.log("firstReleaseDate", firstReleaseDate, "today", today);
            if (today >= firstReleaseDate) {
//                throw new Error('firstReleaseDate is invalid.')
                console.log("firstReleaseDate is invalid.");
                fileLog.writeln(util.format("\tError: firstReleaseDate is invalid."));
                continue;
            }

            // amount 를 vestingCount 를 나누고, 나머지는 마지막 값에다 추가한다.
            const vestingAmount = parseInt(data.amount / data.vestingCount);
            const remain = data.amount % data.vestingCount;
            const vestingAmountLast = vestingAmount + remain; 
            console.log("amount:", data.amount, "vestingCount:", data.vestingCount, 
            "vestingAmount:", vestingAmount, "vestingAmountLast:", vestingAmountLast);

            // vestingAmount 를 WEI 단위로 변환
            const vestingAmountWei = Web3.utils.toWei(String(vestingAmount), 'ether');
            const vestingAmountLastWei = Web3.utils.toWei(String(vestingAmountLast), 'ether');
            for (var i=0; i < data.vestingCount; i++) {
                var vestingDate = firstReleaseDate.addDays(i * data.vestingInterval);
                var vestingTimestamp = vestingDate.getTime()/1000;
                console.log("\t", i + 1, "/", data.vestingCount);
                console.log("\t", "vesingDate:", vestingDate, "vestingTimestamp:", vestingTimestamp, "vestingAmountWei:", vestingAmountWei);

                var valueWei = vestingAmountWei;
                var valueEth = vestingAmount;
                if (i == (data.vestingCount - 1)) {
                    valueWei = vestingAmountLastWei;
                    valueEth = vestingAmountLast;
                }
                // transferWithLock
                console.log("\t", "address:", data.address, "vestingAmountWei:", valueWei, "vestingTimestamp:", vestingTimestamp);
                fileLog.writeln(util.format("\t%d/%d", i + 1, data.vestingCount));
                fileLog.writeln(util.format("\tvestringDate=%s, vestingAmount=%d", toStringByFormatting(vestingDate), valueEth));
                fileLog.writeln(util.format("\ttransferWithLock(%s, %s, %s)", data.address, valueWei, vestingTimestamp));

                const transferTx = await ptc.transferWithLock(data.address, BigInt(valueWei), BigInt(vestingTimestamp))
                console.log("\t", 'TST2 transferWithLock', transferTx.tx)
                fileLog.writeln(util.format("\ttransaction: %s", transferTx.tx));
            }

            // 계정의 현재 balanceOf(lock제외) 와 balanceOfTotal(lock포함) 을 표시한다.
            var weiValue = await ptc.balanceOf.call(data.address)
            var etherValue = Web3.utils.fromWei(weiValue, 'ether');
            console.log('balanceOf', etherValue)
            fileLog.writeln(util.format("balanceOf: %d", etherValue));

            var weiValue = await ptc.balanceOfTotal.call(data.address)
            var etherValue = Web3.utils.fromWei(weiValue, 'ether');
            console.log('balanceOfTotal', etherValue)
            fileLog.writeln(util.format("balanceOfTotal: %d", etherValue));            
        };
    }
    catch(error) {
        console.log(error)
    }
    callback()
}
