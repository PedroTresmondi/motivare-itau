const http = require('http');
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const PORT = 5500;

// Garante que as pastas e arquivos existam
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./data/estoque.json')) fs.writeFileSync('./data/estoque.json', '[]');
if (!fs.existsSync('./data/registros.json')) fs.writeFileSync('./data/registros.json', '[]');
if (!fs.existsSync('./data/cadastroJogadores.json')) fs.writeFileSync('./data/cadastroJogadores.json', '[]');
if (!fs.existsSync('./data/configuracao.json')) fs.writeFileSync('./data/configuracao.json', '{}');



const server = http.createServer((req, res) => {
  console.log(`Requisição: ${req.method} ${req.url}`);

  // Verifica CPF
  if (req.url.startsWith('/verificar-cpf') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const cpf = urlObj.searchParams.get('cpf');

    fs.readFile('./data/cadastroJogadores.json', 'utf8', (err, data) => {
      if (err) return res.writeHead(500).end('Erro ao verificar CPF');
      const registros = JSON.parse(data || '[]');
      const existe = registros.some(r => r.cpf === cpf);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ existe }));
    });
    return;
  }

  // Cadastra CPF
  if (req.url === '/cadastrar-cpf' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { cpf } = JSON.parse(body);
      const horarioFormatado = dayjs().format('DD/MM/YYYY HH:mm:ss');
      const novoCadastro = { cpf, horarioCadastro: horarioFormatado };

      fs.readFile('./data/cadastroJogadores.json', 'utf8', (err, data) => {
        const registros = err ? [] : JSON.parse(data || '[]');
        registros.push(novoCadastro);
        fs.writeFile('./data/cadastroJogadores.json', JSON.stringify(registros, null, 2), err => {
          if (err) return res.writeHead(500).end('Erro ao salvar CPF');
          res.writeHead(200).end('CPF registrado com sucesso');
        });
      });
    });
    return;
  }

  // Listar imagens de brindes
  if (req.url === '/listar-brindes' && req.method === 'GET') {
    const pasta = path.join(__dirname, 'public/assets/brindes');
    fs.readdir(pasta, (err, arquivos) => {
      if (err) return res.writeHead(500).end('Erro ao listar imagens');
      const imagens = arquivos.filter(arq => arq.match(/\.(png|jpe?g)$/i));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(imagens));
    });
    return;
  }

  // Reduz estoque
  if (req.url === '/estoque/reduzir' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { nome } = JSON.parse(body);
      fs.readFile('./data/estoque.json', 'utf8', (err, data) => {
        if (err) return res.writeHead(500).end('Erro ao ler estoque');
        let estoque = JSON.parse(data);
        const brinde = estoque.find(b => b.nome === nome);
        if (!brinde || brinde.quantidade <= 0)
          return res.writeHead(400).end('Brinde esgotado ou não encontrado');
        brinde.quantidade--;
        fs.writeFile('./data/estoque.json', JSON.stringify(estoque, null, 2), err => {
          if (err) return res.writeHead(500).end('Erro ao atualizar estoque');
          res.writeHead(200).end('Estoque atualizado com sucesso');
        });
      });
    });
    return;
  }

  // ✅ Editar nome do brinde
  if (req.url === '/estoque/editar' && req.method === 'PUT') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { nomeAntigo, nomeNovo } = JSON.parse(body);
      fs.readFile('./data/estoque.json', 'utf8', (err, data) => {
        if (err) return res.writeHead(500).end('Erro ao ler estoque');
        let estoque = JSON.parse(data);
        const item = estoque.find(b => b.nome === nomeAntigo);
        if (!item) return res.writeHead(404).end('Brinde não encontrado');
        item.nome = nomeNovo;
        fs.writeFile('./data/estoque.json', JSON.stringify(estoque, null, 2), err => {
          if (err) return res.writeHead(500).end('Erro ao salvar');
          res.writeHead(200).end('Nome atualizado com sucesso');
        });
      });
    });
    return;
  }

  // ✅ Remover brinde
  if (req.url === '/estoque/remover' && req.method === 'DELETE') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { nome } = JSON.parse(body);
      fs.readFile('./data/estoque.json', 'utf8', (err, data) => {
        if (err) return res.writeHead(500).end('Erro ao ler estoque');
        let estoque = JSON.parse(data);
        const novoEstoque = estoque.filter(b => b.nome !== nome);
        if (novoEstoque.length === estoque.length) {
          return res.writeHead(404).end('Brinde não encontrado');
        }
        fs.writeFile('./data/estoque.json', JSON.stringify(novoEstoque, null, 2), err => {
          if (err) return res.writeHead(500).end('Erro ao remover');
          res.writeHead(200).end('Brinde removido com sucesso');
        });
      });
    });
    return;
  }

  // Registro de jogo
  if (req.url === '/registrar' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const novoRegistro = JSON.parse(body);
      fs.readFile('./data/registros.json', 'utf8', (err, data) => {
        const registros = err ? [] : JSON.parse(data || '[]');
        const nomeJogo = `jogo${registros.length + 1}`;
        novoRegistro.nome = nomeJogo;
        registros.push(novoRegistro);
        fs.writeFile('./data/registros.json', JSON.stringify(registros, null, 2), err => {
          if (err) return res.writeHead(500).end('Erro ao registrar');
          res.writeHead(200).end('Registro salvo com sucesso');
        });
      });
    });
    return;
  }

  if (req.url === '/registros' && req.method === 'GET') {
    fs.readFile('./data/registros.json', 'utf8', (err, data) => {
      if (err) return res.writeHead(500).end('Erro ao ler registros');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }


  // ✅ Configuração do jogo
  if (req.url === '/configuracao') {
    if (req.method === 'GET') {
      fs.readFile('./data/configuracao.json', 'utf8', (err, data) => {
        if (err) return res.writeHead(500).end('Erro ao ler configuração');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        fs.writeFile('./data/configuracao.json', body, err => {
          if (err) return res.writeHead(500).end('Erro ao salvar configuração');
          res.writeHead(200).end('Configuração salva com sucesso');
        });
      });
    }
    return;
  }


  // ✅ Estoque - apenas se for exatamente /estoque
  if (req.url === '/estoque') {
    if (req.method === 'GET') {
      fs.readFile('./data/estoque.json', 'utf8', (err, data) => {
        if (err) return res.writeHead(500).end('Erro ao ler estoque');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        fs.writeFile('./data/estoque.json', body, err => {
          if (err) return res.writeHead(500).end('Erro ao salvar estoque');
          res.writeHead(200).end('Estoque salvo com sucesso');
        });
      });
    }
    return;
  }

  // Arquivos estáticos da pasta public
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) res.writeHead(404).end('Arquivo não encontrado');
    else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () =>
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`)
);
