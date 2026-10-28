import { createClient } from '@supabase/supabase-js';

const $ = (id) => document.getElementById(id);
const config = window.SAFESPEAK_CONFIG || {};
const supabaseUrl = config.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = config.supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY;
let supabase;
let mode = 'login';

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }
function message(text, type = '') { const el=$('auth-message'); el.textContent=text; el.className=`message ${type}`; show('auth-message'); }
function switchMode(next) {
  mode=next;
  $('tab-login').classList.toggle('active',mode==='login');
  $('tab-signup').classList.toggle('active',mode==='signup');
  $('name-fields').classList.toggle('hidden',mode!=='signup');
  $('password').autocomplete=mode==='login'?'current-password':'new-password';
  $('submit-auth').textContent=mode==='login'?'Inloggen':'Account maken';
  hide('auth-message');
}
function friendlyError(error) {
  const text=(error?.message||'Onbekende fout').toLowerCase();
  if(text.includes('fiorettileerling.nl')||text.includes('schoolmailadres')) return 'Gebruik je Fioretti-school-e-mailadres (@fiorettileerling.nl).';
  if(text.includes('invalid login credentials')) return 'E-mailadres of wachtwoord klopt niet.';
  if(text.includes('already registered')) return 'Er bestaat al een account met dit e-mailadres. Probeer in te loggen.';
  if(text.includes('email not confirmed')) return 'Bevestig eerst je e-mailadres via de e-mail die je hebt ontvangen.';
  return error?.message || 'Er ging iets mis. Probeer het opnieuw.';
}
async function renderSession(session) {
  hide('loading');
  if(!session?.user){show('auth-view');hide('app-view');return;}
  hide('auth-view');show('app-view');
  const user=session.user;
  $('user-email').textContent=user.email||'';
  $('avatar').textContent=(user.user_metadata?.voornaam||user.email||'S').slice(0,1).toUpperCase();
  let profile=null;
  const {data,error}=await supabase.from('profiles').select('role,voornaam,achternaam,username').eq('id',user.id).maybeSingle();
  if(!error) profile=data;
  if(profile){
    $('welcome').textContent=`Welkom${profile.voornaam?`, ${profile.voornaam}`:''}`;
    $('role-title').textContent=({leerling:'Leerlingaccount',docent:'Docentenaccount',moderator:'Moderatoraccount'})[profile.role]||'SafeSpeak-account';
    $('role-description').textContent='Je bent ingelogd. De beschikbare functies zijn afhankelijk van je rol.';
    hide('profile-warning');
  }else{
    $('welcome').textContent='Welkom bij SafeSpeak';
    $('role-title').textContent='Account aangemaakt';
    $('role-description').textContent='Je e-mailadres is aangemeld.';
    $('profile-warning').textContent='Je profiel is nog niet aangemaakt of kan niet worden gelezen. De beheerder moet de profiel-aanmaak en toegangsregels controleren voordat de app gebruikt kan worden.';
    show('profile-warning');
  }
}
async function init(){
  if(!supabaseUrl||!supabaseAnonKey){hide('loading');show('auth-view');$('auth-form').classList.add('hidden');message('Configuratie ontbreekt. Volg README.md om VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in te stellen.');return;}
  supabase=createClient(supabaseUrl,supabaseAnonKey);
  const {data:{session}}=await supabase.auth.getSession();
  await renderSession(session);
  supabase.auth.onAuthStateChange((_event,newSession)=>{renderSession(newSession);});
}
$('tab-login').addEventListener('click',()=>switchMode('login'));
$('tab-signup').addEventListener('click',()=>switchMode('signup'));
$('auth-form').addEventListener('submit',async(e)=>{
  e.preventDefault();
  if(!supabase){message('Supabase-configuratie ontbreekt.');return;}
  const email=$('email').value.trim().toLowerCase();
  const password=$('password').value;
  if(!email.endsWith('@fiorettileerling.nl')){message('Gebruik een e-mailadres dat eindigt op @fiorettileerling.nl.');return;}
  const btn=$('submit-auth');btn.disabled=true;btn.textContent='Even wachten…';hide('auth-message');
  try{
    if(mode==='signup'){
      const voornaam=$('first-name').value.trim(), achternaam=$('last-name').value.trim();
      if(!voornaam||!achternaam) throw new Error('Vul je voornaam en achternaam in.');
      const {data,error}=await supabase.auth.signUp({email,password,options:{data:{voornaam,achternaam}}});
      if(error) throw error;
      if(data.session) await renderSession(data.session);
      else message('Accountaanvraag ontvangen. Controleer je schoolmail en bevestig je e-mailadres voordat je inlogt.','success');
    }else{
      const {data,error}=await supabase.auth.signInWithPassword({email,password});
      if(error) throw error;
      await renderSession(data.session);
    }
  }catch(error){message(friendlyError(error));}
  finally{btn.disabled=false;btn.textContent=mode==='login'?'Inloggen':'Account maken';}
});
$('logout').addEventListener('click',async()=>{if(supabase){await supabase.auth.signOut();await renderSession(null);}});
init();
