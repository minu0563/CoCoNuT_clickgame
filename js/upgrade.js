document.addEventListener('DOMContentLoaded', () => {
  const upgradeBtn = document.getElementById('upgrade-button');
  const gainTextElement = upgradeBtn?.nextElementSibling;
  const upgradeCostElement = document.getElementById('upgrade-cost');
  const currentClickGainElement = document.getElementById('current-click-gain');
  const warningElement = document.getElementById('result');
  const clickGainElement = document.getElementById('click-gain');

  function updateDisplay(baseClickGain, premiumBonus, extraClickGain, currentCoconuts) {
    const totalClickGain = baseClickGain + premiumBonus + extraClickGain;
    const nextClickGain = baseClickGain + 1;

    const upgradeCost = baseClickGain >= 30
      ? nextClickGain * 35 + baseClickGain * baseClickGain
      : nextClickGain * 35 + baseClickGain * baseClickGain * 20;

    if (gainTextElement) {
      gainTextElement.textContent = `Raise your coconut yield by +${nextClickGain} per click.`;
    }

    if (upgradeCostElement) {
      upgradeCostElement.textContent = upgradeCost.toFixed(2);
    }

    if (currentClickGainElement) {
      currentClickGainElement.textContent = `+${totalClickGain}`;
    }

    if (clickGainElement) {
      clickGainElement.textContent = `+${totalClickGain}`;
    }

    const countEl = document.getElementById('cost');
    if (countEl) {
      countEl.innerText = currentCoconuts;
    }
  }

  chrome.storage.local.get(['baseClickGain', 'premiumBonus', 'extraClickGain', 'count'], (result) => {
    const baseClickGain = result.baseClickGain || 1;
    const premiumBonus = result.premiumBonus || 0;
    const extraClickGain = result.extraClickGain || 0;
    const currentCoconuts = result.count || 0;

    updateDisplay(baseClickGain, premiumBonus, extraClickGain, currentCoconuts);
  });

  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      chrome.storage.local.get(['baseClickGain', 'premiumBonus', 'extraClickGain', 'count'], (result) => {
        let baseClickGain = result.baseClickGain || 1;
        const premiumBonus = result.premiumBonus || 0;
        const extraClickGain = result.extraClickGain || 0;
        let currentCoconuts = result.count || 0;

        const nextClickGain = baseClickGain + 1;
        const upgradeCost = baseClickGain >= 30
          ? nextClickGain * 35 + baseClickGain * baseClickGain
          : nextClickGain * 35 + baseClickGain * baseClickGain * 20;

        if (currentCoconuts < upgradeCost) {
          if (warningElement) {
            warningElement.textContent = `Not enough coconuts! You need ${upgradeCost.toFixed(2)} coconuts to upgrade!!`;
            warningElement.style.display = 'block';
          }
          return;
        }

        baseClickGain++;
        currentCoconuts -= upgradeCost;

        const newClickGain = baseClickGain + premiumBonus + extraClickGain;

        chrome.storage.local.set({
          baseClickGain,
          clickGain: newClickGain,
          count: currentCoconuts
        }, () => {
          updateDisplay(baseClickGain, premiumBonus, extraClickGain, currentCoconuts);
        });
      });
    });
  }

  const increaseClickGainButtons = [
    { id: 'increase-click-gain-1', amount: 1, cost: 50, resultId: 'result-1' },
    { id: 'increase-click-gain-2', amount: 5, cost: 200, resultId: 'result-2' },
    { id: 'increase-click-gain-3', amount: 25, cost: 1000, resultId: 'result-3' },
    { id: 'increase-click-gain-4', amount: 125, cost: 5000, resultId: 'result-4' },
    { id: 'increase-click-gain-5', amount: 600, cost: 20000, resultId: 'result-5' },
    { id: 'increase-click-gain-6', amount: 5000, cost: 100000, resultId: 'result-6' },
    { id: 'increase-click-gain-7', amount: 25000, cost: 500000, resultId: 'result-7' },
    { id: 'increase-click-gain-8', amount: 60000, cost: 1000000, resultId: 'result-8' },
    { id: 'increase-click-gain-9', amount: 150000, cost: 5000000, resultId: 'result-9' },
    { id: 'increase-click-gain-10', amount: 3000000, cost: 20000000, resultId: 'result-10' },
    { id: 'increase-click-gain-11', amount: 10000000, cost: 300000000, resultId: 'result-11' },
    { id: 'increase-click-gain-12', amount: 5000000000, cost: 150000000000, resultId: 'result-12' }
  ];

  increaseClickGainButtons.forEach((button) => {
    const btn = document.getElementById(button.id);
    const resultEl = document.getElementById(button.resultId);

    if (btn) {
      btn.addEventListener('click', () => {
        chrome.storage.local.get(['baseClickGain', 'extraClickGain', 'premiumBonus', 'count'], (result) => {
          const baseClickGain = result.baseClickGain || 1;
          const premiumBonus = result.premiumBonus || 0;
          let extraClickGain = result.extraClickGain || 0;
          let currentCoconuts = result.count || 0;

          if (currentCoconuts < button.cost) {
            if (resultEl) {
              resultEl.textContent = `You need ${button.cost} coconuts to increase +${button.amount} per click!`;
              resultEl.style.color = 'red';
            }
            return;
          }

          extraClickGain += button.amount;
          currentCoconuts -= button.cost;

          const newClickGain = baseClickGain + premiumBonus + extraClickGain;

          chrome.storage.local.set({
            extraClickGain,
            clickGain: newClickGain,
            count: currentCoconuts
          }, () => {
            if (resultEl) {
              resultEl.textContent = `Success! You now gain +${newClickGain} per click.`;
              resultEl.style.color = 'green';
            }

            updateDisplay(baseClickGain, premiumBonus, extraClickGain, currentCoconuts);
          });
        });
      });
    }
  });
});
