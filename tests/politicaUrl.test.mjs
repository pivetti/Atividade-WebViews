import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classificarUrl } from '../politicaUrl.js';
import { paginas } from '../paginas.js';

test('todas as páginas iniciais usam HTTPS e o domínio autorizado', () => {
  assert.equal(paginas.length, 3);
  for (const pagina of paginas) {
    assert.equal(classificarUrl(pagina.url, pagina.dominios), 'interna');
  }
  assert.ok(paginas.some((pagina) => !pagina.javaScript));
});

test('aceita navegação interna, fragmentos e hostname normalizado', () => {
  for (const url of [
    'https://ifpr.edu.br/palmas/',
    'https://ifpr.edu.br/palmas/?busca=curso#conteudo',
    'https://IFPR.EDU.BR:443/palmas/',
  ]) assert.equal(classificarUrl(url, ['ifpr.edu.br']), 'interna');
});

test('links web de outros hosts são externos, inclusive imitações e subdomínios', () => {
  for (const url of [
    'https://www.python.org/',
    'http://example.org/',
    'https://ifpr.edu.br.exemplo.org/',
    'https://exemplo.org/?site=ifpr.edu.br',
    'https://sub.ifpr.edu.br/',
    'https://ifpr.edu.br./',
  ]) assert.equal(classificarUrl(url, ['ifpr.edu.br']), 'externa');
});

test('bloqueia esquemas perigosos, entradas inválidas e credenciais', () => {
  for (const url of [
    '', null, undefined, 42, '/palmas/', '//ifpr.edu.br/',
    'https://', 'https://[invalido', 'https:ifpr.edu.br',
    ' https://ifpr.edu.br/', 'https://ifpr.edu.br/\n',
    'https://ifpr.edu.br\\@exemplo.org/',
    'https://ifpr.edu.br@exemplo.org/',
    'https://usuario:senha@ifpr.edu.br/',
    'javascript:alert(1)', 'file:///etc/passwd', 'intent://abrir',
    'data:text/html,teste', 'about:blank', 'mailto:teste@ifpr.edu.br',
  ]) assert.equal(classificarUrl(url, ['ifpr.edu.br']), 'bloquear', String(url));
});

test('não aceita downgrade HTTP nem porta alternativa no domínio permitido', () => {
  assert.equal(classificarUrl('http://ifpr.edu.br/', ['ifpr.edu.br']), 'bloquear');
  assert.equal(classificarUrl('https://ifpr.edu.br:8443/', ['ifpr.edu.br']), 'bloquear');
});
