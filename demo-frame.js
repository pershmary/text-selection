(() => {
  const canvas = document.getElementById('demo-canvas');
  const stage = document.getElementById('demo-stage');
  const roles = [
    { label: 'Дизайнер', name: 'Першина Мария', icon: 'designer.svg', height: 16 },
    { label: 'Разработчик Web', name: 'Красильников Андрей', icon: 'web.svg', height: 17 }
  ];
  const selectionScenarios = [
    { id: 'paragraphs', title: '2 абзаца' },
    { id: 'heading', title: 'Заголовок и абзац' },
    { id: 'callout', title: 'Абзац и инфоблок' },
    { id: 'image', title: 'Абзац и изображение' },
    { id: 'list-paragraph', title: 'Элемент списка и абзац' },
    { id: 'list-items', title: 'Элементы списка' },
    { id: 'table', title: 'Абзац и таблица' },
    { id: 'column', title: 'Абзац и колонка' },
    { id: 'column-widgets', title: 'Виджеты в колонках' }
  ];
  // Local file URLs have opaque origins; both pages also check the sender window.
  const stageOrigin = location.protocol === 'file:' ? '*' : location.origin;
  function showScenario(scenario) {
    stage.contentWindow.postMessage({ type: 'show-selection-scenario', scenario }, stageOrigin);
  }

  const frame = DemoFrame.mount({
    stage,
    viewport: canvas,
    panelWidth: 280,
    head: {
      title: 'Кросс-виджетное выделение',
      version: '27.1100',
      status: 'Без согласования. Является частью макета «Механики текстового редактора»'
    },
    devices: [
      { id: 'monitor', icon: 'monitor', label: 'Монитор', size: '1600×900', name: 'монитор' }
    ],
    scenarios: [
      { id: 'demo', title: 'Общее демо' },
      { group: 'Сценарии выделения', items: selectionScenarios }
    ],
    value: { scenario: 'demo' },
    onChange: ({ scenario }) => showScenario(scenario),
    team: roles
  });

  frame.panel.setAttribute('aria-label', 'Системная область');
  const scenarioHeading = frame.panel.querySelector('.df-group');
  const scenarioCard = scenarioHeading.parentElement;
  scenarioCard.classList.add('demo-selection-scenarios');
  scenarioHeading.id = 'selection-scenarios-heading';
  scenarioCard.removeAttribute('aria-label');
  scenarioCard.setAttribute('aria-labelledby', scenarioHeading.id);

  stage.addEventListener('load', () => {
    if (frame.value.scenario !== 'demo') showScenario(frame.value.scenario);
  });
  window.addEventListener('message', ({ source, origin, data }) => {
    if (source !== stage.contentWindow || (stageOrigin !== '*' && origin !== stageOrigin)) return;
    if (data?.type === 'selection-scenario-cleared' && data.scenario === frame.value.scenario) {
      frame.select('demo');
    }
  });
  const roleLabels = frame.panel.querySelectorAll('.df-team__label');
  roles.forEach((role, index) => {
    const icon = document.createElement('img');
    icon.src = 'assets/roles/' + role.icon;
    icon.alt = role.label;
    icon.width = 16;
    icon.height = role.height;
    roleLabels[index].title = role.label;
    roleLabels[index].replaceChildren(icon);
  });

  canvas.prepend(frame.root);
  frame.root.insertBefore(stage, frame.panel);
})();
