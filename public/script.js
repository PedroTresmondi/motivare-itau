const configuracoes = {}; // Guarda as configurações por rodada
const listaEstoque = document.getElementById('lista-estoque');
const configuracaoDiv = document.getElementById('configuracao');

// Primeiro carrega o estoque e só depois monta as rodadas
carregarEstoque();

function carregarEstoque() {
  fetch('/estoque')
    .then(res => res.json())
    .then(estoque => {
      listaEstoque.innerHTML = '';
      estoque.forEach((brinde) => {
        const div = document.createElement('div');
        div.innerText = `${brinde.nome} - Quantidade: ${brinde.quantidade}`;
        listaEstoque.appendChild(div);
      });
      montarConfiguracaoRodadas(estoque);
    })
    .catch(() => {
      listaEstoque.innerHTML = 'Erro ao carregar estoque.';
    });
}

function montarConfiguracaoRodadas(estoque) {
  configuracaoDiv.innerHTML = '';

  for (let i = 1; i <= 4; i++) {
    const bloco = document.createElement('div');
    bloco.innerHTML = `
      <h2>Rodada ${i}</h2>
      <button onclick="setDificuldade(${i}, 'facil')">Fácil</button>
      <button onclick="setDificuldade(${i}, 'medio')">Médio</button>
      <button onclick="setDificuldade(${i}, 'dificil')">Difícil</button>
      <button onclick="togglePersonalizado(${i})">Personalizado</button>

      <div id="personalizado-${i}" style="display:none;">
        <label>Vidas: <input type="number" id="vidas-${i}" min="1"></label><br>
        <label>Cartas (par): <input type="number" id="cartas-${i}" min="4" step="2"></label><br>
        <label>Tempo (segundos): <input type="number" id="tempo-${i}" min="10"></label><br>
        <label>Tempo de Memorização (segundos): <input type="number" id="tempo-mem-${i}" min="1"></label><br>
      </div>

      <label>Brinde desta rodada:
        <select id="brinde-${i}">
          ${estoque.map(b => `<option value="${b.nome}">${b.nome}</option>`).join('')}
        </select>
      </label>
      <hr>
    `;
    configuracaoDiv.appendChild(bloco);
  }
}

function setDificuldade(rodada, nivel) {
  let config;

  switch (nivel) {
    case 'facil':
      config = { vidas: 5, cartas: 8, tempo: 60, tempoMemorizacao: 3 };
      break;
    case 'medio':
      config = { vidas: 3, cartas: 12, tempo: 90, tempoMemorizacao: 2 };
      break;
    case 'dificil':
      config = { vidas: 2, cartas: 16, tempo: 120, tempoMemorizacao: 1 };
      break;
  }

  configuracoes[rodada] = config;
  document.getElementById(`personalizado-${rodada}`).style.display = 'none';
}

function togglePersonalizado(rodada) {
  document.getElementById(`personalizado-${rodada}`).style.display = 'block';
  configuracoes[rodada] = null;
}

function adicionarBrinde() {
  const nome = document.getElementById('nome-brinde').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade-brinde').value);

  if (!nome || isNaN(quantidade) || quantidade <= 0) {
    alert('Preencha corretamente o nome e a quantidade.');
    return;
  }

  fetch('/estoque')
    .then(res => res.json())
    .then(estoque => {
      estoque.push({ nome, quantidade });
      return fetch('/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estoque)
      });
    })
    .then(() => {
      document.getElementById('nome-brinde').value = '';
      document.getElementById('quantidade-brinde').value = '';
      carregarEstoque();
    })
    .catch(() => alert('Erro ao salvar o estoque.'));
}

// Torna a função global para o onclick do HTML funcionar
window.adicionarBrinde = adicionarBrinde;

function iniciarJogo() {
  const finalConfig = [];

  for (let i = 1; i <= 4; i++) {
    let configRodada;

    if (configuracoes[i]) {
      configRodada = configuracoes[i];
    } else {
      const vidas = parseInt(document.getElementById(`vidas-${i}`).value);
      const cartas = parseInt(document.getElementById(`cartas-${i}`).value);
      const tempo = parseInt(document.getElementById(`tempo-${i}`).value);
      const tempoMem = parseInt(document.getElementById(`tempo-mem-${i}`).value);

      if (isNaN(vidas) || vidas <= 0 || isNaN(cartas) || cartas < 4 || cartas % 2 !== 0 || isNaN(tempo) || tempo <= 0 || isNaN(tempoMem) || tempoMem <= 0) {
        alert(`Configuração inválida na Rodada ${i}`);
        return;
      }

      configRodada = { vidas, cartas, tempo, tempoMemorizacao: tempoMem };
    }

    const brinde = document.getElementById(`brinde-${i}`).value;
    configRodada.brinde = brinde;
    finalConfig.push(configRodada);
  }

  localStorage.setItem('configRodadas', JSON.stringify(finalConfig));
  localStorage.setItem('rodadaAtual', 0);
  localStorage.setItem('pontosJogo', 0);

  window.location.href = 'cadastro.html';
}
