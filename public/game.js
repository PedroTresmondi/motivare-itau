let dificuldade, faixasScore, tempo, tempoMem, totalPares;
let nome, horarioInicio;
let tempoRestante, timerInterval;
let paresEncontrados = 0, cartaVirada = null, bloqueado = true, score = 0;

let tabuleiro, acertosContainer, tempoTexto;

// Espera DOM carregar para iniciar fetch
window.addEventListener('DOMContentLoaded', () => {
  tabuleiro = document.getElementById('tabuleiro');
  acertosContainer = document.getElementById('acertos-container');
  tempoTexto = document.getElementById('tempo-texto');

  fetch('/configuracao')
    .then(res => res.json())
    .then(config => {
      dificuldade = config.dificuldade;
      faixasScore = config.faixasScore;

      tempo = dificuldade.tempo;
      tempoMem = dificuldade.tempoMemorizacao;
      totalPares = dificuldade.cartas;
      tempoRestante = tempo;

      nome = localStorage.getItem('nomeJogador') || 'Sem Nome';
      horarioInicio = localStorage.getItem('inicioJogo') || new Date().toISOString();

      initGame();
    })
    .catch(() => alert('Erro ao carregar configuração do jogo'));
});


function initGame() {
  atualizarTempo();
  atualizarAcertos();
  criarTabuleiro();
  mostrarContagemRegressiva();
}


