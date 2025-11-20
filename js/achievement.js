const achievementFiles = ['json/countofcoconuts.json'];

async function loadAchievements() {
  const mainContainer = document.getElementById('achievements-container');
  for (const file of achievementFiles) {
    const res = await fetch(chrome.runtime.getURL(file));
    const achievements = await res.json();

    const container = document.createElement('div');
    container.className = 'achievement-file-container';
    mainContainer.appendChild(container);

    achievements.forEach(a => createAchievementBox(a, container));

    chrome.storage.local.get(
      ['count', ...achievements.flatMap(a => [a.countKey, a.shownKey, a.id + 'Clicked'])],
      data => {
        const currentCount = data.count || 0;
        let firstVisibleIndex = achievements.findIndex(a => !data[a.id + 'Clicked']);
        if (firstVisibleIndex === -1) firstVisibleIndex = achievements.length - 1;

        achievements.forEach((a, index) =>
          updateAchievementStatus(a, currentCount, data, achievements, index, firstVisibleIndex)
        );
      }
    );
  }
}

function createAchievementBox(achievement, container) {
  const box = document.createElement('div');
  box.className = 'white-box';
  box.id = `${achievement.id}-box`;
  box.style.display = 'none';

  const status = document.createElement('span');
  status.id = achievement.id;
  status.className = 'yellow-box incomplete';
  status.textContent = 'Incomplete';

  const leftText = document.createElement('div');
  leftText.className = 'left-text';
  leftText.textContent = achievement.description || `Get ${achievement.target.toLocaleString()} points`;

  box.appendChild(leftText);
  box.appendChild(status);
  container.appendChild(box);
}

function updateAchievementStatus(achievement, currentCount, data, achievements, index, firstVisibleIndex) {
  const element = document.getElementById(achievement.id);
  const box = element?.parentElement;
  if (!box) return;

  const wasComplete = data[achievement.countKey] || false;
  const wasClicked = data[achievement.id + 'Clicked'] || false;
  const isNowComplete = currentCount >= achievement.target;
  const isLastAchievement = index === achievements.length - 1;

  if (isNowComplete) {
    if (!wasComplete) chrome.storage.local.set({ [achievement.countKey]: true });
    if (isLastAchievement && wasClicked) {
      element.innerText = 'Completed';
    } else {
      element.innerText = 'Complete';
    }
    element.classList.add('complete');
    element.classList.remove('incomplete');

    if (!element.dataset.bound) {
      element.addEventListener('click', () => {
        chrome.storage.local.set({ [achievement.id + 'Clicked']: true });
        const nextIndex = index + 1;
        if (nextIndex < achievements.length) {
          const nextBox = document.getElementById(achievements[nextIndex].id + '-box');
          if (nextBox) nextBox.style.display = 'block';
          box.style.display = 'none';
        } else {
          element.innerText = 'Completed';
        }
      });
      element.dataset.bound = 'true';
    }
  } else {
    element.innerText = 'Incomplete';
    element.classList.remove('complete');
    element.classList.add('incomplete');
  }

  if (isLastAchievement && wasClicked) {
    box.style.display = 'block';
    element.innerText = 'Completed';
  } else {
    box.style.display = (index === firstVisibleIndex && !wasClicked) ? 'block' : 'none';
  }
}

document.addEventListener('DOMContentLoaded', loadAchievements);
