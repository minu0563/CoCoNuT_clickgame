let rewardMultiplier = 10000;

function setRewardMultiplier(newMultiplier) {
  rewardMultiplier = newMultiplier;
}

function updatePlayBar(count, color = "green") {
  const percentage = (count / 10) * 100;
  const fill = document.getElementById("play-bar-fill");
  fill.style.width = `${percentage}%`;
  fill.style.backgroundColor = color;
  document.getElementById("play-bar-text").innerText = `${count} / 10`;
}

document.addEventListener("DOMContentLoaded", () => {
  const slots = [
    document.getElementById("slot1"),
    document.getElementById("slot2"),
    document.getElementById("slot3"),
  ];
  const result = document.getElementById("result");
  const playButton = document.getElementById("play-button");
  const input = document.getElementById("casinoinput");

  let playCount = 0;
  let useLimitedRange = false;
  let limitedRangeOnce = false;

  loadValue();

  playButton.addEventListener("click", () => {
    const betAmount = Number(input.value);
    if (!betAmount || betAmount < 1) {
      result.textContent = "Please feed me at least one coconut!";
      result.style.color = "red";
      return;
    }

    chrome.storage.local.get(['count'], (data) => {
      const currentCoconuts = data.count || 0;
      if (betAmount > currentCoconuts) {
        result.textContent = "Not enough coconuts!";
        result.style.color = "red";
        return;
      }

      result.style.color = "";
      spin(betAmount, currentCoconuts);
    });
  });

  function getRandomImage() {
    const max = useLimitedRange ? 4 : 10;
    const index = Math.floor(Math.random() * max);
    return `../images/coco${index}.png`;
  }

  function spin(betAmount, currentCoconuts) {
    playButton.disabled = true;
    result.textContent = "";
    result.classList.remove("jackpot");

    const chosen = [null, null, null];
    const delays = [0, 100, 200];
    let completedSpins = 0;

    for (let i = 0; i < 3; i++) {
      animateSlot(i, delays[i]);
    }

    function animateSlot(index, delayOffset) {
      const slot = slots[index];
      const totalSpins = 20;
      let spinIndex = 0;
      let delay = 50;

      function spinStep() {
        slot.src = getRandomImage();
        spinIndex++;
        if (spinIndex < totalSpins) {
          delay = spinIndex < 15 ? 50 : delay + 25;
          setTimeout(spinStep, delay);
        } else {
          const finalImage = getRandomImage();
          slot.src = finalImage;
          chosen[index] = finalImage;

          completedSpins++;
          if (completedSpins === 3) {
            let newTotal = currentCoconuts;
            if (chosen[0] === chosen[1] && chosen[1] === chosen[2]) {
              const reward = betAmount * rewardMultiplier;
              newTotal += reward;
              result.textContent = `+${reward} coconut! ^^`;
              result.classList.add("jackpot");
              result.style.color = "green";
            } else {
              newTotal -= betAmount;
              result.textContent = `-${betAmount} coconut! T.T`;
              result.classList.remove("jackpot");
              result.style.color = "red";
            }

            chrome.storage.local.set({ count: newTotal }, () => {
              document.getElementById('cost').innerText = newTotal;
              const bottomCost = document.getElementById('cost-bottom');
              if (bottomCost) bottomCost.innerText = newTotal;
              playButton.disabled = false;
            });

            playCount++;
            if (playCount === 10 && !limitedRangeOnce) {
              useLimitedRange = true;
              updatePlayBar(playCount, "yellow");
              limitedRangeOnce = true;
            } else if (playCount > 10) {
              playCount = 0;
              useLimitedRange = false;
              limitedRangeOnce = false;
              updatePlayBar(playCount, "green");
            } else {
              useLimitedRange = false;
              updatePlayBar(playCount, "green");
            }

            chrome.storage.local.set({ playCount });
          }
        }
      }
      setTimeout(spinStep, delayOffset);
    }
  }

  function loadValue() {
    chrome.storage.local.get(['count', 'playCount'], (result) => {
      const value = result.count || 0;
      playCount = result.playCount || 0;
      updatePlayBar(playCount, playCount === 10 ? "yellow" : "green");
      document.getElementById('cost').innerText = value;
      const bottomCost = document.getElementById('cost-bottom');
      if (bottomCost) bottomCost.innerText = value;
    });
  }
});
