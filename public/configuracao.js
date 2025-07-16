let configuracaoDificuldade = {};
let faixasScore = [];

const listaEstoque = document.getElementById('lista-estoque');
const faixasContainer = document.getElementById('faixas-container');
const selectBrindeFaixa = document.getElementById('brinde-faixa');
const resumoDiv = document.getElementById('resumo-config');

// Carrega estoque
carregarEstoque();

function carregarEstoque() {
  fetch('/estoque')
    .then(res => res.json())
    .then(estoque => {
      listaEstoque.innerHTML = '';
      selectBrindeFaixa.innerHTML = '';

      estoque.forEach((brinde, index) => {
        const imagemTag = brinde.imagem
          ? `<img src="./assets/brindes/${brinde.imagem}" alt="${brinde.nome}" style="width: 40px; height: 40px; vertical-align: middle; margin-right: 10px; border-radius: 50%; object-fit: cover;">`
          : `<span style="color: red;">[sem imagem]</span>`;

        const div = document.createElement('div');
        div.style.marginBottom = '10px';
        div.innerHTML = `
  <div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="display: flex; align-items: center;">
      ${imagemTag}
      <strong id="nome-brinde-${index}">${brinde.nome}</strong>
    </div>
    <div style="display: flex; flex-direction: column;">
      <div>
        Quantidade:
        <input type="number" id="quant-${index}" value="${brinde.quantidade}" style="width: 60px; margin-right: 10px;">
        <button onclick="atualizarQuantidade(${index}, '${brinde.nome}')">Atualizar</button>
      </div>
      <div class="btn-editar-remover">
        <button onclick="editarNomeBrinde('${brinde.nome}')">✏️ Editar Nome</button>
        <button onclick="removerBrinde('${brinde.nome}')">🗑️ Remover</button>
      </div>
    </div>
  </div>
`;

        carregarConfiguracaoSalva(); // 👈 nova função

        function carregarConfiguracaoSalva() {
          fetch('/configuracao')
            .then(res => res.json())
            .then(config => {
              if (!config || !config.dificuldade) return;

              configuracaoDificuldade = config.dificuldade;
              faixasScore = config.faixasScore || [];

              // Marcar o botão correspondente
              resetarBotoes();
              const botao = document.getElementById(`btn-${configuracaoDificuldade.dificuldade}`);
              if (botao) {
                botao.classList.add('ativo');
                document.getElementById('personalizado').style.display = 'none';
              } else {
                // Caso seja personalizado
                document.getElementById('btn-perso').classList.add('ativo');
                document.getElementById('personalizado').style.display = 'block';
                document.getElementById('tempo').value = configuracaoDificuldade.tempo;
                document.getElementById('tempo-mem').value = configuracaoDificuldade.tempoMemorizacao;
              }

              // Atualiza resumo e lista de faixas
              atualizarResumo();
              atualizarFaixas();
            })
            .catch(() => {
              resumoDiv.innerHTML = 'Erro ao carregar configuração salva.';
            });
        }


        carregarRegistros(); // 
        function carregarRegistros() {
          fetch('/registros')
            .then(res => res.json())
            .then(registros => {
              const container = document.getElementById('lista-registros');
              const contador = document.getElementById('contador-registros');

              if (!registros || registros.length === 0) {
                container.innerHTML = '<em>Nenhum registro encontrado.</em>';
                contador.textContent = '0';
                return;
              }

              container.innerHTML = '';
              contador.textContent = registros.length; // 👈 define o número total

              registros.reverse().forEach((jogo, i) => {
                const div = document.createElement('div');
                div.style.borderBottom = '1px solid #ccc';
                div.style.padding = '8px 0';

                div.innerHTML = `
          <strong>${jogo.nome || `Jogo ${registros.length - i}`}</strong><br>
          Início: ${formatarData(jogo.horarioInicio)} | Fim: ${formatarData(jogo.horarioFim)}<br>
          Combinações: ${jogo.combinacoesCorretas} | Tempo total: ${jogo.temposPorRodada?.[0] || '-'}s<br>
          Brinde: <strong>${jogo.brinde}</strong> | Rodadas: ${jogo.rodadasConcluidas}
        `;
                container.appendChild(div);
              });
            })
            .catch(() => {
              document.getElementById('lista-registros').innerHTML = '<span style="color:red">Erro ao carregar registros.</span>';
            });
        }


        function formatarData(iso) {
          const d = new Date(iso);
          return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        }


        function formatarData(iso) {
          const d = new Date(iso);
          return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
        }


        listaEstoque.appendChild(div);

        const option = document.createElement('option');
        option.value = brinde.nome;
        option.innerText = brinde.nome;
        option.dataset.imagem = brinde.imagem;

        selectBrindeFaixa.appendChild(option);
      });

    })
    .catch(() => {
      listaEstoque.innerHTML = 'Erro ao carregar estoque.';
    });
}



