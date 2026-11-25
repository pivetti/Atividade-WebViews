import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { classificarUrl } from './politicaUrl';

export default function WebViewSegura({ pagina }) {
  const [fonte, setFonte] = useState({ uri: pagina.url, janela: 0 });
  const ultimaAbertura = useRef({ url: '', instante: 0 });

  function abrirExterno(url) {
    const agora = Date.now();
    // Evita duas aberturas quando o mesmo toque produz callbacks próximos.
    if (ultimaAbertura.current.url === url &&
        agora - ultimaAbertura.current.instante < 1500) return;
    ultimaAbertura.current = { url, instante: agora };
    Linking.openURL(url).catch(() => {
      Alert.alert('Não foi possível abrir o link', 'Verifique se há um navegador instalado.');
    });
  }

  function permitirNavegacao(requisicao) {
    const destino = classificarUrl(requisicao.url, pagina.dominios);
    if (destino === 'externa' && requisicao.isTopFrame !== false) {
      abrirExterno(requisicao.url);
    }
    return destino === 'interna';
  }

  function abrirNovaJanela({ nativeEvent }) {
    const destino = classificarUrl(nativeEvent.targetUrl, pagina.dominios);
    if (destino === 'interna') {
      // Reabre aqui mesmo se a nova janela apontar para a URL inicial já visitada.
      setFonte((anterior) => ({ uri: nativeEvent.targetUrl, janela: anterior.janela + 1 }));
    }
    if (destino === 'externa') abrirExterno(nativeEvent.targetUrl);
  }

  // No Android, onShouldStartLoadWithRequest não valida o primeiro carregamento.
  if (classificarUrl(pagina.url, pagina.dominios) !== 'interna' ||
      classificarUrl(fonte.uri, pagina.dominios) !== 'interna') {
    return <View style={styles.mensagem}><Text>Endereço inicial bloqueado.</Text></View>;
  }

  return (
    <SafeAreaView style={styles.tela} edges={['top', 'left', 'right']}>
      <WebView
        key={fonte.janela}
        style={styles.tela}
        source={{ uri: fonte.uri }}
        // '*' encaminha tudo ao nosso filtro e evita o Linking automático da biblioteca.
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={permitirNavegacao}
        onOpenWindow={abrirNovaJanela}
        setSupportMultipleWindows={true}
        javaScriptEnabled={pagina.javaScript}
        javaScriptCanOpenWindowsAutomatically={false}
        domStorageEnabled={false}
        mixedContentMode="never"
        allowFileAccess={false}
        allowFileAccessFromFileURLs={false}
        allowUniversalAccessFromFileURLs={false}
        thirdPartyCookiesEnabled={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.mensagem}><ActivityIndicator size="large" color="#176b3a" /></View>
        )}
        renderError={() => (
          <View style={styles.mensagem}>
            <Text>Não foi possível carregar a página. Verifique sua conexão e reabra o aplicativo.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#fff' },
  mensagem: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});
