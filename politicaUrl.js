export function classificarUrl(endereco, dominios) {
  // Rejeita entradas ambíguas antes da normalização feita por URL.
  if (typeof endereco !== 'string' || !/^https?:\/\//i.test(endereco) ||
      /[\s\\]/u.test(endereco)) {
    return 'bloquear';
  }

  try {
    const url = new URL(endereco);
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname ||
        url.username || url.password) {
      return 'bloquear';
    }

    if (dominios.includes(url.hostname)) {
      // Mesmo um domínio autorizado precisa usar HTTPS e a porta padrão.
      return url.protocol === 'https:' && !url.port ? 'interna' : 'bloquear';
    }

    return 'externa';
  } catch {
    return 'bloquear';
  }
}
