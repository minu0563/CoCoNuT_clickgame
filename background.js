// background.js

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("updateStock", { periodInMinutes: 0.1 }); // 약 6초마다
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updateStock") {
    chrome.storage.local.get(["money", "timeLabels", "stockPrices"], (data) => {
      let money = data.money ?? 10000;
      let timeLabels = data.timeLabels ?? [];
      let stockPrices = data.stockPrices ?? [];

      const point = Math.floor(Math.random() * 1000) + 10;
      money += Math.random() < 0.5 ? point : -point;
      if (money < 0) money = 0;

      const now = new Date();
      const label = now.getHours().toString().padStart(2, "0") + ":" + 
                    now.getMinutes().toString().padStart(2, "0") + ":" + 
                    now.getSeconds().toString().padStart(2, "0");
      timeLabels.push(label);
      stockPrices.push(money);

      if (timeLabels.length > 15) {
        timeLabels.shift();
        stockPrices.shift();
      }

      chrome.storage.local.set({ money, timeLabels, stockPrices });
    });
  }
});

// -------------- 업적 깜빡임 상태 관리 --------------

let achievementBlinking = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'achievement-earned') {
    // 모든 탭에 message 전송
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'start-blinking' }, () => {
            // 오류 무시: 연결된 리스너가 없어도 무시 (content.js 없을 수도 있음)
            if (chrome.runtime.lastError) {
              // console.log("메시지 수신자 없음: " + chrome.runtime.lastError.message);
            }
          });
        }
      }
    });
  }

  if (message.type === 'get-blinking-status') {
    sendResponse({ blinking: achievementBlinking });
  }

  return true; // async sendResponse 지원
});

