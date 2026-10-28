// Configuração do app — conexão com o Supabase.
// Estes dois valores são públicos por natureza (ficam no app). A segurança está nas travas do banco.
window.CRV_CONFIG = {
  SUPABASE_URL: 'https://czyvbqxwkviccdfzuouk.supabase.co',
  SUPABASE_KEY: 'sb_publishable_EeolMYcoC3szvl2R1k_paw_QOJDAyKV',
  // domínio interno usado para transformar "usuário" em login (ninguém precisa ter este e-mail)
  DOMINIO_LOGIN: 'crv-gp.app',
  VERSAO: '1.99.75'
};
