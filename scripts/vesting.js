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

            // amount 를 vestingCount 를 나누었을 때 나머지 없이 나누어져야 함.
            var vestingAmount = parseInt(data.amount / data.vestingCount);
            console.log("amount:", data.amount, "vestingAmount:", vestingAmount, "vestingCount:", data.vestingCount);
            if ((vestingAmount * data.vestingCount) != data.amount) {
//                throw new Error('amount is invalid.')
                console.log("amount is invalid.");
                fileLog.writeln(util.format("\tError: amount is invalid."));
                continue;
            }

            // vestingAmount 를 WEI 단위로 변환
            var vestingAmountWei = Web3.utils.toWei(String(vestingAmount), 'ether');
            for (var i=0; i < data.vestingCount; i++) {
                var vestingDate = firstReleaseDate.addDays(i * data.vestingInterval);
                var vestingTimestamp = vestingDate.getTime()/1000;
                console.log("vesingDate:", vestingDate, "vestingTimestamp:", vestingTimestamp, "vestingAmountWei:", vestingAmountWei);

                // transferWithLock
                console.log("address:", data.address, "vestingAmountWei:", vestingAmountWei, "vestingTimestamp:", vestingTimestamp);
                const transferTx = await ptc.transferWithLock(data.address, BigInt(vestingAmountWei), BigInt(vestingTimestamp))
                console.log('TST2 transferWithLock', transferTx.tx)
                fileLog.writeln(util.format("\t%d/%d", i + 1, data.vestingCount));
                fileLog.writeln(util.format("\tvestringDate=%s, vestingAmount=%d", toStringByFormatting(vestingDate), vestingAmount));
                fileLog.writeln(util.format("\ttransferWithLock(%s, %s, %s)", data.address, vestingAmountWei, vestingTimestamp));
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
