# SafeSpeak — migratiebasis (fase 1)

Deze map is een **eerste migratiestap**, geen volledige vervanging van de Google Apps Script-app. De huidige versie bevat een Vite-frontend met Supabase e-mail/wachtwoord-authenticatie en de Fioretti-domeincontrole in de gebruikersinterface. De server-side `Before User Created`-hook die in Supabase is ingesteld, hoort de echte domeinbeveiliging te verzorgen.

## 1. Lokaal draaien

1. Installeer Node.js LTS.
2. Maak een kopie van `.env.example` met de naam `.env.local`.
3. Vul `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in vanuit Supabase → Project Settings → API.
4. Voer in deze map uit:

   ```bash
   npm install
   npm run dev
   ```

5. Open de lokale URL die Vite toont.

Gebruik alleen de publishable/anon key in de browser. **Nooit** de `service_role`- of secret key in frontendbestanden, GitHub of Vercel client variables.

## 2. Supabase-auth

- E-mailprovider moet aanstaan.
- E-mailbevestiging moet aanstaan.
- De `Before User Created`-hook moet gekoppeld zijn aan `public.restrict_fioretti_signup`.
- Authentication → URL Configuration: voeg later de lokale ontwikkel-URL en de uiteindelijke Vercel-domeinnaam toe aan Redirect URLs.
- De frontend controleert het e-maildomein voor gebruiksgemak; dit is **geen** beveiligingsgrens. De hook is de server-side controle.

## 3. Belangrijke beperking

De oorspronkelijke app gebruikt `google.script.run` en Google Sheets voor feedback, klassen, docentaccounts en moderatoracties. Deze eerste migratiebasis vervangt nog niet al die functies. Gebruik deze versie nog niet met echte leerlingen/feedback. Voor de volgende fase moeten de database policies (RLS) worden nagekeken, profiel-aanmaak worden ingericht, de roltoekenning voor docenten/moderatoren veilig worden gemaakt en alle oorspronkelijke functies worden overgezet.

## 4. Huidige oorspronkelijke bestanden

De map `original-CSS-reference.html` is alleen een referentiekopie van de oude CSS. De oorspronkelijke HTML-bestanden moeten stapsgewijs worden gemigreerd; ze zijn niet rechtstreeks uitvoerbaar in Vite omdat ze Apps Script-template-syntax gebruiken.