function tocarSom(id) {
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function atualizarAcertos() {
  acertosContainer.textContent = (score * 1000).toLocaleString('pt-BR');
}

function atualizarTempo() {
  tempoTexto.textContent = formatarTempo(tempoRestante);
}

function formatarTempo(segundos) {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0');
  const s = (segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function animarPontuacao(valorAnterior, valorFinal) {
  const duration = 800;
  const frameRate = 30;
  const incremento = Math.ceil((valorFinal - valorAnterior) / (duration / (1000 / frameRate)));
  let atual = valorAnterior;

  const intervalo = setInterval(() => {
    atual += incremento;
    if (atual >= valorFinal) {
      atual = valorFinal;
      clearInterval(intervalo);
    }
    acertosContainer.textContent = atual.toLocaleString('pt-BR');
  }, 1000 / frameRate);
}

function embaralharImagens(n) {
  const imagens = [];
  for (let i = 1; i <= n; i++) imagens.push(i, i);
  for (let i = imagens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [imagens[i], imagens[j]] = [imagens[j], imagens[i]];
  }
  return imagens;
}

function criarTabuleiro() {
  const cartas = embaralharImagens(totalPares);
  tabuleiro.innerHTML = '';
  cartas.forEach((num) => {
    const div = document.createElement('div');
    div.classList.add('carta');
    div.dataset.imagem = `item${String(num).padStart(2, '0')}`;

    const frente = document.createElement('div');
    frente.classList.add('frente');
    const img = document.createElement('img');
    img.src = `./assets/cartas/image${String(num).padStart(2, '0')}.png`;
    img.alt = `Item ${num}`;
    img.classList.add('imagem-carta');
    frente.appendChild(img);

    const verso = document.createElement('div');
    verso.classList.add('verso');

    div.appendChild(frente);
    div.appendChild(verso);

    div.addEventListener('click', () => clicarCarta(div));
    tabuleiro.appendChild(div);
  });
}

function mostrarContagemRegressiva() {
  const overlay = document.createElement('div');
  overlay.id = 'overlay-contagem';
  overlay.style.position = 'fixed';
  overlay.style.inset = 0;
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.zIndex = 9999;
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.fontSize = '160px';
  overlay.style.color = 'white';
  overlay.style.fontWeight = 'bold';
  document.body.appendChild(overlay);

  const texto = document.createElement('div');
  texto.textContent = 'PREPARE-SE';
  texto.style.fontSize = '60px';
  texto.style.marginBottom = '20px';
  overlay.appendChild(texto);
  tocarSom('som-contagem-inicial');

  const numero = document.createElement('div');
  numero.textContent = '3';
  overlay.appendChild(numero);

  let contagem = 3;
  const intervalo = setInterval(() => {
    contagem--;
    if (contagem <= 0) {
      clearInterval(intervalo);
      overlay.remove();
      mostrarCartasTemporariamente();
    } else {
      numero.textContent = contagem;
    }
  }, 1000);
}

function mostrarCartasTemporariamente() {
  const cartas = document.querySelectorAll('.carta');
  cartas.forEach(c => c.classList.add('revelada'));

  setTimeout(() => {
    cartas.forEach(c => c.classList.remove('revelada'));
    desbloquearJogo();
    iniciarContador();
  }, tempoMem * 1000);
}

function bloquearTemporariamente() {
  bloqueado = true;
  setTimeout(() => {
    document.querySelectorAll('.carta').forEach(c => c.classList.remove('revelada'));
    desbloquearJogo();
    iniciarContador();
  }, tempoMem * 1000);
}

function desbloquearJogo() {
  bloqueado = false;
}

function iniciarContador() {
  atualizarTempo();
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (tempoRestante > 0) {
      tempoRestante--;
      if (tempoRestante <= 10) tocarSom('som-contagem');
      atualizarTempo();
    } else {
      clearInterval(timerInterval);
      finalizarJogo();
    }
  }, 1000);
}

function clicarCarta(carta) {
  if (bloqueado || carta.classList.contains('encontrada') || carta.classList.contains('revelada')) return;
  carta.classList.add('revelada');
  if (!cartaVirada) {
    cartaVirada = carta;
  } else {
    bloqueado = true;
    if (carta.dataset.imagem === cartaVirada.dataset.imagem) {
      carta.classList.add('encontrada', 'acerto');
      cartaVirada.classList.add('encontrada', 'acerto');
      tocarSom('som-acerto');
      requestAnimationFrame(() => {
        setTimeout(() => {
          carta.classList.remove('acerto');
          cartaVirada.classList.remove('acerto');
        }, 1000);
      });

      paresEncontrados++;
      const scoreAnterior = score;
      score++;
      animarPontuacao(scoreAnterior * 1000, score * 1000);

      const idImagem = carta.dataset.imagem.replace('item', 'image');
      mostrarFeedback('acerto');
      setTimeout(() => {
        tocarSom('som-popup');
        mostrarPopupCombinacao(idImagem);
      }, 1200);

      cartaVirada = null;
      bloqueado = false;
      if (paresEncontrados === totalPares) finalizarJogo();
    } else {
      carta.classList.add('erro');
      cartaVirada.classList.add('erro');
      tocarSom('som-erro');
      mostrarFeedback('erro');
      setTimeout(() => {
        carta.classList.remove('revelada', 'erro');
        cartaVirada.classList.remove('revelada', 'erro');
        cartaVirada = null;
        bloqueado = false;
      }, 800);
    }
  }
}

function mostrarFeedback(tipo) {
  const container = document.getElementById('svg-feedback-container');
  fetch(`./assets/feedback/${tipo}.svg`)
    .then(res => res.text())
    .then(svg => {
      container.innerHTML = svg;
      container.className = `modal-feedback-content ${tipo}`;
      document.getElementById('modal-feedback').classList.add('show');
      setTimeout(() => {
        document.getElementById('modal-feedback').classList.remove('show');
        container.className = 'modal-feedback-content';
        container.innerHTML = '';
      }, 1200);
    })
    .catch(err => console.error('Erro ao carregar SVG:', err));
}

function mostrarPopupCombinacao(idImagem) {
  const modal = document.getElementById('modal-popup-combinacao');
  const img = document.getElementById('imagem-popup-combinacao');
  clearInterval(timerInterval);
  img.src = `./assets/popups/${idImagem}.png`;
  modal.style.display = 'flex';

  const fechar = () => {
    modal.style.display = 'none';
    modal.removeEventListener('click', fechar);
    iniciarContador();
  };
  modal.addEventListener('click', fechar);
}

function selecionarBrindePorScore(pontuacao) {
  const faixa = faixasScore.find(f => pontuacao >= f.min && pontuacao <= f.max);
  return faixa ? faixa.brinde : 'Sem Brinde';
}

function finalizarJogo() {
  clearInterval(timerInterval);
  const horarioFim = new Date().toISOString();
  const pontuacaoFinal = score * 1000;
  const brinde = selecionarBrindePorScore(pontuacaoFinal);

  const jogador = {
    horarioInicio,
    horarioFim,
    brinde,
    rodadasConcluidas: 1,
    combinacoesCorretas: score,
    temposPorRodada: [tempo - tempoRestante]
  };

  fetch('/registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jogador)
  });

  fetch('/estoque/reduzir', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: brinde })
  });

  fetch('/estoque')
    .then(res => res.json())
    .then(estoque => {
      const brindeInfo = estoque.find(item => item.nome === brinde);
      const imagem = brindeInfo?.imagem || 'default.jpg';
      const tipoClasse = {
        'brinde comum': 'borda-comum',
        'brinde raro': 'borda-raro',
        'brinde ultrararo': 'borda-ultrararo',
        'brinde epico': 'borda-epico',
        'brinde master': 'borda-master'
      };
      const classeImagem = tipoClasse[brinde.toLowerCase()] || 'borda-comum';
      const imgBrinde = document.getElementById('imagem-brinde-final');
      const nomeBrinde = document.getElementById('nome-brinde-final');
      const modal = document.getElementById('modal-brinde');

      imgBrinde.src = `./assets/brindes/${imagem}`;
      imgBrinde.alt = brinde;
      imgBrinde.className = classeImagem;
      nomeBrinde.textContent = brinde;
      modal.style.display = 'flex';
      tocarSom('som-vencedor');
    });
}

function fecharModal() {
  window.location.href = 'start.html';
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    if (!tempoPausado) {
      clearInterval(timerInterval);
      tempoPausado = true;
    } else {
      iniciarContador();
      tempoPausado = false;
    }
    document.querySelectorAll('.carta:not(.encontrada)').forEach(carta => {
      carta.classList.add('revelada');
    });
  }

  if (e.key === 'e' || e.key === 'E') {
    document.querySelectorAll('.carta:not(.encontrada)').forEach(carta => {
      carta.classList.remove('revelada');
    });
  }

  if (e.key === 't' || e.key === 'T') {
    finalizarJogo();
  }
});
