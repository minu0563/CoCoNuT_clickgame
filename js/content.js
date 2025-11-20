function formatNumber(num) {
  return num.toLocaleString('en-US');
}

function updateDisplay(value) {
  document.getElementById('cost').innerText = formatNumber(value);
  const bottomCost = document.getElementById('cost-bottom');
  if (bottomCost) bottomCost.innerText = formatNumber(value);
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
});

function count(type) {
  const resultElement = document.getElementById('cost');
  let number = parseInt(resultElement.innerText.replace(/,/g, ''));

  chrome.storage.local.get(['clickGain'], (result) => {
    const gain = result.clickGain || 1;

    if (type === 'plus') {
      number += gain;
      showGainText(`+${gain}`);
    }

    resultElement.innerText = formatNumber(number);
    saveValue(number);
    checkAndNotifyAchievements(number);
  });
}
