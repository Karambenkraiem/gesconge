# GesConge mobile — Android & iOS

L'app web (Next.js SSR + API routes) n'est pas exportable en site statique,
donc l'app mobile embarque un WebView natif (Capacitor) qui charge directement
`https://gesconge.alkaramsoft.ovh`. C'est l'approche la plus fiable ici : pas
de double build à maintenir, chaque mise à jour du site est immédiatement
disponible dans l'app sans repasser par le Play Store / App Store.

Config déjà en place dans le repo :
- `frontend/capacitor.config.ts` — pointe vers `gesconge.alkaramsoft.ovh`
- `frontend/mobile-www/index.html` — écran de secours minimal (webDir requis par Capacitor)
- `frontend/package.json` — dépendances `@capacitor/*` (v8) + scripts `android:*`

### Compatibilité vérifiée
- **Auth, appels API, upload de fichier** : fonctionnent nativement dans le WebView (JWT en localStorage, appels same-origin, `<input type="file">` standard) — aucun ajustement nécessaire.
- **Visualisation du certificat médical** : corrigée pour s'afficher dans une visionneuse intégrée à la page plutôt que via `window.open()`, qui ne fonctionne pas de façon fiable dans un WebView Capacitor.
- **Impression du formulaire de congé** (`window.print()` n'a pas de dialogue natif dans un WebView) : remplacée par [`@capgo/capacitor-printer`](https://capgo.app/docs/plugins/printer/) (`Printer.printWebView()`), qui déclenche l'impression native iOS/Android tout en gardant le dialogue navigateur classique sur le site web. C'est ce qui a motivé le passage de Capacitor 6 → 8 (seule version supportée par ce plugin).

---

## Android — buildable dès aujourd'hui

Prérequis sur votre machine : Node.js 20+, [Android Studio](https://developer.android.com/studio) (fournit le SDK + Gradle).

```bash
cd frontend
npm install

# Génère le projet natif frontend/android/ (une seule fois)
npm run android:add

# Recopie la config web dans le projet natif (à refaire après chaque
# changement de capacitor.config.ts, icône, etc.)
npm run android:sync

# Ouvre le projet dans Android Studio
npm run android:open
```

Dans Android Studio :
1. **Build → Generate Signed Bundle / APK**.
2. Créer un keystore (`.jks`) si vous n'en avez pas — **conservez-le précieusement**, il est requis pour toute mise à jour future publiée sur le Play Store.
3. Choisir **Android App Bundle (.aab)** pour une publication Play Store, ou **APK** pour une distribution directe (site web, email).

### Config requise par le plugin d'impression (après `npm run android:add`)
Ajoutez dans `frontend/android/app/proguard-rules.pro` :
```pro
-keep class com.capgo.printer.** { *; }
```
Et dans `frontend/android/variables.gradle`, dans le bloc `ext { ... }` :
```gradle
androidxDocumentFileVersion = '1.0.1'
androidxPrintVersion = '1.0.0'
```
(Uniquement nécessaire une fois, après la génération du projet natif — sinon l'impression pourrait échouer en build release à cause du ProGuard.)

### Icônes / splash screen
Remplacer les icônes par défaut avec l'outil officiel :
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate --android
```
en partant des fichiers déjà présents (`frontend/public/icon-512.png`).

### Notifications push (optionnel)
`@capacitor/push-notifications` est déjà en dépendance. Ça nécessite un
projet Firebase (FCM) — à mettre en place seulement si les notifications
in-app actuelles (polling 30s) ne suffisent pas.

### Publication Play Store
- Compte développeur Google : 25 $ (paiement unique).
- Remplir la fiche store (captures d'écran, description, politique de confidentialité — obligatoire même pour une app interne).
- Si l'app est réservée à votre entreprise, publier en **test fermé / interne** plutôt qu'en public : pas de revue prolongée, distribution par lien ou liste d'emails.

---

## iOS — plan (nécessite un Mac + Xcode, non disponible ici)

Même approche Capacitor, sur une machine macOS :

```bash
cd frontend
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Dans Xcode :
1. **Signing & Capabilities** → sélectionner votre équipe Apple Developer.
2. Configurer le bundle ID (`dz.gesconge.app`, doit matcher `capacitor.config.ts`).
3. **Product → Archive** → distribuer via App Store Connect ou en interne (TestFlight).

### Points d'attention iOS
- Compte Apple Developer : 99 $/an (obligatoire, y compris pour une distribution interne via TestFlight).
- `NSAppTransportSecurity` : le site étant en HTTPS avec certificat Let's Encrypt valide, aucune exception ATS n'est nécessaire.
- Revue App Store généralement plus stricte que Google Play pour les WebViews "pures" — prévoir de justifier la valeur native de l'app (notifications push, accès offline minimal) si publication publique. Pour un usage interne à l'entreprise, TestFlight (jusqu'à 10 000 testeurs, sans revue complète) est largement suffisant et évite ce risque.

### Alternative sans Mac
Un service cloud de build iOS (ex. Codemagic, Bitrise, ou GitHub Actions avec un runner `macos-latest`) permet de générer l'IPA sans machine Apple physique. À évaluer si l'achat d'un Mac n'est pas une option — je peux préparer ce pipeline si vous le souhaitez.