function abrirSeletorImagem() {
  const container = document.getElementById('lista-imagens');
  container.innerHTML = '';
  container.style.display = 'flex';

  fetch('/listar-brindes')
    .then(res => res.json())
    .then(imagens => {
      imagens.forEach(nome => {
        const img = document.createElement('img');
        img.src = `./assets/brindes/${nome}`;
        img.alt = nome;
        img.title = nome;
        img.onclick = () => selecionarImagemBrinde(nome);
        container.appendChild(img);
      });
    })
    .catch(() => {
      container.innerHTML = 'Erro ao carregar imagens.';
    });
}


function editarNomeBrinde(nomeAntigo) {
  const novoNome = prompt(`Digite o novo nome para "${nomeAntigo}":`);
  if (!novoNome || novoNome.trim() === '') return alert('Nome inválido.');

  fetch('/estoque/editar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nomeAntigo, nomeNovo: novoNome.trim() })
  })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      carregarEstoque();
    })
    .catch(() => alert('Erro ao editar nome.'));
}

function removerBrinde(nome) {
  if (!confirm(`Tem certeza que deseja remover o brinde "${nome}"?`)) return;

  fetch('/estoque/remover', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome })
  })
    .then(res => res.text())
    .then(msg => {
      alert(msg);
      carregarEstoque();
    })
    .catch(() => alert('Erro ao remover brinde.'));
}


function selecionarImagemBrinde(nome) {
  document.getElementById('imagem-brinde').value = nome;
  document.getElementById('imagem-selecionada-texto').textContent = `Imagem selecionada: ${nome}`;
  document.getElementById('lista-imagens').style.display = 'none';
}


function resetarBotoes() {
  document.querySelectorAll('.botoes-dificuldade button').forEach(btn => {
    btn.classList.remove('ativo');
  });
}

function setDificuldade(nivel) {
  resetarBotoes();
  document.getElementById(`btn-${nivel}`).classList.add('ativo');

  switch (nivel) {
    case 'facil':
      configuracaoDificuldade = {
        cartas: 16,
        tempo: 120,
        tempoMemorizacao: 3,
        dificuldade: 'facil',
        bonusTempo: 15
      };
      break;
    case 'medio':
      configuracaoDificuldade = {
        cartas: 16,
        tempo: 120,
        tempoMemorizacao: 2,
        dificuldade: 'medio',
        bonusTempo: 10
      };
      break;
    case 'dificil':
      configuracaoDificuldade = {
        cartas: 16,
        tempo: 120,
        tempoMemorizacao: 1,
        dificuldade: 'dificil',
        bonusTempo: 5
      };
      break;
  }

  document.getElementById('personalizado').style.display = 'none';
  atualizarResumo();
}

function mostrarPersonalizado() {
  resetarBotoes();
  document.getElementById('btn-perso').classList.add('ativo');
  document.getElementById('personalizado').style.display = 'block';
  configuracaoDificuldade = {};
  atualizarResumo();
}

function adicionarFaixa() {
  const minInput = document.getElementById('score-min');
  const maxInput = document.getElementById('score-max');
  const brindeSelect = document.getElementById('brinde-faixa');

  const min = parseInt(minInput.value);
  const max = parseInt(maxInput.value);
  const brinde = brindeSelect.value;

  // Reset visual
  minInput.style.borderColor = '';
  maxInput.style.borderColor = '';
  brindeSelect.style.borderColor = '';

  // Validação
  let valido = true;
  if (isNaN(min)) {
    minInput.style.borderColor = 'red';
    valido = false;
  }
  if (isNaN(max) || max < min) {
    maxInput.style.borderColor = 'red';
    valido = false;
  }
  if (!brinde) {
    brindeSelect.style.borderColor = 'red';
    valido = false;
  }

  if (!valido) {
    alert('Preencha corretamente a faixa de score.');
    return;
  }

  const estoqueBrinde = Array.from(selectBrindeFaixa.options).find(opt => opt.value === brinde);
  const imagemBrinde = estoqueBrinde?.dataset.imagem || 'sem-imagem.png';
  faixasScore.push({ min, max, brinde, imagem: imagemBrinde });
  atualizarFaixas();
  atualizarResumo();

  // Limpar campos
  minInput.value = '';
  maxInput.value = '';
  brindeSelect.selectedIndex = 0;
}


