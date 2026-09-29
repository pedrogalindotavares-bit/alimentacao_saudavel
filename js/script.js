// Vida Saudável 2.0 — interatividade
(function() {
  const root = document.documentElement;
  let tamanho = parseInt(localStorage.getItem('fonteSize') || '16', 10);

  function aplicarFonte() {
    root.style.setProperty('--fonte-base', tamanho + 'px');
    localStorage.setItem('fonteSize', tamanho);
    const aviso = document.getElementById('aviso-acessibilidade');
    if (aviso) aviso.textContent = `Fonte ${tamanho}px`;
  }
  window.aumentarFonte = function() { if (tamanho < 24) { tamanho += 1; aplicarFonte(); } };
  window.diminuirFonte = function() { if (tamanho > 12) { tamanho -= 1; aplicarFonte(); } };
  window.resetarFonte = function() { tamanho = 16; aplicarFonte(); };
  window.alternarContraste = function() {
    document.body.classList.toggle('alto-contraste');
    const ativo = document.body.classList.contains('alto-contraste');
    localStorage.setItem('contraste', ativo ? '1' : '0');
    document.querySelectorAll('[data-contraste-btn]').forEach(b => b.setAttribute('aria-pressed', ativo ? 'true' : 'false'));
    toast(ativo ? 'Alto contraste ativado' : 'Alto contraste desativado');
  };
  window.alternarTema = function() {
    document.body.classList.toggle('dark-mode');
    const dark = document.body.classList.contains('dark-mode');
    localStorage.setItem('tema', dark ? 'dark' : 'light');
    document.querySelectorAll('[data-tema-btn]').forEach(b => {
      b.setAttribute('aria-pressed', dark ? 'true' : 'false');
      b.innerHTML = dark ? '<i class="bi bi-sun-fill"></i> Claro' : '<i class="bi bi-moon-fill"></i> Escuro';
    });
  };

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast'; t.className = 'toast-mod'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('mostrar');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('mostrar'), 2600);
  }
  window.toastSite = toast;

  document.addEventListener('DOMContentLoaded', () => {
    aplicarFonte();
    if (localStorage.getItem('contraste') === '1') {
      document.body.classList.add('alto-contraste');
      document.querySelectorAll('[data-contraste-btn]').forEach(b => b.setAttribute('aria-pressed', 'true'));
    }
    if (localStorage.getItem('tema') === 'dark') {
      document.body.classList.add('dark-mode');
      document.querySelectorAll('[data-tema-btn]').forEach(b => {
        b.setAttribute('aria-pressed', 'true');
        b.innerHTML = '<i class="bi bi-sun-fill"></i> Claro';
      });
    }

    // Barra de progresso + navbar + topo
    const prog = document.getElementById('progress-leitura');
    const btnTopo = document.getElementById('btn-topo');
    const navbar = document.querySelector('.navbar');
    const onScroll = () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1) * 100;
      if (prog) prog.style.width = pct + '%';
      if (btnTopo) btnTopo.classList.toggle('mostrar', h.scrollTop > 500);
      if (navbar) navbar.classList.toggle('scrolled', h.scrollTop > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (btnTopo) btnTopo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Link ativo
    const pagina = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.nav-link').forEach(a => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === pagina || (pagina === '' && href === 'index.html')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // Reveal on scroll
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); } });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));

    // Contadores animados (respeita prefers-reduced-motion)
    const counters = document.querySelectorAll('[data-contar]');
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ioC = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target; ioC.unobserve(el);
        const alvo = parseFloat(el.dataset.contar); const suf = el.dataset.sufixo || '';
        const final = (Number.isInteger(alvo) ? Math.round(alvo) : alvo.toFixed(1).replace('.', ',')) + suf;
        if (reduzirMovimento) { el.textContent = final; el.setAttribute('aria-label', final); return; }
        const t0 = performance.now(), dur = 1400;
        const step = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = alvo * eased;
          const txt = (Number.isInteger(alvo) ? Math.round(val) : val.toFixed(1).replace('.', ',')) + suf;
          el.textContent = txt;
          if (p < 1) requestAnimationFrame(step);
          else el.setAttribute('aria-label', final);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: .5 });
    counters.forEach(el => ioC.observe(el));

    // Leitura em voz alta
    const btnLer = document.getElementById('btn-ler');
    const btnParar = document.getElementById('btn-parar-leitura');
    if (btnLer && 'speechSynthesis' in window) {
      btnLer.addEventListener('click', () => {
        speechSynthesis.cancel();
        const texto = (document.querySelector('main')?.innerText || '').slice(0, 2500);
        if (!texto.trim()) { toast('Nada para ler nesta página'); return; }
        const fala = new SpeechSynthesisUtterance(texto);
        fala.lang = 'pt-BR'; fala.rate = 1;
        speechSynthesis.speak(fala);
        toast('Lendo conteúdo em voz alta…');
      });
      btnParar?.addEventListener('click', () => { speechSynthesis.cancel(); toast('Leitura interrompida'); });
      document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') speechSynthesis.cancel(); });
      window.addEventListener('pagehide', () => speechSynthesis.cancel());
    } else if (btnLer) {
      btnLer.addEventListener('click', () => toast('Leitura por voz não suportada neste navegador'));
      btnParar?.addEventListener('click', () => toast('Leitura por voz não suportada neste navegador'));
    }

    // Busca + filtros + favoritos (receitas)
    const busca = document.getElementById('busca-receitas');
    const cards = [...document.querySelectorAll('[data-receita]')];
    const btnsFiltro = [...document.querySelectorAll('.filtro-btn')];
    let filtroAtual = 'todas';
    function filtrar() {
      const termo = (busca?.value || '').toLowerCase().trim();
      let visiveis = 0;
      cards.forEach(c => {
        const cat = c.dataset.categoria || '';
        const txt = c.innerText.toLowerCase();
        const okCat = filtroAtual === 'todas' || cat === filtroAtual;
        const okBusca = !termo || txt.includes(termo);
        const mostrar = okCat && okBusca;
        c.closest('.col-md-6, .col-lg-4, .col-md-4')?.classList.toggle('d-none', !mostrar);
        if (mostrar) visiveis++;
      });
      const vazio = document.getElementById('receitas-vazio');
      if (vazio) vazio.classList.toggle('d-none', visiveis > 0);
    }
    busca?.addEventListener('input', filtrar);
    btnsFiltro.forEach(b => b.addEventListener('click', () => {
      btnsFiltro.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      filtroAtual = b.dataset.filtro || 'todas';
      filtrar();
    }));

    // Favoritos (com aria-pressed e rótulo dinâmico)
    const favs = new Set(JSON.parse(localStorage.getItem('favoritas') || '[]'));
    function nomeReceita(btn) {
      const artigo = btn.closest('article');
      const titulo = artigo?.querySelector('h2')?.textContent.trim() || 'receita';
      return titulo.replace(/^\d+\.\s*/, '');
    }
    document.querySelectorAll('.fav-btn').forEach(btn => {
      const id = btn.dataset.fav;
      const nome = nomeReceita(btn);
      const aplicarEstado = (favoritado) => {
        btn.classList.toggle('favorito', favoritado);
        btn.setAttribute('aria-pressed', favoritado ? 'true' : 'false');
        btn.setAttribute('aria-label', (favoritado ? 'Remover dos favoritos: ' : 'Favoritar: ') + nome);
      };
      aplicarEstado(favs.has(id));
      btn.addEventListener('click', () => {
        if (favs.has(id)) { favs.delete(id); aplicarEstado(false); toast('Removida dos favoritos'); }
        else { favs.add(id); aplicarEstado(true); toast('Salva nos favoritos!'); }
        localStorage.setItem('favoritas', JSON.stringify([...favs]));
      });
    });

    // Quiz
    const quizForm = document.getElementById('quiz');
    if (quizForm) {
      quizForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let pontos = 0;
        const respostas = { q1: 'b', q2: 'c', q3: 'a' };
        Object.keys(respostas).forEach(q => {
          const marcada = quizForm.querySelector(`input[name="${q}"]:checked`);
          quizForm.querySelectorAll(`input[name="${q}"]`).forEach(i => i.closest('label')?.classList.remove('text-success', 'fw-bold', 'text-danger'));
          if (marcada) {
            if (marcada.value === respostas[q]) { pontos++; marcada.closest('label')?.classList.add('text-success', 'fw-bold'); }
            else marcada.closest('label')?.classList.add('text-danger');
          }
        });
        const r = document.getElementById('quiz-resultado');
        const emoji = pontos === 3 ? '🏆' : pontos === 2 ? '👏' : '💪';
        r.innerHTML = '';
        const spanIcon = document.createElement('span');
        spanIcon.setAttribute('aria-hidden', 'true');
        spanIcon.textContent = emoji + ' ';
        r.appendChild(spanIcon);
        const forte = document.createElement('strong');
        forte.textContent = `Você acertou ${pontos} de 3! `;
        r.appendChild(forte);
        r.appendChild(document.createTextNode(pontos === 3 ? 'Parabéns, expert em alimentação saudável!' : pontos === 2 ? 'Muito bem! Quase lá.' : 'Continue explorando o site e tente de novo!'));
        r.focus();
      });
    }

    // IMC com barra visual
    const formIMC = document.getElementById('form-imc');
    if (formIMC) {
      formIMC.addEventListener('submit', (e) => {
        e.preventDefault();
        let peso = parseFloat(document.getElementById('peso').value.replace(',', '.'));
        let altura = parseFloat(document.getElementById('altura').value.replace(',', '.'));
        const out = document.getElementById('imc-resultado');
        // Aceita altura em cm (ex: 170) convertendo para metros
        if (altura > 3 && altura <= 300) altura = altura / 100;
        if (peso >= 20 && peso <= 300 && altura >= 0.5 && altura <= 2.5) {
          const imc = peso / (altura * altura);
          let classe = '', cor = '', dica = '';
          if (imc < 18.5) { classe = 'abaixo do peso'; cor = '#0c4a6e'; dica = 'Que tal reforçar as proteínas e procurar um nutricionista?'; }
          else if (imc < 25) { classe = 'peso normal'; cor = '#14532d'; dica = 'Ótimo! Mantenha o equilíbrio e a hidratação.'; }
          else if (imc < 30) { classe = 'sobrepeso'; cor = '#92400e'; dica = 'Pequenos ajustes (menos ultraprocessados + caminhada) já ajudam.'; }
          else { classe = 'obesidade'; cor = '#991b1b'; dica = 'Vale conversar com um profissional de saúde. Você consegue!'; }
          out.innerHTML = '';
          out.appendChild(document.createTextNode('Seu IMC é '));
          const valor = document.createElement('span');
          valor.style.color = cor; valor.style.fontSize = '1.4em';
          valor.textContent = imc.toFixed(1).replace('.', ',');
          out.appendChild(valor);
          out.appendChild(document.createTextNode(` (${classe}). `));
          const small = document.createElement('small');
          small.textContent = dica;
          out.appendChild(document.createElement('br'));
          out.appendChild(small);
        } else {
          out.textContent = 'Informe peso (kg) e altura (m, ex: 1.70) válidos.';
        }
        out.focus();
      });
    }

    // Contato
    const formContato = document.getElementById('form-contato');
    if (formContato) {
      // contador de caracteres
      const msg = document.getElementById('mensagem');
      const cont = document.getElementById('cont-msg');
      msg?.addEventListener('input', () => { if (cont) cont.textContent = `${msg.value.length}/500 caracteres`; });
      formContato.addEventListener('submit', (e) => {
        if (!formContato.checkValidity()) {
          e.preventDefault(); e.stopPropagation();
          document.getElementById('msg-erro').textContent = '⚠ Por favor, preencha todos os campos obrigatórios corretamente.';
        } else {
          e.preventDefault();
          document.getElementById('msg-erro').textContent = '';
          document.getElementById('msg-sucesso').textContent = '✅ Mensagem enviada com sucesso! Obrigado pelo contato.';
          document.getElementById('msg-sucesso').focus();
          toast('Mensagem enviada com sucesso!');
          formContato.reset();
          formContato.classList.remove('was-validated');
          return;
        }
        formContato.classList.add('was-validated');
      });
    }

    // Newsletter (todas as páginas) com validação nativa
    document.querySelectorAll('.form-news').forEach(f => {
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = f.querySelector('input[type="email"]');
        if (email && email.checkValidity()) { toast('Inscrição confirmada! Bem-vindo(a)!'); f.reset(); }
        else { toast('Digite um e-mail válido'); email?.focus(); }
      });
    });

    // Ano automático
    document.querySelectorAll('[data-ano]').forEach(el => el.textContent = new Date().getFullYear());
  });
})();
