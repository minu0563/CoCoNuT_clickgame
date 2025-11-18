const display = document.querySelector('#display');
const tooja = document.querySelector('#tooja');
const buy = document.querySelector('#buy');
const sell = document.querySelector('#sell');
const ju = document.querySelector('#jusic');
const sell_all = document.querySelector('#sell-all');
const resultElement = document.querySelector('#cost');
const profitElement = document.querySelector('#profit');

let jusic = 0;
let money = 10000;
let bill = 0;
let buyPrice = null;
let timeLabels = [];
let stockPrices = [];
let myChart;

chrome.storage.local.get(['count', 'jusic', 'money', 'timeLabels', 'stockPrices', 'buyPrice'], (result) => {
    bill = result.count ?? 0;
    jusic = result.jusic ?? 0;
    money = result.money ?? 10000;
    timeLabels = result.timeLabels ?? [];
    stockPrices = result.stockPrices ?? [];
    buyPrice = result.buyPrice ?? null;

    drawChart();
    updateChart();

    tooja.addEventListener('click', () => {
        clearMessages();
        if (bill >= money) {
            bill -= money;
            jusic++;
            if (buyPrice === null) buyPrice = money;
            saveAndUpdate();
            resultElement.innerHTML = bill;
        } else {
            showMessage("tooja-msg", "Not enough coconuts to invest.");
        }
    });

    buy.addEventListener('click', () => {
        clearMessages();
        if (bill >= money) {
            const x = parseInt(bill / money);
            jusic += x;
            bill -= money * x;
            if (buyPrice === null) buyPrice = money;
            saveAndUpdate();
            resultElement.innerHTML = bill;
        } else {
            showMessage("buy-msg", "Not enough coconuts to buy stocks.");
        }
    });

    sell.addEventListener('click', () => {
        clearMessages();
        if (jusic >= 1) {
            bill += money;
            jusic--;
            if (jusic === 0) buyPrice = null;
            saveAndUpdate();
            resultElement.innerHTML = bill;
        } else {
            showMessage("sell-msg", "You don’t have any stock to sell.");
        }
    });

    sell_all.addEventListener('click', () => {
        clearMessages();
        if (jusic > 0) {
            bill += money * jusic;
            jusic = 0;
            buyPrice = null;
            saveAndUpdate();
            resultElement.innerHTML = bill;
        } else {
            showMessage("sell-all-msg", "No stocks to sell.");
        }
    });

    function update() {
        ju.innerHTML = "Owned Stocks : " + jusic;
        display.innerHTML = money;
        updateProfit();
    }

    function saveAndUpdate() {
        chrome.storage.local.set({
            count: bill,
            jusic: jusic,
            money: money,
            timeLabels: timeLabels,
            stockPrices: stockPrices,
            buyPrice: buyPrice
        });
        update();
    }

    update();
});

function drawChart() {
    myChart = echarts.init(document.getElementById('chart'));
    const option = {
        title: { text: 'Stock Price Trend', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: timeLabels },
        yAxis: { type: 'value' },
        series: [{
            name: 'Balance',
            type: 'line',
            symbol: 'none',
            sampling: 'lttb',
            itemStyle: { color: 'rgb(255, 70, 131)' },
            data: stockPrices
        }]
    };
    myChart.setOption(option);
}

function updateChart() {
    myChart.setOption({
        xAxis: { data: timeLabels },
        series: [{ data: stockPrices }]
    });
}

function time() {
    let min, max, chance;
    if (money < 5000) {
        chance = Math.random();
        if (chance < 0.65) {
            min = 500;
            max = 2000;
            money += Math.floor(Math.random() * (max - min + 1) + min);
        } else {
            min = 500;
            max = 2000;
            money -= Math.floor(Math.random() * (max - min + 1) + min);
        }
    } else {
        min = money < 3000 ? 200 : money > 30000 ? 300 : 500;
        max = money < 3000 ? 1000 : money > 30000 ? 1200 : 2000;
        chance = Math.random();
        if (chance < 0.5) money += Math.floor(Math.random() * (max - min + 1) + min);
        else money -= Math.floor(Math.random() * (max - min + 1) + min);
    }
    if (money < 0) money = 0;

    chrome.storage.local.set({ money: money });

    const now = new Date();
    const timeLabel = now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');
    timeLabels.push(timeLabel);
    stockPrices.push(money);

    if (timeLabels.length > 15) {
        timeLabels.shift();
        stockPrices.shift();
    }

    updateChart();
    display.innerHTML = money;
    updateProfit();

    chrome.storage.local.set({
        timeLabels: timeLabels,
        stockPrices: stockPrices,
        money: money
    });
}

setInterval(time, 1500);

function showMessage(id, text, color = "red") {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = text;
        el.style.color = color;
        el.style.fontWeight = "bold";
    }
}

function clearMessages() {
    const ids = ["tooja-msg", "buy-msg", "sell-msg", "sell-all-msg"];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

function updateProfit() {
    if (buyPrice && profitElement) {
        const rate = ((money - buyPrice) / buyPrice) * 100;
        if (rate<0) profitElement.style.color = "red";
        else if (rate > 0) profitElement.style.color = "blue";
        profitElement.textContent = `Profit Rate: ${rate.toFixed(2)}%`;
    } else profitElement.textContent = "Profit Rate: -";
}