function atualizarFaixas() {
  faixasContainer.innerHTML = '';

  faixasScore.forEach((faixa, index) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.padding = '10px';
    div.style.marginBottom = '10px';
    div.style.border = '1px solid #ccc';
    div.style.borderRadius = '8px';
    div.style.background = '#f9f9f9';

    const img = document.createElement('img');
    img.src = `./assets/brindes/${faixa.imagem}`;
    img.alt = faixa.brinde;
    img.style.width = '50px';
    img.style.height = '50px';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    img.style.marginRight = '15px';

    const texto = document.createElement('div');
    texto.innerHTML = `
      <strong>${faixa.brinde}</strong><br>
      Score de <strong>${faixa.min}</strong> até <strong>${faixa.max}</strong>
    `;

    const botao = document.createElement('button');
    botao.innerText = 'Remover';
    botao.onclick = () => removerFaixa(index);

    const blocoEsquerda = document.createElement('div');
    blocoEsquerda.style.display = 'flex';
    blocoEsquerda.style.alignItems = 'center';
    blocoEsquerda.appendChild(img);
    blocoEsquerda.appendChild(texto);

    div.appendChild(blocoEsquerda);
    div.appendChild(botao);

    faixasContainer.appendChild(div);
  });
}


function removerFaixa(index) {
  faixasScore.splice(index, 1);
  atualizarFaixas();
  atualizarResumo();
}

function adicionarBrinde() {
  const nome = document.getElementById('nome-brinde').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade-brinde').value);
  const imagem = document.getElementById('imagem-brinde').value.trim();

  if (!nome || isNaN(quantidade) || quantidade <= 0 || !imagem) {
    alert('Preencha corretamente o nome, quantidade e imagem.');
    return;
  }

  fetch('/estoque')
    .then(res => res.json())
    .then(estoque => {
      estoque.push({ nome, quantidade, imagem });
      return fetch('/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estoque)
      });
    })
    .then(() => {
      document.getElementById('nome-brinde').value = '';
      document.getElementById('quantidade-brinde').value = '';
      document.getElementById('imagem-brinde').value = '';
      carregarEstoque();
    })
    .catch(() => alert('Erro ao salvar o estoque.'));
}


function salvarConfiguracao() {
  if (document.getElementById('personalizado').style.display === 'block') {
    const tempo = parseInt(document.getElementById('tempo').value);
    const tempoMem = parseInt(document.getElementById('tempo-mem').value);

    if (isNaN(tempo) || isNaN(tempoMem)) {
      alert('Complete todos os campos personalizados.');
      return;
    }

    configuracaoDificuldade = {
      tempo,
      tempoMemorizacao: tempoMem,
      cartas: 16,
      bonusTempo: 5,
      dificuldade: 'personalizado',
    };
  }

  if (!configuracaoDificuldade.tempo) {
    alert('Configure a dificuldade.');
    return;
  }

  if (faixasScore.length === 0) {
    alert('Adicione pelo menos uma faixa de brinde.');
    return;
  }

  fetch('/configuracao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dificuldade: configuracaoDificuldade,
      faixasScore: faixasScore
    })
  })
    .then(() => {
      alert('Configuração salva com sucesso!');
      atualizarResumo();
    })
    .catch(() => alert('Erro ao salvar configuração.'));
}


function resetarConfiguracao() {
  configuracaoDificuldade = {};
  faixasScore = [];
  document.getElementById('personalizado').style.display = 'none';
  document.querySelectorAll('input').forEach(input => input.value = '');
  resetarBotoes();
  atualizarFaixas();
  atualizarResumo();
  alert('Configuração reiniciada.');
}

function irParaJogo() {
  window.location.href = 'start.html';

}

function atualizarQuantidade(index, nomeBrinde) {
  const novaQuantidade = parseInt(document.getElementById(`quant-${index}`).value);
  if (isNaN(novaQuantidade) || novaQuantidade < 0) {
    alert('Digite uma quantidade válida.');
    return;
  }

  fetch('/estoque')
    .then(res => res.json())
    .then(estoque => {
      const item = estoque.find(b => b.nome === nomeBrinde);
      if (item) item.quantidade = novaQuantidade;

      return fetch('/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estoque)
      });
    })
    .then(() => {
      alert('Estoque atualizado com sucesso!');
      carregarEstoque();
    })
    .catch(() => alert('Erro ao atualizar estoque.'));
}



function atualizarResumo() {
  if (!configuracaoDificuldade || Object.keys(configuracaoDificuldade).length === 0) {
    resumoDiv.innerHTML = 'Nenhuma configuração definida ainda.';
    return;
  }

  const d = configuracaoDificuldade;
  resumoDiv.innerHTML = `
    <strong>Dificuldade:</strong> ${d.dificuldade}<br>
    <strong>Cartas (pares):</strong> ${d.cartas} | Total ${d.cartas + d.cartas} cartas  <br>
    <strong>Tempo total:</strong> ${d.tempo}s | <strong>Memorização:</strong> ${d.tempoMemorizacao}s<br>
    <strong>Faixas de Score:</strong> ${faixasScore.length} definidas
  `;
}
