# Segurança com WebViews

**Aluno:** Henrique Belgrovicz Pivetti  
**Disciplina:** Programação de Software e Aplicativos II  
**Professor:** Eduardo Alba  
**Instituição:** IFPR Campus Palmas  
**Atividade:** APS de 4 horas-aula

Aplicativo de consulta a páginas úteis para estudantes, com três abas e controle de navegação. Usa JavaScript, Expo SDK 58, React Native, React Navigation Bottom Tabs e react-native-webview 14.0.1. Abre diretamente no IFPR, com a página ocupando a área entre a barra de status e as abas.

## Instalar e executar

Requer Node.js 22.13 ou superior compatível com React Native 0.88, npm e Expo Go compatível com SDK 58 no celular.

```sh
git clone https://github.com/pivetti/Atividade-WebViews.git webviews-seguras
cd webviews-seguras
npm ci
npm start
```

Conecte computador e celular à mesma rede e leia o QR code pelo Expo Go no Android. No iPhone, use a câmera. Para um emulador Android já iniciado, execute `npm run android`. Este projeto usa WebViews nativas; a demonstração deve ser feita no Android ou iOS, não no navegador do computador.

## Páginas

| Aba | Endereço inicial | Hostname permitido | JavaScript |
| --- | --- | --- | --- |
| IFPR | https://ifpr.edu.br/palmas/ | `ifpr.edu.br` | Desligado |
| Python | https://docs.python.org/pt-br/3/ | `docs.python.org` | Desligado |
| Algoritmos | https://pt.wikipedia.org/wiki/Algoritmo | `pt.wikipedia.org` | Desligado |

Os três endereços responderam HTTP 200 sem mudança de domínio na conferência de 25/11/2026. Texto e links comuns funcionam sem scripts; menus interativos, buscas dinâmicas e vídeos incorporados podem ficar indisponíveis. O objetivo é consultar o conteúdo, não reproduzir todas as funcionalidades dos sites.

## Organização

- `App.js`: cria as três abas, seus ícones e a primeira tela.
- `paginas.js`: reúne títulos, URLs, domínios e configuração de JavaScript.
- `WebViewSegura.js`: valida a origem inicial, intercepta navegações e novas janelas e chama `Linking.openURL` para links externos.
- `politicaUrl.js`: função pequena, sem dependência de interface, que classifica as URLs; permite testar os casos de segurança diretamente.
- `tests/politicaUrl.test.mjs`: testes de URLs autorizadas, externas, malformadas e esquemas bloqueados.

## Pesquisa e fundamentação

**1. Propriedades de segurança.** Em `WebViewSegura.js`, `onShouldStartLoadWithRequest` autoriza ou recusa a navegação, enquanto `onOpenWindow` trata links com `target="_blank"`. `mixedContentMode="never"` bloqueia conteúdo HTTP em páginas HTTPS no Android; as três opções `allowFileAccess`, `allowFileAccessFromFileURLs` e `allowUniversalAccessFromFileURLs` desabilitam acessos a arquivos. `thirdPartyCookiesEnabled={false}` e `domStorageEnabled={false}` restringem recursos desnecessários. A lista real de domínios está em `paginas.js`: `originWhitelist={['*']}` apenas encaminha todas as origens ao filtro próprio, evitando que a biblioteca abra automaticamente esquemas fora de sua lista antes da validação.

**2. Interceptação de rotas.** `classificarUrl` usa `new URL`, confere o protocolo e compara o `hostname` inteiro com `dominios.includes`. Só HTTPS na porta padrão do domínio permitido entra na WebView; HTTP nesse domínio é bloqueado. Links HTTP/HTTPS de outros hosts recebem `false` no callback e uma chamada a `Linking.openURL`. Esquemas diferentes, URLs malformadas e credenciais embutidas são bloqueados sem abrir aplicativos. A origem inicial é conferida antes de montar a WebView, pois o Android não chama esse callback na primeira carga. Novas janelas passam pela mesma política: destinos internos atualizam `source`, externos seguem para o navegador. Uma referência impede aberturas repetidas da mesma URL em callbacks dentro de 1,5 segundo; `setSupportMultipleWindows` permanece habilitado.

**3. Execução de scripts.** `javaScriptEnabled` recebe `pagina.javaScript`, configurado como `false` nas três abas. Assim, os scripts das páginas não executam, inclusive links `javascript:`. O JavaScript do próprio aplicativo React Native continua funcionando. Não há `injectedJavaScript`, `injectJavaScript` nem ponte `onMessage` no aplicativo. `javaScriptCanOpenWindowsAutomatically={false}` também impede janelas automáticas por scripts. Essas escolhas atendem à consulta de textos e links HTML verificada no emulador.

