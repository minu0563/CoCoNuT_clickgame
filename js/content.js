// content.js

function updateDisplay(value) {
  document.getElementById('cost').innerText = value;
}

function saveValue(value) {
  chrome.storage.local.set({ count: value });
}

function loadValue() {
  chrome.storage.local.get(['count'], (result) => {
    const value = result.count || 0;
    updateDisplay(value);
  });
}

function showGainText(text) {
  const costElement = document.getElementById('cost');
  const gainText = document.createElement('div');
  gainText.innerText = text;
  gainText.className = 'gain-text';
  costElement.parentNode.insertBefore(gainText, costElement);

  setTimeout(() => {
    gainText.remove();
  }, 1000);
}

let blinkInterval = null;
const achievementMenu = document.querySelector('a[href="../html/Achievement.html"]');

function startBlinking() {
  if (blinkInterval || !achievementMenu) return;
  blinkInterval = setInterval(() => {
    achievementMenu.style.color = (achievementMenu.style.color === 'red') ? 'black' : 'red';
  }, 500);
}

function stopBlinking() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
  }
  if (achievementMenu) {
    achievementMenu.style.color = 'black';
  }
}

function checkAndNotifyAchievements(currentCount) {
  fetch(chrome.runtime.getURL('json/achievements.json'))
    .then(res => res.json())
    .then((achievements) => {
      const keys = [
        ...achievements.map(a => a.countKey),
        ...achievements.map(a => a.shownKey)
      ];

      chrome.storage.local.get(keys, (result) => {
        achievements.forEach(({ id, countKey, target }) => {
          const wasComplete = result[countKey] || false;
          const isNowComplete = currentCount >= target;

          if (isNowComplete && !wasComplete) {
            chrome.storage.local.set({ [countKey]: true }, () => {
              chrome.runtime.sendMessage({
                type: 'achievement-earned',
                achievementId: id
              });
              startBlinking();  // 현재 탭에서 즉시 깜빡임 시작
            });
          }
        });
      });
    });
}

document.addEventListener('DOMContentLoaded', () => {
  loadValue();

  const btn = document.getElementById('btn');
  if (btn) {
    btn.addEventListener('click', () => count('plus'));
  }

  // 로드 시에도 깜빡임 상태 체크
  const achievementIds = ['achv1', 'achv2', 'achv3', 'achv4', 'achv5', 'achv6', 'achv7'];
  const countKeys = achievementIds.map(id => `${id}Complete`);
  const shownKeys = achievementIds.map(id => `${id}Shown`);
  const allKeys = [...countKeys, ...shownKeys];

  chrome.storage.local.get(allKeys, (result) => {
    const shouldBlink = achievementIds.some(id => {
      const count = result[`${id}Complete`];
      const shown = result[`${id}Shown`];
      return count === true && shown !== true;
    });

    if (shouldBlink) {
      startBlinking();
    } else {
      stopBlinking();
    }
  });

  // 메시지 수신 대기
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'start-blinking') {
      startBlinking();
    }
  });
});



function count(type) {
  const resultElement = document.getElementById('cost');
  let number = parseInt(resultElement.innerText);

  chrome.storage.local.get(['clickGain'], (result) => {
    const gain = result.clickGain || 1;

    if (type === 'plus') {
      number += gain;
      showGainText(`+${gain}`);
    }

    resultElement.innerText = number;
    saveValue(number);

    // 업적 달성 체크 및 메시지 전송 호출
    checkAndNotifyAchievements(number);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadValue();

  const btn = document.getElementById('btn');
  if (btn) {
    btn.addEventListener('click', () => count('plus'));
  }

  // Achievement 메뉴 선택자
  const achievementMenu = document.querySelector('a[href="../html/Achievement.html"]');
  if (!achievementMenu) return;

  let blinkInterval = null;

  function startBlinking() {
    if (blinkInterval) return;
    blinkInterval = setInterval(() => {
      achievementMenu.style.color = (achievementMenu.style.color === 'red') ? 'black' : 'red';
    }, 500);
  }

  function stopBlinking() {
    if (blinkInterval) {
      clearInterval(blinkInterval);
      blinkInterval = null;
    }
    achievementMenu.style.color = 'black';
  }

  // 처음 로드 시에도 스토리지 상태를 확인하여 깜빡임 할지 결정
  const achievementIds = ['achv1', 'achv2', 'achv3', 'achv4', 'achv5', 'achv6', 'achv7'];
  const countKeys = achievementIds.map(id => `${id}Complete`);
  const shownKeys = achievementIds.map(id => `${id}Shown`);
  const allKeys = [...countKeys, ...shownKeys];

  chrome.storage.local.get(allKeys, (result) => {
    const shouldBlink = achievementIds.some(id => {
      const count = result[`${id}Complete`];
      const shown = result[`${id}Shown`];
      return count === true && shown !== true;
    });

    if (shouldBlink) {
      startBlinking();
    } else {
      stopBlinking();
    }
  });

  // 메시지 수신 대기 - 업적 달성 즉시 깜빡임 시작
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'start-blinking') {
      startBlinking();
    }
  });
});
