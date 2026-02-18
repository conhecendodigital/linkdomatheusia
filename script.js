(() => {
    'use strict';

    // ===== SUPABASE CONFIG =====
    // A anon key é pública por design — a segurança vem do RLS e tokens JWT
    const SUPABASE_URL = 'https://aoouqmbyplbmkkamqoyf.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb3VxbWJ5cGxibWtrYW1xb3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzIyMDgsImV4cCI6MjA4NTk0ODIwOH0.z5Dyeyh7-5gfyx6azq2-K4QN7nfv17DAcPVklp9unaU';

    // Inicializar Supabase Client
    const supabase = window.supabase
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

    if (!supabase) {
        console.error('[LinkTree] Supabase SDK não carregado. Verifique o script no index.html.');
    }

    const KEY = 'md_linktree';

    // ===== DEFAULT DATA =====
    const DEFAULTS = {
        logo: 'Matheus Daia',
        logoImg: '',
        bioImg: '',
        cards: [
            { img: '', tag: 'ACESSE AGORA', title: 'MINHA MENTORIA', sub: 'Transforme seus resultados com IA e automação', cta: 'QUERO ACESSAR', url: '#', on: true },
            { img: '', tag: 'SIGA-ME', title: 'INSTAGRAM', sub: '@omatheus.ai • 335k seguidores', cta: 'SEGUIR AGORA', url: '#', on: true },
            { img: '', tag: 'INSCREVA-SE', title: 'CANAL DO YOUTUBE', sub: 'Conteúdo sobre IA, automação e produtividade', cta: 'ACESSAR CANAL', url: '#', on: true },
            { img: '', tag: 'FALE COMIGO', title: 'WHATSAPP', sub: 'Entre em contato direto', cta: 'CHAMAR AGORA', url: '#', on: true },
            { img: '', tag: 'MATRICULE-SE', title: 'MEU CURSO', sub: 'Aprenda IA e automação do zero ao avançado', cta: 'GARANTIR VAGA', url: '#', on: true },
            { img: '', tag: 'OUÇA AGORA', title: 'PODCAST', sub: 'Episódios sobre IA, negócios e produtividade', cta: 'OUVIR EPISÓDIOS', url: '#', on: true },
            { img: '', tag: 'CONFIRA', title: 'PORTFÓLIO', sub: 'Veja meus projetos e cases de sucesso', cta: 'VER PORTFÓLIO', url: '#', on: true },
            { img: '', tag: 'ACESSE', title: 'MINHA LOJA', sub: 'Ferramentas e recursos para criadores', cta: 'ACESSAR LOJA', url: '#', on: true }
        ],
        socials: { ig: '#', yt: '#', wa: '#', tk: '#' },
        bio: {
            name: 'Matheus Daia',
            text: 'Criador de conteúdo especializado em IA e automação. Fundador da Destrave Academy. Ajudo criadores e empresas a crescerem com tecnologia.'
        }
    };

    function load() {
        try {
            const r = localStorage.getItem(KEY);
            if (r) { const p = JSON.parse(r); return { ...DEFAULTS, ...p, cards: Array.isArray(p.cards) && p.cards.length > 0 ? p.cards : DEFAULTS.cards, socials: { ...DEFAULTS.socials, ...p.socials }, bio: { ...DEFAULTS.bio, ...p.bio } }; }
        } catch (e) { }
        return JSON.parse(JSON.stringify(DEFAULTS));
    }
    function save(d) { localStorage.setItem(KEY, JSON.stringify(d)); }

    let D = load();

    // ===== DOM =====
    const $ = id => document.getElementById(id);
    const esc = s => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };

    // Pages
    function go(id) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        $(id).classList.add('active');
        window.scrollTo(0, 0);
    }

    // Toast
    function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2500); }
    function fb(el, m) { el.textContent = m; setTimeout(() => el.textContent = '', 3000); }

    // ===== AUTH STATE =====
    let currentUser = null;

    async function checkAuth() {
        if (!supabase) return false;
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            currentUser = session?.user || null;
            return !!currentUser;
        } catch (e) {
            console.error('[Auth] Erro ao verificar sessão:', e.message);
            currentUser = null;
            return false;
        }
    }

    async function handleLogin() {
        const emailInput = $('inEmail');
        const passInput = $('inPass');
        const loginBtn = $('btnLogin');
        const email = emailInput.value.trim();
        const pass = passInput.value;

        // Validações básicas
        if (!email || !pass) {
            $('loginErr').textContent = 'Preencha todos os campos.';
            $('loginErr').style.display = 'block';
            return;
        }

        if (!supabase) {
            $('loginErr').textContent = 'Erro de configuração. Tente novamente mais tarde.';
            $('loginErr').style.display = 'block';
            return;
        }

        // Desabilitar botão durante login
        loginBtn.disabled = true;
        loginBtn.textContent = 'ENTRANDO...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: pass
            });

            if (error) {
                // Mensagem genérica — NUNCA revelar se o email existe ou não
                $('loginErr').textContent = 'Credenciais inválidas. Tente novamente.';
                $('loginErr').style.display = 'block';
                return;
            }

            currentUser = data.user;
            $('loginErr').style.display = 'none';
            emailInput.value = '';
            passInput.value = '';
            renderAdmin();
            go('adminDash');
            toast('Login realizado!');

        } catch (e) {
            $('loginErr').textContent = 'Erro de conexão. Tente novamente.';
            $('loginErr').style.display = 'block';
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'ENTRAR';
        }
    }

    async function handleLogout() {
        if (!supabase) return;
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error('[Auth] Erro ao fazer logout:', e.message);
        }
        currentUser = null;
        // Limpar qualquer vestígio de sessão antiga
        localStorage.removeItem('adminLoggedIn');
        location.hash = '';
        go('publicPage');
        toast('Você saiu do painel.');
    }

    // Listener de mudança de estado de autenticação
    if (supabase) {
        supabase.auth.onAuthStateChange((event, session) => {
            currentUser = session?.user || null;

            if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                if (event === 'SIGNED_OUT' && location.hash === '#admin') {
                    go('publicPage');
                    location.hash = '';
                    toast('Sessão encerrada.');
                }
            }
        });
    }

    // ===== RENDER PUBLIC =====
    function renderPublic() {
        // Logo
        const logoEl = $('logoText');
        if (D.logoImg) {
            logoEl.innerHTML = `<img src="${esc(D.logoImg)}" class="logo-img" alt="${esc(D.logo)}" />`;
        } else {
            logoEl.innerHTML = `<span class="logo-bar"></span><span class="logo-name">${esc(D.logo)}</span>`;
        }

        // Cards
        const ct = $('cardsContainer');
        ct.innerHTML = '';
        D.cards.forEach((c, i) => {
            const div = document.createElement('div');
            div.className = 'hero-card' + (c.on ? '' : ' hidden-card');
            div.dataset.i = i;
            const imageHTML = c.img
                ? `<img src="${esc(c.img)}" class="card-image" alt="${esc(c.title)}" />`
                : `<div class="card-image-placeholder"></div>`;
            div.innerHTML = `
  <div class="card-image-wrapper">${imageHTML}</div>
  <div class="card-content">
    <span class="card-tag">${esc(c.tag)}</span>
    <h2 class="card-title">${esc(c.title)}</h2>
    <p class="card-subtitle">${esc(c.sub)}</p>
    <a href="${esc(c.url)}" class="card-cta" target="_blank" rel="noopener noreferrer">${esc(c.cta)}</a>
  </div>`;
            ct.appendChild(div);
        });

        // Bio
        $('bioName').textContent = D.bio.name;

        // Render paragraphs: split by \n\n first, fallback to sentence-split
        const bioTextEl = $('bioText');
        bioTextEl.innerHTML = '';
        const rawBioText = D.bio.text || '';
        let paragraphs = rawBioText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);

        // Fallback: if only 1 paragraph and it's long, split by ". " followed by uppercase
        if (paragraphs.length <= 1 && rawBioText.length > 120) {
            paragraphs = rawBioText
                .split(/\.\s+(?=[A-ZÁÀÃÂÉÊÍÓÔÕÚÇ])/)
                .map((p, i, arr) => (i < arr.length - 1 ? p.trim() + '.' : p.trim()))
                .filter(p => p.length > 0);
        }

        // If still empty but text exists, render single paragraph
        if (paragraphs.length === 0 && rawBioText.trim()) {
            paragraphs = [rawBioText.trim()];
        }

        paragraphs.forEach(p => {
            const pEl = document.createElement('p');
            pEl.textContent = p;
            bioTextEl.appendChild(pEl);
        });

        // Bio photo: show/hide (no placeholder — hide completely when no image)
        const bioPhotoEl = $('bioPhoto');
        if (D.bioImg) {
            bioPhotoEl.src = D.bioImg;
            bioPhotoEl.style.display = 'block';
        } else {
            bioPhotoEl.style.display = 'none';
        }

        // Socials
        $('socIG').href = D.socials.ig || '#';
        $('socYT').href = D.socials.yt || '#';
        $('socWA').href = D.socials.wa || '#';
        $('socTK').href = D.socials.tk || '#';
    }

    // ===== RENDER ADMIN =====
    function renderAdmin() {
        $('aLogo').value = D.logo;
        $('aIG').value = D.socials.ig || '';
        $('aYT').value = D.socials.yt || '';
        $('aWA').value = D.socials.wa || '';
        $('aTK').value = D.socials.tk || '';
        $('aBioName').value = D.bio.name;
        $('aBioText').value = D.bio.text;

        // Bio image
        const bioImgUrlInput = $('aBioImg');
        const bioImgPrev = $('bioImgPreview');
        bioImgUrlInput.value = D.bioImg && !D.bioImg.startsWith('data:') ? D.bioImg : '';
        if (D.bioImg) {
            bioImgPrev.src = D.bioImg;
            bioImgPrev.style.display = 'block';
        } else {
            bioImgPrev.src = '';
            bioImgPrev.style.display = 'none';
        }

        // Logo image
        const logoUrlInput = $('aLogoImg');
        const logoPrev = $('logoPreview');
        logoUrlInput.value = D.logoImg && !D.logoImg.startsWith('data:') ? D.logoImg : '';
        if (D.logoImg) {
            logoPrev.src = D.logoImg;
            logoPrev.classList.add('has-img');
        } else {
            logoPrev.src = '';
            logoPrev.classList.remove('has-img');
        }

        // Update card count in title
        $('cardsTitle').textContent = `Cards de Link (${D.cards.length})`;

        const box = $('cardEditors');
        box.innerHTML = '';
        D.cards.forEach((c, i) => {
            const hasPreview = c.img && c.img.length > 0;
            const d = document.createElement('div');
            d.className = 'ce';
            d.draggable = true;
            d.dataset.idx = i;
            const showUp = i > 0;
            const showDown = i < D.cards.length - 1;
            d.innerHTML = `
  <div class="ce-drag-bar">
    <span class="drag-handle" title="Arrastar para reordenar">⠿</span>
    <div class="ce-move-btns">
      ${showUp ? `<button type="button" class="btn-move btn-move-up" data-i="${i}">▲ CIMA</button>` : ''}
      ${showDown ? `<button type="button" class="btn-move btn-move-down" data-i="${i}">▼ BAIXO</button>` : ''}
    </div>
  </div>
  <div class="ce-top">
    <span>Card ${i + 1}</span>
    <div class="tog-wrap">
      <span class="tog-lbl">Visível</span>
      <input type="checkbox" class="tog" data-f="on" data-i="${i}" ${c.on ? 'checked' : ''} />
    </div>
  </div>
  <div class="img-row">
    <div class="fg"><label>Imagem de Fundo</label><input type="text" data-f="img" data-i="${i}" value="${esc(c.img && !c.img.startsWith('data:') ? c.img : '')}" placeholder="Cole a URL da imagem…" /></div>
    <button type="button" class="btn-upload" data-i="${i}">📁 Subir do Computador</button>
    <input type="file" accept="image/*" data-i="${i}" class="file-input" style="display:none" />
    <img src="${hasPreview ? c.img : ''}" class="img-preview${hasPreview ? ' has-img' : ''}" data-i="${i}" alt="Preview" />
  </div>
  <p class="img-hint">💡 Tamanho recomendado: 580 × 380px — formato JPG ou PNG, máximo 2MB</p>
  <div class="fg"><label>Tag</label><input type="text" data-f="tag" data-i="${i}" value="${esc(c.tag)}" /></div>
  <div class="fg"><label>Título Grande</label><input type="text" data-f="title" data-i="${i}" value="${esc(c.title)}" /></div>
  <div class="fg"><label>Subtítulo / Descrição</label><textarea data-f="sub" data-i="${i}">${esc(c.sub)}</textarea></div>
  <div class="fg"><label>Texto do Botão CTA</label><input type="text" data-f="cta" data-i="${i}" value="${esc(c.cta)}" /></div>
  <div class="fg"><label>URL de Destino</label><input type="text" data-f="url" data-i="${i}" value="${esc(c.url)}" /></div>
  <button type="button" class="btn-delete" data-del="${i}">🗑 EXCLUIR CARD</button>`;
            box.appendChild(d);
        });

        // Real-time sync: every input/textarea/checkbox updates D.cards immediately
        box.querySelectorAll('[data-f][data-i]').forEach(el => {
            const f = el.dataset.f;
            const idx = +el.dataset.i;
            if (f === 'on') {
                el.addEventListener('change', () => {
                    D.cards[idx].on = el.checked;
                    save(D); renderPublic();
                });
            } else if (f === 'img') {
                // img handled separately below with preview logic
            } else {
                el.addEventListener('input', () => {
                    D.cards[idx][f] = el.value;
                });
            }
        });

        // Bind file upload buttons
        box.querySelectorAll('.btn-upload').forEach(btn => {
            btn.addEventListener('click', () => {
                const fi = btn.nextElementSibling;
                fi.click();
            });
        });

        // Bind file inputs (convert to base64)
        box.querySelectorAll('.file-input').forEach(fi => {
            fi.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const idx = +fi.dataset.i;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const b64 = ev.target.result;
                    D.cards[idx].img = b64;
                    // Update preview
                    const prev = fi.nextElementSibling;
                    prev.src = b64;
                    prev.classList.add('has-img');
                    // Clear URL input
                    const urlInput = fi.parentElement.querySelector('[data-f="img"]');
                    if (urlInput) urlInput.value = '';
                    save(D); renderPublic();
                    toast('Imagem carregada!');
                };
                reader.readAsDataURL(file);
            });
        });

        // Bind URL input change → update preview
        box.querySelectorAll('[data-f="img"]').forEach(inp => {
            inp.addEventListener('input', () => {
                const idx = +inp.dataset.i;
                const row = inp.closest('.img-row');
                const prev = row.querySelector('.img-preview');
                const val = inp.value.trim();
                if (val) {
                    prev.src = val;
                    prev.classList.add('has-img');
                    D.cards[idx].img = val;
                } else {
                    prev.src = '';
                    prev.classList.remove('has-img');
                    D.cards[idx].img = '';
                }
            });
        });

        // Bind delete buttons
        let pendingDeleteIdx = -1;
        box.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                pendingDeleteIdx = +btn.dataset.del;
                $('confirmOverlay').classList.add('show');
            });
        });

        // Bind move up/down buttons
        box.querySelectorAll('.btn-move-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = +btn.dataset.i;
                if (idx <= 0) return;
                [D.cards[idx - 1], D.cards[idx]] = [D.cards[idx], D.cards[idx - 1]];
                save(D); renderPublic(); renderAdmin();
                toast('✅ Ordem salva!');
            });
        });
        box.querySelectorAll('.btn-move-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = +btn.dataset.i;
                if (idx >= D.cards.length - 1) return;
                [D.cards[idx], D.cards[idx + 1]] = [D.cards[idx + 1], D.cards[idx]];
                save(D); renderPublic(); renderAdmin();
                toast('✅ Ordem salva!');
            });
        });

        // Drag and Drop
        let dragIdx = null;
        box.querySelectorAll('.ce').forEach(ce => {
            ce.addEventListener('dragstart', (e) => {
                dragIdx = +ce.dataset.idx;
                ce.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', dragIdx);
            });
            ce.addEventListener('dragend', () => {
                ce.classList.remove('dragging');
                box.querySelectorAll('.ce').forEach(c => c.classList.remove('drag-over'));
                dragIdx = null;
            });
            ce.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (+ce.dataset.idx !== dragIdx) ce.classList.add('drag-over');
            });
            ce.addEventListener('dragleave', () => {
                ce.classList.remove('drag-over');
            });
            ce.addEventListener('drop', (e) => {
                e.preventDefault();
                const dropIdx = +ce.dataset.idx;
                if (dragIdx === null || dragIdx === dropIdx) return;
                const moved = D.cards.splice(dragIdx, 1)[0];
                D.cards.splice(dropIdx, 0, moved);
                save(D); renderPublic(); renderAdmin();
                toast('✅ Ordem salva!');
            });
        });

        $('btnCancelDel').onclick = () => {
            $('confirmOverlay').classList.remove('show');
            pendingDeleteIdx = -1;
        };
        $('btnConfirmDel').onclick = () => {
            $('confirmOverlay').classList.remove('show');
            if (pendingDeleteIdx >= 0 && pendingDeleteIdx < D.cards.length) {
                D.cards.splice(pendingDeleteIdx, 1);
                save(D); renderPublic(); renderAdmin();
                toast('Card excluído!');
            }
            pendingDeleteIdx = -1;
        };
        $('confirmOverlay').addEventListener('click', (e) => {
            if (e.target === $('confirmOverlay')) {
                $('confirmOverlay').classList.remove('show');
                pendingDeleteIdx = -1;
            }
        });
    }

    // ===== LOGIN (Supabase Auth) =====
    $('btnLogin').addEventListener('click', handleLogin);
    $('inPass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
    $('btnBack').addEventListener('click', e => { e.preventDefault(); location.hash = ''; go('publicPage'); });
    $('btnLogout').addEventListener('click', handleLogout);

    // ===== SAVE HANDLERS =====
    $('btnSaveHeader').addEventListener('click', () => {
        D.logo = $('aLogo').value.trim();
        const logoUrl = $('aLogoImg').value.trim();
        if (logoUrl) D.logoImg = logoUrl;
        save(D); renderPublic();
        fb($('okHeader'), '✓ Header salvo!'); toast('Header atualizado!');
    });

    // Logo image upload
    $('btnUploadLogo').addEventListener('click', () => $('fileLogoImg').click());
    $('fileLogoImg').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            D.logoImg = ev.target.result;
            $('logoPreview').src = D.logoImg;
            $('logoPreview').classList.add('has-img');
            $('aLogoImg').value = '';
            save(D); renderPublic();
            toast('Logo carregada!');
        };
        reader.readAsDataURL(file);
    });
    $('aLogoImg').addEventListener('input', () => {
        const val = $('aLogoImg').value.trim();
        if (val) {
            $('logoPreview').src = val;
            $('logoPreview').classList.add('has-img');
            D.logoImg = val;
        } else {
            $('logoPreview').src = '';
            $('logoPreview').classList.remove('has-img');
            D.logoImg = '';
        }
    });

    $('btnAddCard').addEventListener('click', () => {
        D.cards.push({ img: '', tag: '', title: '', sub: '', cta: '', url: '#', on: true });
        save(D); renderPublic(); renderAdmin();
        toast('Novo card adicionado!');
        // Scroll to the new card
        const editors = $('cardEditors');
        const lastCard = editors.lastElementChild;
        if (lastCard) lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    $('btnSaveCards').addEventListener('click', () => {
        save(D); renderPublic();
        fb($('okCards'), '✓ Cards salvos!'); toast('Cards atualizados!');
    });

    $('btnSaveSoc').addEventListener('click', () => {
        D.socials = { ig: $('aIG').value.trim(), yt: $('aYT').value.trim(), wa: $('aWA').value.trim(), tk: $('aTK').value.trim() };
        save(D); renderPublic();
        fb($('okSoc'), '✓ Redes salvas!'); toast('Redes atualizadas!');
    });

    // Bio image upload
    $('btnUploadBio').addEventListener('click', () => $('fileBioImg').click());
    $('fileBioImg').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            D.bioImg = ev.target.result;
            $('bioImgPreview').src = D.bioImg;
            $('bioImgPreview').style.display = 'block';
            $('aBioImg').value = '';
            save(D); renderPublic();
            toast('Foto da bio carregada!');
        };
        reader.readAsDataURL(file);
    });
    $('aBioImg').addEventListener('input', () => {
        const val = $('aBioImg').value.trim();
        if (val) {
            $('bioImgPreview').src = val;
            $('bioImgPreview').style.display = 'block';
            D.bioImg = val;
        } else {
            $('bioImgPreview').src = '';
            $('bioImgPreview').style.display = 'none';
            D.bioImg = '';
        }
    });

    $('btnSaveBio').addEventListener('click', () => {
        D.bio = { name: $('aBioName').value.trim(), text: $('aBioText').value };
        // Save bio image URL if typed
        const bioImgUrl = $('aBioImg').value.trim();
        if (bioImgUrl) D.bioImg = bioImgUrl;
        save(D); renderPublic();
        fb($('okBio'), '✓ Bio salva!'); toast('Bio atualizada!');
    });

    // ===== HASH ROUTING (Secure) =====
    async function checkHash() {
        if (location.hash === '#admin') {
            const isLoggedIn = await checkAuth();
            if (isLoggedIn) {
                renderAdmin();
                go('adminDash');
            } else {
                // Limpar qualquer vestígio de auth antiga
                localStorage.removeItem('adminLoggedIn');
                go('adminLogin');
            }
        } else {
            go('publicPage');
        }
    }
    window.addEventListener('hashchange', checkHash);

    // ===== INIT =====
    renderPublic();
    checkHash();
})();
