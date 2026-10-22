(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const KEYS = {user:'up_eventos_user',users:'up_eventos_users',gallery:'up_eventos_gallery',agenda:'up_eventos_agenda',quotes:'up_eventos_quotes',theme:'up_eventos_theme'};
  let chosenRole = 'cliente';
  let pendingPhotoData = null;
  let pendingPanel = null;
  let authMode = 'register';
  let cameraStream = null;
  let toastTimer;
  const read = (key, fallback=[]) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toast(message) { const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2800); }
  function user() { return read(KEYS.user, null); }
  function setTheme(theme) { document.body.classList.toggle('light', theme==='light'); localStorage.setItem(KEYS.theme,theme); const label=theme==='light'?'☀':'☾'; $('#themeToggle').textContent=label; $('#themeToggleInside').textContent=label; }
  function toggleTheme(){setTheme(document.body.classList.contains('light')?'dark':'light');}
  setTheme(localStorage.getItem(KEYS.theme)||'dark');
  $('#themeToggle').addEventListener('click',toggleTheme); $('#themeToggleInside').addEventListener('click',toggleTheme);
  $('#menuToggle').addEventListener('click',()=>$('.main-nav').classList.toggle('open'));
  $$('.main-nav a').forEach(a=>a.addEventListener('click',()=>$('.main-nav').classList.remove('open')));
  const modal=$('#authModal');
  function openAuth(){ if(user()){showWorkspace();if(pendingPanel){switchPanel(pendingPanel);pendingPanel=null;}return;} setAuthMode('register'); modal.hidden=false; document.body.style.overflow='hidden'; $('#userName').focus(); }
  function closeAuth(){modal.hidden=true;document.body.style.overflow='';}
  ['#loginTop','#startTop','#heroLogin','#ctaLogin'].forEach(sel=>$(sel).addEventListener('click',openAuth));
  $('#closeAuth').addEventListener('click',closeAuth); modal.addEventListener('click',e=>{if(e.target===modal)closeAuth();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeAuth();});
  $$('.role-choice').forEach(btn=>btn.addEventListener('click',()=>{$$('.role-choice').forEach(b=>b.classList.remove('active'));btn.classList.add('active');chosenRole=btn.dataset.role;$('#authTitle').textContent=chosenRole==='cliente'?'Entre para planejar.':'Entre como organizador.';}));
  function setAuthMode(mode){
    authMode=mode;
    $('label[for="userName"]').hidden=mode==='login';
    $('#userName').hidden=mode==='login';
    $('#userName').required=mode==='register';
    $('#authSubmit').textContent=mode==='login'?'Entrar ↗':'Criar conta ↗';
    $('#authModeToggle').textContent=mode==='login'?'Ainda não tenho conta · Criar conta':'Já tenho uma conta · Entrar';
    $('#authTitle').textContent=mode==='login'?'Entre na sua conta.':'Entre para planejar.';
  }
  $('#authModeToggle').addEventListener('click',()=>setAuthMode(authMode==='register'?'login':'register'));
  $$('.locked-action').forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();const target=btn.dataset.targetPanel || (btn.closest('#servicos')?'servicosPanel':btn.closest('#espacos')?'espacosPanel':'painel');if(!user()){pendingPanel=target;openAuth();}else {showWorkspace();switchPanel(target);}}));
  $('#authForm').addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('#userName').value.trim(),email=$('#userEmail').value.trim().toLowerCase(),password=$('#userPassword').value;
    if(!email||password.length<4||(authMode==='register'&&!name)){toast('Confira os campos preenchidos.');return;}
    const accounts=read(KEYS.users,[]);
    let account;
    if(authMode==='register'){
      if(accounts.some(a=>a.email===email)){toast('Já existe uma conta com este e-mail. Entre na conta existente.');setAuthMode('login');return;}
      account={name,email,password,role:chosenRole};
      accounts.push(account);write(KEYS.users,accounts);
    } else {
      account=accounts.find(a=>a.email===email&&a.password===password);
      if(!account){toast('E-mail ou senha incorretos.');return;}
      if(account.role!==chosenRole){toast('Selecione o mesmo perfil usado no cadastro.');return;}
    }
    write(KEYS.user,{name:account.name,email:account.email,role:account.role});
    closeAuth();showWorkspace();if(pendingPanel){switchPanel(pendingPanel);pendingPanel=null;}toast(`Bem-vindo(a), ${account.name}!`);
  });
  function showWorkspace(){const current=user();if(!current){openAuth();return;}$('#workspace').hidden=false;document.querySelector('main').hidden=true;$('.topbar').hidden=true;$('.footer').hidden=true;$('#welcomeName').textContent=current.name;$('#dashboardName').textContent=current.name;$('#roleMessage').textContent=current.role==='organizador'?'Modo organizador: use os serviços e referências para preparar a apresentação do evento.':'Modo cliente: guarde inspirações, sugira uma data e envie os detalhes do seu evento.';closeAuth();renderGallery();renderAgenda();renderQuotes();configureRole();renderOrganizer();window.scrollTo(0,0);}
  function configureRole(){
    const current=user();
    const isOrganizer=current?.role==='organizador';
    const organizerLink=$('.organizer-only');
    if(organizerLink) organizerLink.hidden=!isOrganizer;
    const dashboardTitle=$('#painel h1');
    if(dashboardTitle) dashboardTitle.innerHTML=isOrganizer?'Olá, <span id="dashboardName">'+escapeHTML(current.name)+'</span>.':'Olá, <span id="dashboardName">'+escapeHTML(current.name)+'</span>.';
    const roleMessage=$('#roleMessage');
    if(roleMessage) roleMessage.textContent=isOrganizer
      ? 'Modo organizador: consulte a área da equipe para revisar orçamentos e agendamentos demonstrativos.'
      : 'Modo cliente: guarde inspirações, sugira uma data e envie os detalhes do seu evento.';
  }
  function renderOrganizer(){
    const quotes=getQuotes(), agenda=getAgenda(), gallery=getGallery(true);
    const qc=$('#organizerQuoteCount'), ac=$('#organizerAgendaCount'), gc=$('#organizerGalleryCount');
    if(qc) qc.textContent=`${quotes.length} ${quotes.length===1?'solicitação':'solicitações'}`;
    if(ac) ac.textContent=`${agenda.length} ${agenda.length===1?'solicitação':'solicitações'}`;
    if(gc) gc.textContent=`${gallery.length} ${gallery.length===1?'imagem':'imagens'}`;
    const ql=$('#organizerQuoteList'), al=$('#organizerAgendaList');
    const statuses=['Recebido','Em análise','Proposta enviada','Concluído'];
    if(ql) ql.innerHTML=quotes.length ? quotes.map(item=>`<div class="saved-entry"><div><b>${escapeHTML(item.type)} · ${escapeHTML(item.guests)} convidados</b><small>Cliente: ${escapeHTML(item.clientName||'Cliente demonstrativo')}${item.clientEmail?' · '+escapeHTML(item.clientEmail):''}</small><small>${item.space?'Espaço: '+escapeHTML(item.space)+' · ':''}${item.date?'Data estimada: '+escapeHTML(item.date)+' · ':''}${(item.services||[]).length?'Serviços: '+escapeHTML((item.services||[]).join(', ')):'Sem serviços selecionados'}${item.budget?' · '+escapeHTML(item.budget):''}</small>${item.notes?`<small>${escapeHTML(item.notes)}</small>`:''}</div><label class="status-control">Status<select data-quote-status="${item.id}">${statuses.map(st=>`<option value="${st}" ${(item.status||'Recebido')===st?'selected':''}>${st}</option>`).join('')}</select></label></div>`).join('') : '<div class="empty-state">Nenhuma solicitação registrada neste navegador.</div>';
    if(al) al.innerHTML=agenda.length ? agenda.map(item=>`<div class="saved-entry"><div><b>${escapeHTML(item.type)}</b><small>Cliente: ${escapeHTML(item.clientName||'Cliente demonstrativo')}${item.clientEmail?' · '+escapeHTML(item.clientEmail):''}</small><small>${escapeHTML(item.date)} às ${escapeHTML(item.time)}${item.notes?' · '+escapeHTML(item.notes):''}</small></div><span class="status-label">${escapeHTML(item.status||'Solicitado')}</span></div>`).join('') : '<div class="empty-state">Nenhum agendamento registrado neste navegador.</div>';
    if(ql) $$('[data-quote-status]',ql).forEach(select=>select.addEventListener('change',()=>{const all=getQuotes();const item=all.find(q=>String(q.id)===select.dataset.quoteStatus);if(item){item.status=select.value;write(KEYS.quotes,all);renderOrganizer();renderQuotes();toast('Status atualizado.');}}));
  }
  function backHome(){stopCamera();$('#workspace').hidden=true;document.querySelector('main').hidden=false;$('.topbar').hidden=false;$('.footer').hidden=false;window.scrollTo(0,0);}
  $('#backHome').addEventListener('click',backHome);
  $('#logoutBtn').addEventListener('click',()=>{stopCamera();localStorage.removeItem(KEYS.user);backHome();toast('Você saiu da plataforma.');});
  function switchPanel(id){if(id==='organizadorPanel'&&user()?.role!=='organizador'){toast('Esta área é exclusiva do perfil organizador.');id='painel';}$$('.workspace-panel').forEach(p=>p.classList.toggle('active',p.id===id));$$('.side-link').forEach(b=>b.classList.toggle('active',b.dataset.panel===id));if(id!=='cameraPanel')stopCamera();window.scrollTo({top:0,behavior:'smooth'});}
  $$('.side-link').forEach(btn=>btn.addEventListener('click',()=>switchPanel(btn.dataset.panel)));
  $$('[data-goto]').forEach(btn=>btn.addEventListener('click',()=>switchPanel(btn.dataset.goto)));
  function getGallery(all=false){const items=read(KEYS.gallery,[]);const current=user();return (all&&current?.role==='organizador')?items:items.filter(item=>!item.ownerEmail||item.ownerEmail===current?.email)}
  function addGallery(dataUrl,name){const gallery=read(KEYS.gallery,[]);const current=user();gallery.unshift({id:Date.now()+Math.random(),dataUrl,name:name||'Referência',date:new Date().toLocaleDateString('pt-BR'),ownerEmail:current?.email||'',ownerName:current?.name||''});try{write(KEYS.gallery,gallery);renderGallery();renderOrganizer();toast('Imagem adicionada à galeria.');}catch(err){toast('Armazenamento cheio. Baixe/remova algumas fotos.');}}
  function renderGallery(){const gallery=getGallery();$('#galleryCount').textContent=`(${gallery.length})`;const grid=$('#galleryGrid');if(!gallery.length){grid.innerHTML='<div class="empty-state">Suas fotos tiradas e imagens enviadas aparecerão aqui.</div>';return;}grid.innerHTML=gallery.map(item=>`<article class="gallery-item"><a href="${item.dataUrl}" target="_blank" rel="noopener" title="Abrir imagem em tamanho maior"><img src="${item.dataUrl}" alt="${escapeHTML(item.name)}"></a><small>${escapeHTML(item.name)} · ${escapeHTML(item.date)}</small><a class="gallery-download" href="${item.dataUrl}" download="${escapeHTML((item.name||'referencia').replace(/[^a-z0-9_-]/gi,'_'))}.jpg" aria-label="Baixar imagem">↓ Baixar</a><button type="button" data-delete-image="${item.id}" aria-label="Excluir imagem">×</button></article>`).join('');$$('[data-delete-image]',grid).forEach(btn=>btn.addEventListener('click',()=>{write(KEYS.gallery,read(KEYS.gallery,[]).filter(item=>String(item.id)!==btn.dataset.deleteImage));renderGallery();renderOrganizer();toast('Imagem removida.');}));}
  async function populateCameras(){const select=$('#cameraDeviceSelect');if(!select||!navigator.mediaDevices?.enumerateDevices)return;const previous=select.value;try{const devices=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');select.innerHTML='<option value="">Câmera padrão</option>';devices.forEach((device,i)=>{const option=document.createElement('option');option.value=device.deviceId;option.textContent=device.label||`Câmera ${i+1}`;select.appendChild(option);});if(previous&&devices.some(d=>d.deviceId===previous))select.value=previous;}catch{}}
  async function openCamera(){if(!navigator.mediaDevices?.getUserMedia){toast('Seu navegador não permite abrir a câmera. Use HTTPS ou localhost.');return;}try{const chosen=$('#cameraDeviceSelect')?.value;const videoConstraints=chosen?{deviceId:{exact:chosen}}:{facingMode:{ideal:'environment'}};cameraStream=await navigator.mediaDevices.getUserMedia({video:videoConstraints,audio:false});const video=$('#cameraVideo');video.srcObject=cameraStream;video.hidden=false;$('#capturedPreview').hidden=true;$('#cameraPlaceholder').hidden=true;await video.play();$('#openCamera').disabled=true;$('#takePhoto').disabled=false;$('#stopCamera').disabled=false;await populateCameras();}catch(err){toast(err.name==='NotAllowedError'?'Permita o acesso à câmera nas configurações do navegador.':'Não foi possível abrir a câmera. Verifique o dispositivo ou tente outra opção.');}}
  function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}const video=$('#cameraVideo');if(video){video.srcObject=null;video.hidden=true;}if($('#capturedPreview')){$('#capturedPreview').hidden=true;$('#capturedPreview').removeAttribute('src');}if($('#cameraPlaceholder'))$('#cameraPlaceholder').hidden=false;if($('#openCamera'))$('#openCamera').disabled=false;if($('#takePhoto')){$('#takePhoto').disabled=true;$('#takePhoto').hidden=false;}if($('#savePhoto'))$('#savePhoto').hidden=true;if($('#retakePhoto'))$('#retakePhoto').hidden=true;if($('#stopCamera'))$('#stopCamera').disabled=true;pendingPhotoData=null;}
  $('#openCamera').addEventListener('click',openCamera);$('#stopCamera').addEventListener('click',stopCamera);
  $('#takePhoto').addEventListener('click',()=>{const video=$('#cameraVideo'),canvas=$('#cameraCanvas');if(!cameraStream||!video.videoWidth){toast('Aguarde a câmera carregar.');return;}const scale=Math.min(1,1280/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);pendingPhotoData=canvas.toDataURL('image/jpeg',.82);const preview=$('#capturedPreview');preview.src=pendingPhotoData;preview.hidden=false;video.hidden=true;$('#takePhoto').hidden=true;$('#savePhoto').hidden=false;$('#retakePhoto').hidden=false;toast('Foto capturada. Revise e salve na galeria.');});
  $('#savePhoto').addEventListener('click',()=>{if(!pendingPhotoData)return;addGallery(pendingPhotoData,`Foto ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`);pendingPhotoData=null;$('#capturedPreview').hidden=true;$('#takePhoto').hidden=false;$('#savePhoto').hidden=true;$('#retakePhoto').hidden=true;$('#cameraVideo').hidden=false;});
  $('#retakePhoto').addEventListener('click',()=>{pendingPhotoData=null;$('#capturedPreview').hidden=true;$('#takePhoto').hidden=false;$('#savePhoto').hidden=true;$('#retakePhoto').hidden=true;$('#cameraVideo').hidden=false;$('#cameraVideo').play().catch(()=>{});});
  $('#cameraDeviceSelect')?.addEventListener('change',async()=>{if(cameraStream){stopCamera();await openCamera();}});
  $('#imageUpload').addEventListener('change',async e=>{const files=[...e.target.files];for(const file of files){if(!file.type.startsWith('image/'))continue;try{const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});addGallery(data,file.name);}catch{toast('Não foi possível ler uma das imagens.');}}e.target.value='';});
  $('#clearGallery').addEventListener('click',()=>{if(!getGallery().length){toast('A galeria já está vazia.');return;}if(confirm('Deseja apagar todas as suas imagens desta galeria?')){const current=user();write(KEYS.gallery,read(KEYS.gallery,[]).filter(item=>item.ownerEmail&&item.ownerEmail!==current?.email));renderGallery();renderOrganizer();toast('Sua galeria foi limpa.');}});
  function getAgenda(){return read(KEYS.agenda,[])}
  function renderAgenda(){const list=$('#agendaList'),all=getAgenda(),current=user(),items=current?.role==='organizador'?all:all.filter(item=>!item.clientEmail||item.clientEmail===current?.email);if(!items.length){list.textContent='Nenhum agendamento por enquanto.';return;}list.innerHTML=items.map(item=>`<div class="saved-entry"><div><b>${escapeHTML(item.type)}</b><small>${escapeHTML(item.date)} às ${escapeHTML(item.time)}${item.notes?' · '+escapeHTML(item.notes):''}</small></div><button data-delete-agenda="${item.id}">Cancelar</button></div>`).join('');$$('[data-delete-agenda]',list).forEach(btn=>btn.addEventListener('click',()=>{write(KEYS.agenda,getAgenda().filter(i=>String(i.id)!==btn.dataset.deleteAgenda));renderAgenda();renderOrganizer();toast('Solicitação removida.');}));}
  const today=new Date();const localToday=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;$('#eventDate').min=localToday;$('#quoteDate').min=localToday;
  $('#agendaForm').addEventListener('submit',e=>{e.preventDefault();const date=$('#eventDate').value,time=$('#eventTime').value;if(!date||date<localToday){toast('Escolha uma data válida de hoje em diante.');return;}const items=getAgenda();if(items.some(item=>item.date===date&&item.time===time)){toast('Esse horário já está selecionado na sua lista. Escolha outro.');return;}items.unshift({id:Date.now(),date,time,type:$('#visitType').value,notes:$('#agendaNotes').value.trim(),status:'Solicitado',clientEmail:user()?.email||'',clientName:user()?.name||''});write(KEYS.agenda,items);e.target.reset();$('#eventDate').min=localToday;renderAgenda();renderOrganizer();toast('Agendamento salvo neste navegador.');});
  function getQuotes(){return read(KEYS.quotes,[])}
  function renderQuotes(){const list=$('#quoteList'),all=getQuotes(),current=user(),items=current?.role==='organizador'?all:all.filter(item=>!item.clientEmail||item.clientEmail===current?.email);if(!items.length){list.textContent='Nenhuma solicitação por enquanto.';return;}list.innerHTML=items.map(item=>`<div class="saved-entry"><div><b>${escapeHTML(item.type)} · ${escapeHTML(item.guests)} convidados</b><small>${item.space?'Espaço: '+escapeHTML(item.space)+' · ':''}${item.date?'Data estimada: '+escapeHTML(item.date)+' · ':''}${(item.services||[]).length?'Serviços: '+escapeHTML((item.services||[]).join(', ')):'Sem serviços selecionados'}${item.budget?' · '+escapeHTML(item.budget):''}</small>${item.notes?`<small>${escapeHTML(item.notes)}</small>`:''}</div><button data-delete-quote="${item.id}">Excluir</button></div>`).join('');$$('[data-delete-quote]',list).forEach(btn=>btn.addEventListener('click',()=>{write(KEYS.quotes,getQuotes().filter(i=>String(i.id)!==btn.dataset.deleteQuote));renderQuotes();renderOrganizer();toast('Solicitação excluída.');}));}
  $('#quoteForm').addEventListener('submit',e=>{e.preventDefault();const services=$$('input[name="service"]:checked').map(input=>input.value);const items=getQuotes();items.unshift({id:Date.now(),type:$('#quoteType').value,space:$('#quoteSpace')?.value||'',guests:$('#quoteGuests').value,date:$('#quoteDate').value,budget:$('#quoteBudget').value,services,notes:$('#quoteNotes').value.trim(),status:'Recebido',clientEmail:user()?.email||'',clientName:user()?.name||''});write(KEYS.quotes,items);e.target.reset();renderQuotes();renderOrganizer();toast('Solicitação de orçamento salva.');});
  $('#servicesToQuote').addEventListener('click',()=>{const chosen=$$('.service-select-grid input:checked').map(input=>input.value);switchPanel('orcamentoPanel');const boxes=$$('input[name="service"]');boxes.forEach(box=>box.checked=chosen.some(value=>value.toLowerCase().includes(box.value.toLowerCase())||box.value.toLowerCase().includes(value.toLowerCase())));});

  function quotesForCurrent(){const all=getQuotes(),current=user();return current?.role==='organizador'?all:all.filter(item=>!item.clientEmail||item.clientEmail===current?.email)}
  function csvCell(value){return '"'+String(value??'').replace(/"/g,'""')+'"'}
  function downloadCSV(){const items=quotesForCurrent();if(!items.length){toast('Ainda não há solicitações para exportar.');return;}const headers=['Cliente','E-mail','Tipo de evento','Espaço','Convidados','Data','Faixa de orçamento','Serviços','Observações','Status'];const lines=[headers.map(csvCell).join(','),...items.map(item=>[item.clientName,item.clientEmail,item.type,item.space,item.guests,item.date,item.budget,(item.services||[]).join('; '),item.notes,item.status||'Recebido'].map(csvCell).join(','))];const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='up-eventos-orcamentos.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('CSV gerado para download.');}
  $$('[data-export-quotes]').forEach(button=>button.addEventListener('click',downloadCSV));
  $$('[data-print-quotes]').forEach(button=>button.addEventListener('click',()=>{if(!quotesForCurrent().length){toast('Não há solicitações para imprimir.');return;}window.print();}));

  // Pesquisa de espaços com filtros, favoritos e atalho para incluir no orçamento.
  const getFavorites=()=>read('up_eventos_favorite_spaces',[]);
  function renderFavorites(){const host=$('#favoriteSpacesList');if(!host)return;const fav=getFavorites();host.innerHTML=fav.length?fav.map(name=>`<div class="saved-entry"><div><b>${escapeHTML(name)}</b><small>Espaço demonstrativo salvo</small></div><button type="button" data-remove-favorite="${escapeHTML(name)}">Remover</button></div>`).join(''):'Nenhum favorito salvo.';$$('[data-remove-favorite]',host).forEach(b=>b.addEventListener('click',()=>{write('up_eventos_favorite_spaces',getFavorites().filter(n=>n!==b.dataset.removeFavorite));renderFavorites();toast('Favorito removido.');}));}
  function filterSpaces(){const query=($('#spaceSearch')?.value||'').toLowerCase().trim(),type=$('#spaceTypeFilter')?.value||'todos',cap=Number($('#spaceCapacityFilter')?.value||0);$$('.space-result').forEach(card=>{const matchesText=(card.dataset.name+' '+card.innerText).toLowerCase().includes(query),matchesType=type==='todos'||card.dataset.type===type||(card.dataset.tags||'').toLowerCase().split(/\s+/).includes(type),capacity=Number(card.dataset.capacity||0),matchesCap=!cap||(cap===301?capacity>300:capacity<=cap);card.hidden=!(matchesText&&matchesType&&matchesCap);});}
  ['#spaceSearch','#spaceTypeFilter','#spaceCapacityFilter'].forEach(s=>$(s)?.addEventListener('input',filterSpaces));
  $$('[data-favorite-space]').forEach(btn=>btn.addEventListener('click',()=>{const name=btn.dataset.favoriteSpace,favs=getFavorites();if(favs.includes(name)){write('up_eventos_favorite_spaces',favs.filter(n=>n!==name));btn.textContent='♡ Salvar favorito';toast('Favorito removido.');}else{favs.push(name);write('up_eventos_favorite_spaces',favs);btn.textContent='♥ Salvo';toast('Espaço salvo nos favoritos.');}renderFavorites();}));
  $$('[data-quote-space]').forEach(btn=>btn.addEventListener('click',()=>{const space=btn.dataset.quoteSpace;switchPanel('orcamentoPanel');const field=$('#quoteSpace');if(field)field.value=space;toast('Espaço adicionado ao orçamento.');}));
  renderFavorites();
  // Public gallery: click images to open a larger view.
  const lightbox=$('#publicLightbox'),lightboxImage=$('#publicLightboxImage');
  $$('[data-lightbox]').forEach(btn=>btn.addEventListener('click',()=>{if(!lightbox)return;lightboxImage.src=btn.dataset.lightbox;lightbox.hidden=false;document.body.style.overflow='hidden';}));
  $('#closePublicLightbox')?.addEventListener('click',()=>{lightbox.hidden=true;lightboxImage.src='';document.body.style.overflow='';});
  lightbox?.addEventListener('click',e=>{if(e.target===lightbox){lightbox.hidden=true;lightboxImage.src='';document.body.style.overflow='';}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lightbox&&!lightbox.hidden){lightbox.hidden=true;lightboxImage.src='';document.body.style.overflow='';}});
  // Fade-in effects borrowed from the original UP landing page, kept subtle.
  if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target);}}),{threshold:.12});$$('.section-heading,.space-card,.service-item,.public-gallery-item,.intro>*').forEach(el=>{el.classList.add('reveal-item');observer.observe(el);});}

  // Mantém as ferramentas protegidas: se a sessão não existir, a área de trabalho não é exibida.
  if(user()) { /* A sessão permanece salva neste navegador; o usuário pode sair pelo botão Sair. */ }
})();

// Fallback visual if an external inspiration photo cannot be loaded.
document.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.dataset.failed='true';img.style.background='#272019';img.style.objectFit='contain';img.style.padding='10px';if(!img.alt.includes('indisponível'))img.alt+=' (imagem indisponível)';img.removeAttribute('src');},{once:true}));
