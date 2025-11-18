window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(chrome.runtime.getURL('json/achievements.json'));
    const achievements = await res.json();
    const container = document.getElementById('achievements-container');

    achievements.forEach(({ id, target }) => {
      const box = document.createElement('div');
      box.className = 'white-box hidden';
      box.id = `${id}-box`;

      const status = document.createElement('span');
      status.id = id;
      status.className = 'yellow-box incomplete';
      status.textContent = 'Incomplete';

      const leftText = document.createElement('div');
      leftText.className = 'left-text';

      const idNum = parseInt(id.replace(/\D/g, ''), 10);

      if (idNum >= 7) {
        leftText.innerHTML = `Get ${target.toLocaleString()}<br>CoCoNuT`;
        status.classList.add('yellow-box-lowerr');
      } else if (idNum >= 5) {
        leftText.innerHTML = `Get ${target.toLocaleString()}<br>CoCoNuT`;
        status.classList.add('yellow-box-lower');
      } else {
        leftText.textContent = `Get ${target.toLocaleString()} CoCoNuT`;
      }

      box.appendChild(leftText);
      box.appendChild(status);
      container.appendChild(box);
    });

    chrome.storage.local.get(
      ['count', ...achievements.map(a => a.countKey), ...achievements.map(a => a.shownKey)],
      (result) => {
        const currentCount = result.count || 0;

        achievements.forEach(({ id, countKey, shownKey, target }, index) => {
          const element = document.getElementById(id);
          const box = element?.parentElement;
          if (!box) return;

          const wasComplete = result[countKey] || false;
          const wasShown = result[shownKey] || false;
          const isNowComplete = currentCount >= target;

          // 🔁 표시 조건 처리
          if (id === 'achv7') {
            if (wasShown || index === 0 || result[achievements[index - 1].shownKey]) {
              box.style.display = 'block';
            } else {
              box.style.display = 'none';
            }
          } else {
            if (index === 0 || result[achievements[index - 1].shownKey]) {
              box.style.display = 'block';
            } else {
              box.style.display = 'none';
            }
            if (wasShown) box.style.display = 'none';
          }

          if (isNowComplete) {
            if (!wasComplete) {
              chrome.storage.local.set({ [countKey]: true }, () => {
                chrome.runtime.sendMessage({ type: 'achievement-earned', achievementId: id });
              });
            }

            // 처음엔 무조건 'Complete' 텍스트로
            element.innerText = 'Complete';
            element.classList.add('complete');
            element.classList.remove('incomplete');

            if (!element.dataset.bound) {
              element.addEventListener('click', () => {
                chrome.storage.local.set({ [shownKey]: true }, () => {
                  const next = achievements[index + 1];

                  if (id === 'achv7') {
                    // 클릭했을 때만 Completed로 전환
                    element.innerText = 'Completed';
                    return;
                  }

                  // 나머진 클릭 시 숨김
                  box.style.display = 'none';
                  if (next) {
                    const nextBox = document.getElementById(next.id)?.parentElement;
                    if (nextBox) nextBox.style.display = 'block';
                  }
                });
              });
              element.dataset.bound = 'true';
            }
          } else {
            element.innerText = 'Incomplete';
            element.classList.remove('complete');
            element.classList.add('incomplete');
            chrome.storage.local.set({ [countKey]: false });
          }
        });
      }
    );
  } catch (error) {
    console.error('Error loading achievements:', error);
  }
});
