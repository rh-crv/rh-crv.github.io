// Configuração do app — conexão com o Supabase.
// Estes dois valores são públicos por natureza (ficam no app). A segurança está nas travas do banco.
window.CRV_CONFIG = {
  SUPABASE_URL: 'https://czyvbqxwkviccdfzuouk.supabase.co',
  SUPABASE_KEY: 'sb_publishable_EeolMYcoC3szvl2R1k_paw_QOJDAyKV',
  // domínio interno usado para transformar "usuário" em login (ninguém precisa ter este e-mail)
  DOMINIO_LOGIN: 'crv-gp.app',
  // chave pública das notificações push (Web Push/VAPID). É pública por natureza; a privada fica só no Supabase.
  VAPID_PUBLICA: 'BNSqbXya2tXAIM6Zz8Da1zC6BkGQebTleB7gzUPYnYCOza53nkHd2tVQ2NC_T6fdUBZOeBVsqx37wNziw8M6c4Y',
  VERSAO: '1.100.31'
};
