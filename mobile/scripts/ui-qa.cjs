/* Run with Expo on 8088, EXPO_NO_DOTENV=1 and EXPO_PUBLIC_API_ORIGIN=http://127.0.0.1:8090:
 * env -u ELECTRON_RUN_AS_NODE electron --no-sandbox scripts/ui-qa.cjs
 * This isolated HTTP fixture never changes the user's backend/database.
 */
const { app, BrowserWindow, session } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const results = [], errors = [], requests = [];
let authenticated = false, uncertain = false, failMetrics = false;
let win, server;
const category = { id: randomUUID(), name: 'Essenciais', products: [] };
let categories = [category, { id: randomUUID(), name: 'Coleção vazia', products: [] }];
let products = Array.from({ length: 15 }, (_, i) => ({
  id: randomUUID(), name: `Produto ${String(i + 1).padStart(2, '0')}`, price: 25 + i * 10,
  category: { id: category.id, name: category.name }, photo: null,
  stock_quantity: i === 2 ? 0 : i === 1 ? 2 : 12, cost_price: 10,
  created_at: '2026-11-03T10:00:00', updated_at: '2026-11-03T10:00:00', active: i !== 14,
}));
const receipts = new Map();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const js = source => win.webContents.executeJavaScript(source, true);
async function until(source) {
  for (let i = 0; i < 100; i++) { if (await js(source)) return; await wait(120); }
  throw new Error(`Timeout: ${source}`);
}
function check(name, passed) { console.log((passed ? 'PASS ' : 'FAIL ') + name); results.push({ name, passed: !!passed }); if (!passed) throw new Error(name); }
async function clickLabel(label) {
  await until(`!!document.querySelector('[aria-label="${label}"]')`);
  await js(`document.querySelector('[aria-label="${label}"]').click();true`); await wait(250);
}
async function clickText(label) {
  await until(`Array.from(document.querySelectorAll('[role="button"],[role="radio"],button')).some(e=>e.textContent.replace(/[\uE000-\uF8FF]/g,'').trim()===${JSON.stringify(label)}&&!e.disabled&&e.getAttribute('aria-disabled')!=='true')`);
  await js(`Array.from(document.querySelectorAll('[role="button"],[role="radio"],button')).find(e=>e.textContent.replace(/[\uE000-\uF8FF]/g,'').trim()===${JSON.stringify(label)}&&!e.disabled&&e.getAttribute('aria-disabled')!=='true').click();true`); await wait(250);
}
async function input(label, value) {
  await js(`(()=>{const e=document.querySelector('[aria-label="${label}"]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`); await wait(100);
}
async function go(route = '/') { await win.loadURL(`http://127.0.0.1:8090${route}`); await wait(700); }
async function shot(name) { await wait(400); fs.writeFileSync(`/tmp/catapult-expo-${name}.png`, (await win.webContents.capturePage()).toPNG()); }
function syncCategories() { return categories.map(c => ({ ...c, products: products.filter(p => p.category.id === c.id).map(({id,name,price,photo}) => ({id,name,price,photo})) })); }
async function api(req, res) {
  const url = new URL(req.url, 'http://qa');
  const route = url.pathname.slice(4), method = req.method;
  let raw = ''; for await (const chunk of req) raw += chunk;
  let body = {}; try { body = JSON.parse(raw || '{}'); } catch {}
  requests.push({ route, method, body, query: url.search });
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(data === undefined ? '' : JSON.stringify(data)); };
  if (route === '/auth/check') return json(authenticated ? 200 : 401, authenticated ? { authenticated: true, username: 'admin' } : {});
  if (route === '/login') { authenticated = body.username === 'admin' && body.password === 'admin'; return json(authenticated ? 200 : 401, authenticated ? { username: 'admin', message: 'OK' } : {}); }
  if (route === '/logout') { authenticated = false; return json(200, { message: 'OK' }); }
  if ((route.startsWith('/dashboard') || method !== 'GET' && route !== '/checkout') && !authenticated) return json(401, {});
  if (route === '/categories' && method === 'GET') return json(200, syncCategories());
  if (route === '/categories' && method === 'POST') { const c = { id: randomUUID(), name: body.name, products: [] }; categories.push(c); return json(201, c); }
  if (route.startsWith('/categories/')) {
    const id = route.split('/')[2], c = categories.find(c => c.id === id);
    if (!c) return json(404, {});
    if (method === 'DELETE') { if (products.some(p => p.category.id === id)) return json(409, {}); categories = categories.filter(c => c.id !== id); return json(204); }
    if (method === 'PUT') { c.name = body.name; products.forEach(p => { if (p.category.id === id) p.category.name = body.name; }); }
    return json(200, syncCategories().find(c => c.id === id));
  }
  if (route === '/products' && method === 'GET') {
    let data = products.filter(p => (!url.searchParams.has('active') || p.active === (url.searchParams.get('active') === 'true')) && (!url.searchParams.get('nome') || p.name.toLowerCase().includes(url.searchParams.get('nome').toLowerCase())) && (!url.searchParams.get('category_id') || p.category.id === url.searchParams.get('category_id')));
    const stock = url.searchParams.get('stock_status');
    data = data.filter(p => !stock || (stock === 'OUT_OF_STOCK' ? p.stock_quantity === 0 : stock === 'LOW_STOCK' ? p.stock_quantity > 0 && p.stock_quantity <= 5 : p.stock_quantity > 5));
    if (url.searchParams.has('has_photo')) data = data.filter(p => Boolean(p.photo) === (url.searchParams.get('has_photo') === 'true'));
    if (url.searchParams.has('min_price')) data = data.filter(p => p.price >= Number(url.searchParams.get('min_price')));
    if (url.searchParams.has('max_price')) data = data.filter(p => p.price <= Number(url.searchParams.get('max_price')));
    const sort = url.searchParams.get('sort'); data.sort((a,b) => sort === 'price,desc' ? b.price-a.price : sort === 'price,asc' ? a.price-b.price : a.name.localeCompare(b.name));
    const size = Number(url.searchParams.get('size') || 10), number = Number(url.searchParams.get('page') || 0);
    return json(200, { content: data.slice(number*size, (number+1)*size), totalElements: data.length, totalPages: Math.ceil(data.length/size), number, size, first: number === 0, last: (number+1)*size >= data.length });
  }
  if (route.startsWith('/products/')) {
    const id = route.split('/')[2], p = products.find(p => p.id === id);
    if (!p) return json(404, {});
    if (route.endsWith('/stock') && method === 'PATCH') { p.stock_quantity = body.stock_quantity; return json(200, p); }
    if (method === 'DELETE') { products = products.filter(p => p.id !== id); return json(204); }
    if (method === 'PUT') { Object.assign(p, body, { category: { id: body.category_id, name: categories.find(c => c.id === body.category_id).name }, photo: null }); }
    return json(200, p);
  }
  if (route.startsWith('/dashboard')) {
    if (failMetrics && route.endsWith('products-by-category')) return json(500, {});
    if (route.endsWith('summary')) return json(200, { total_products: products.length, total_categories: categories.length, total_inventory_value: products.reduce((s,p)=>s+p.price*p.stock_quantity,0), average_product_price: products.reduce((s,p)=>s+p.price,0)/products.length, products_without_photo: products.filter(p=>!p.photo).length, low_stock_count: products.filter(p=>p.stock_quantity<=5).length });
    if (route.endsWith('products-by-category')) return json(200, syncCategories().map(c=>({ category_id:c.id, category_name:c.name, product_count:c.products.length, total_value:products.filter(p=>p.category.id===c.id).reduce((s,p)=>s+p.price*p.stock_quantity,0) })));
    return json(200,[{range:'R$ 0 - R$ 50',count:3},{range:'R$ 51 - R$ 200',count:12},{range:'R$ 201+',count:0}]);
  }
  if (route === '/checkout') {
    if (receipts.has(body.request_id)) return json(200, receipts.get(body.request_id));
    if (body.items.some(i => { const p=products.find(p=>p.id===i.product_id); return !p || !p.active || p.stock_quantity<i.quantity; })) return json(409, {});
    const receipt = { id:body.request_id, total:0, item_count:0 };
    for (const item of body.items) { const p=products.find(p=>p.id===item.product_id); p.stock_quantity-=item.quantity; receipt.total+=p.price*item.quantity; receipt.item_count+=item.quantity; }
    receipts.set(body.request_id,receipt);
    if (uncertain) { uncertain=false; return json(503, {}); }
    return json(200,receipt);
  }
  return json(404, {});
}
app.disableHardwareAcceleration();
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'catapult-expo-qa-')));
app.whenReady().then(async () => {
  server = http.createServer((req,res) => {
    if (req.url.startsWith('/api/')) { res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'http://127.0.0.1:8090'); res.setHeader('Access-Control-Allow-Credentials', 'true'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS'); if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; } api(req,res).catch(e=>{console.error(e);res.writeHead(500);res.end();}); return; }
    const upstream = http.request({hostname:'127.0.0.1',port:8088,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:8088'}}, response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
    upstream.on('error',()=>{res.writeHead(502);res.end('Start Expo on port 8088');});req.pipe(upstream);
  });
  await new Promise(resolve=>server.listen(8090,'127.0.0.1',resolve));
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://127.0.0.1:8080/api/*'] }, (details, callback) => callback({ redirectURL: details.url.replace('http://127.0.0.1:8080', 'http://127.0.0.1:8090') }));
  win = new BrowserWindow({show:false,width:390,height:844,webPreferences:{offscreen:true,backgroundThrottling:false,sandbox:true,contextIsolation:true,nodeIntegration:false}});
  win.webContents.on('console-message', event=>{ if(event.level==='error'&&!event.message.includes('401')&&!event.message.includes('409')&&!event.message.includes('500')&&!event.message.includes('ERR_EMPTY_RESPONSE')) errors.push(event.message); });
  try {
    await go();await until(`document.body.innerText.includes('Produto 01')`);
    check('catalog requests active products on server',requests.some(r=>r.route==='/products'&&r.query.includes('active=true')));
    check('inactive products hidden',!await js(`document.body.innerText.includes('Produto 15')`));
    for (const width of [320,390,768]) { win.setContentSize(width,844); await wait(200); check(`catalog fits ${width}px`,await js('document.documentElement.scrollWidth<=innerWidth')); }
    win.setContentSize(390,844);await clickLabel('Escolher tema');await clickText('Claro');await shot('catalog-light');
    await clickText('Filtrar');await input('Preço mínimo','200');await input('Preço máximo','10');await clickText('Aplicar filtros');
    check('price range validation',await js(`document.body.innerText.includes('O preço mínimo não pode ser maior')`));await clickText('Limpar');await clickText('Aplicar filtros');
    await clickLabel('Escolher tema');await clickText('Escuro');await shot('catalog-dark');await clickLabel('Escolher tema');await clickText('Claro');
    const buy = `Array.from(document.querySelectorAll('[role="button"]')).find(e=>e.textContent.replace(/[\uE000-\uF8FF]/g,'').trim()==='Comprar')`;
    await js(`${buy}.click();true`);await js(`${buy}.click();true`);await wait(300);
    await clickLabel('Abrir sacola, 2 itens');await until(`document.body.innerText.includes('Finalizar compra')`);await shot('bag');
    check('bag quantity and subtotal',await js(`document.body.innerText.includes('50,00')`));
    uncertain=true;await clickText('Finalizar compra');await until(`document.body.innerText.includes('Ainda não foi possível confirmar')`);
    check('stock deducted once after uncertain server result',products[0].stock_quantity===10);
    const pendingID=requests.filter(r=>r.route==='/checkout').at(-1).body.request_id;
    await win.reload();await wait(900);await until(`document.body.innerText.includes('Confirmar resultado da compra')`);
    await clickText('Confirmar resultado da compra');await until(`document.body.innerText.includes('Tudo certo com sua escolha.')`);
    check('pending purchase survives reload and reuses ID',requests.filter(r=>r.route==='/checkout').at(-1).body.request_id===pendingID&&products[0].stock_quantity===10);await shot('receipt');
    await go();await until(`document.body.innerText.includes('Produto 01')`);await js(`${buy}.click();true`);await wait(200);await clickLabel('Abrir sacola, 1 itens');await wait(300);products[0].stock_quantity=0;await clickText('Finalizar compra');await until(`document.body.innerText.includes('A disponibilidade mudou')`);await until(`document.body.innerText.includes('Remover da sacola')`);
    check('stock conflict leaves bag for correction',await js(`document.body.innerText.includes('Produto 01')`));await clickText('Remover da sacola');await until(`document.body.innerText.includes('Uma boa escolha começa aqui.')`);
    await go('/login');await until(`!!document.querySelector('[aria-label="Usuário"]')`);await input('Usuário','admin');await input('Senha','wrong');await clickText('Entrar');await until(`document.body.innerText.includes('Usuário ou senha incorretos.')`);check('invalid login handled',!authenticated);
    await input('Senha','admin');await clickText('Entrar');await until(`document.body.innerText.includes('Valor em estoque')`);await shot('dashboard');
    await clickText('Ver estoque baixo');await until(`document.body.innerText.includes('Produto 02')`);check('dashboard shortcut applies stock filter',requests.some(r=>r.route==='/products'&&r.query.includes('stock_status=LOW_STOCK')&&r.query.includes('size=10')));
    await go('/admin/categories');await until(`document.body.innerText.includes('Uma visão de cada categoria.')`);await shot('categories');
    await clickText('Visualizar');await until(`document.body.innerText.includes('produtos vinculados')`);check('category detail includes linked products',await js(`document.body.innerText.includes('Produto 01')`));await clickLabel('Fechar');
    await clickLabel('Nova categoria');await input('Nome da categoria','Nova coleção');await clickText('Criar categoria');await until(`document.body.innerText.includes('Categoria salva.')`);check('category creation refreshes list',categories.some(c=>c.name==='Nova coleção'));
    await clickLabel('Editar Nova coleção');await input('Nome da categoria','Coleção atualizada');await clickText('Salvar alterações');await until(`document.body.innerText.includes('Coleção atualizada')`);check('category rename',categories.some(c=>c.name==='Coleção atualizada'));
    await clickLabel('Excluir Essenciais');await clickText('Excluir categoria');await until(`document.body.innerText.includes('Mova ou exclua os produtos')`);check('linked category conflict retains category',categories.some(c=>c.id===category.id));
    await clickLabel('Excluir Coleção atualizada');await clickText('Excluir categoria');await until(`document.body.innerText.includes('Categoria excluída.')`);check('empty category deletion',!categories.some(c=>c.name==='Coleção atualizada'));
    await input('Buscar categoria','sem correspondência');await until(`document.body.innerText.includes('Nenhuma categoria encontrada.')`);await clickText('Limpar busca');
    await clickText('Ver produtos');await until(`document.body.innerText.includes('Produto 01')`);check('category shortcut applies category filter',requests.some(r=>r.route==='/products'&&r.query.includes(category.id)&&r.query.includes('size=10')));
    await clickLabel('Aumentar estoque de Produto 01');await clickLabel('Aumentar estoque de Produto 01');await wait(700);check('rapid stock taps coalesced and saved',products[0].stock_quantity===2);
    await go('/admin/products');await until(`document.body.innerText.includes('Produto 01')`);await clickLabel('Próxima página');await until(`document.body.innerText.includes('Produto 11')`);check('admin pagination',await js(`document.body.innerText.includes('Página 2 de 2')`));
    await go('/products/'+products[1].id);await until(`document.body.innerText.includes('Adicionar à sacola')`);check('public detail excludes private cost',!await js(`document.body.innerText.includes('Custo')`));
    failMetrics=true;await go('/admin');await until(`document.body.innerText.includes('O servidor encontrou')`);check('partial dashboard failure keeps summary',await js(`document.body.innerText.includes('Valor em estoque')`));failMetrics=false;
    authenticated=false;await go('/admin');await until(`document.body.innerText.includes('Painel do administrador')`);check('anonymous admin guard',await js(`!!document.querySelector('[aria-label="Senha"]')`));
    check('no unexpected browser errors',errors.length===0);
    console.log(JSON.stringify({results,errors},null,2));server.close();app.exit(0);
  } catch(error) { await shot('failure');console.error(error);console.log(JSON.stringify({results,errors,body:await js('document.body.innerText')},null,2));server.close();app.exit(1); }
});