**4. Riscos.** Permitir qualquer página pode apresentar phishing dentro de uma interface confiável; executar scripts desnecessários amplia a exposição a XSS, rastreamento e, quando existem pontes nativas ou acesso a arquivos, vazamento de dados. O projeto reduz essa exposição com domínios explícitos, HTTPS, scripts desativados e bloqueio de arquivos. A lista controla navegações, não funciona como filtro de todos os recursos de rede: imagens e outros recursos HTTPS de terceiros ainda podem ser solicitados pelos sites. Também não garante que um site autorizado nunca seja comprometido.

## Conferência

```sh
npm test
npx expo install --check
npx expo-doctor
npm run export:android
```

Conferido em 25/11/2026:

- Cinco testes da política de URLs aprovados, incluindo subdomínios, sufixos enganosos, credenciais, HTTP no domínio permitido e esquemas perigosos.
- Dependências compatíveis com SDK 58; Expo Doctor aprovado em 20/20 verificações.
- Exportação Android com Metro/Hermes concluída em `dist/`. Isso empacota o JavaScript e os recursos; não gera um APK.
- Expo Go executado no emulador Android 11/API 30: abas IFPR, Python e Algoritmos abertas; conteúdo consultado com JavaScript desligado.
- Na aba Python, “Tutorial” abriu dentro da WebView. No tutorial, `https://www.python.org/` abriu uma vez no navegador padrão do emulador, preservando a página do aplicativo. A abertura única foi conferida no registro de atividades do Android.
- No IFPR, “Conexão IFPR”, um link existente com `target="_blank"`, abriu uma vez fora do aplicativo. O emulador utiliza WebView Browser Tester como navegador padrão.

**A conferir no celular:** repetir o roteiro abaixo com seu navegador padrão e Android System WebView atualizado. Não houve teste em aparelho físico nem iOS. A navegação interna em nova janela foi implementada, mas não foi testada por toque em um link visível no emulador.

O `npm audit` registrou três entradas moderadas relacionadas à dependência transitiva `minimatch` usada por `@expo/fingerprint`. A correção automática proposta exige voltar para Expo 52, incompatível com a versão usada neste projeto.

## Demonstração de aproximadamente um minuto

1. **0–10 s:** abra o aplicativo e mostre a aba **IFPR**, já selecionada, com o portal do Campus Palmas e as três abas inferiores.
2. **10–25 s:** toque em **Python** e depois no link **Tutorial**, em “Seções da documentação”. Mostre “O tutorial do Python” dentro do app, com as abas ainda visíveis.
3. **25–40 s:** no texto inicial do tutorial, localize e toque em **https://www.python.org/**. O navegador padrão deve aparecer uma vez, enquanto o aplicativo mantém o tutorial. Use Voltar no Android para retornar.
4. **40–50 s:** toque em **Algoritmos** e mostre o artigo “Algoritmo” da Wikipédia. Explique que as três páginas são consultadas com JavaScript desligado.
5. **50–60 s:** mostre `paginas.js` e a comparação de `hostname` em `politicaUrl.js`. Explique que `WebViewSegura.js` bloqueia a navegação externa e chama `Linking`.

Para conferir novas janelas separadamente, na aba IFPR role até a seção de vídeos e toque em **Conexão IFPR**. O link aponta para o YouTube e deve abrir fora do app, sem substituir o portal.

## Material da disciplina

Enunciado: **Atividade WebView.pdf**. A organização dos componentes e das abas segue as aulas de componentes, hooks e navegação e o [exemplo do professor](https://github.com/eduardoalba0/Exemplo-RN-202602).

## Documentação consultada

- [react-native-webview 14.0.1 — propriedades](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/docs/Reference.md): `originWhitelist`, `onShouldStartLoadWithRequest`, `onOpenWindow`, scripts, arquivos e múltiplas janelas.
- [react-native-webview 14.0.1 — implementação do filtro e Linking](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/src/WebViewShared.tsx).
- [react-native-webview 14.0.1 — novas janelas no Android](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java).
- [OWASP MASTG — WebViews no Android](https://mas.owasp.org/MASTG/knowledge/android/MASVS-PLATFORM/MASTG-KNOW-0018/).
- [Expo SDK 58 — react-native-webview](https://docs.expo.dev/versions/v58.0.0/sdk/webview/).
- [React Navigation — Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/).
