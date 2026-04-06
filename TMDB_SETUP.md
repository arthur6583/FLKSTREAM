# 🎬 Intégration TMDB - FLK STREAM

## Configuration de l'API TMDB

### 1. Obtenir une clé API (gratuit)

1. **Crée un compte** sur [The Movie Database (TMDB)](https://www.themoviedb.org/)
2. Va dans **Paramètres** (en haut à droite) > **API**
3. Clique sur **"Créer une clé"** dans la section API
4. Accepte les conditions d'utilisation
5. Choisis **"Développeur"** comme type de compte
6. Remplis le formulaire avec :
   - Nom : Ton nom
   - Prénom : Ton prénom
   - Adresse e-mail : La même que ton compte TMDB
   - Site web : `https://flk-stream.xo.je/` (ou laisse vide)
   - Description : "Site de streaming personnel"
7. Ta clé API s'affichera (une longue chaîne de caractères)

### 2. Configurer la clé dans le projet

1. Ouvre le fichier `tmdb.js`
2. Remplace `YOUR_TMDB_API_KEY` par ta clé API :
   ```javascript
   const TMDB_CONFIG = {
       apiKey: 'ta_clé_api_ici',
       // ...
   };
   ```
3. Sauvegarde le fichier
4. Rafraîchis ta page (F5 ou Cmd+R)

## Fonctionnalités activées

Une fois l'API configurée, les fonctionnalités suivantes seront actives :

### 📊 Dans la modale de chaque film :
- **Note TMDB** - Pourcentage de recommandation basé sur les votes
- **Durée** - Temps de lecture exact du film
- **Réalisateur** - Nom du réalisateur principal
- **Distribution** - Les 5 principaux acteurs
- **Mots-clés** - Tags thématiques du film
- **Bande-annonce** - Lien vers la trailer YouTube officielle
- **Nombre de votes** - Total des votes sur TMDB
- **Films similaires** - 4 films recommandés cliquables
- **Backdrop HD** - Image de fond haute qualité

### 🔍 Recherche enrichie
- Résultats combinés (locaux + TMDB)
- Jusqu'à 20 résultats pertinents
- Affichage des posters TMDB

### 🎯 Enrichissement automatique
- Les 5 premiers films sont enrichis au chargement
- Cache intelligent pour éviter les requêtes répétées
- Fallback sur les données locales en cas d'erreur

## Limites de l'API

- **40 requêtes / 10 secondes** (limite gratuite)
- Le système de cache minimise les appels API
- Les données sont mises en cache localement

## Dépannage

### "Erreur API TMDB" dans la console
- Vérifie que ta clé API est correcte
- Vérifie ta connexion internet
- Attends quelques secondes et réessaie

### Les données ne s'affichent pas
- Ouvre la console (F12) et vérifie les erreurs
- Assure-toi que `tmdb.js` est chargé avant `scripts.js`
- Vide le cache du navigateur (Cmd+Shift+R)

### "Too Many Requests"
- Tu as dépassé la limite de l'API
- Attends 10 secondes et rafraîchis la page
- Le cache devrait conserver les données précédentes

## Personnalisation

### Changer la langue
Dans `tmdb.js`, modifie :
```javascript
language: 'en-US' // ou 'es-ES', 'de-DE', etc.
```

### Nombre de films enrichis
Dans `tmdb.js`, ligne ~430 :
```javascript
// Enrichit les 10 premiers films au lieu de 5
for (let i = 0; i < Math.min(10, FLK_MOVIES_DATA.length); i++) {
```

### Désactiver l'enrichissement automatique
Commente l'appel à `initTMDB()` à la fin du fichier `tmdb.js`

## Ressources

- [Documentation API TMDB](https://developers.themoviedb.org/3)
- [Images TMDB](https://www.themoviedb.org/talk/5d28c0860e0a2600133c15a6)
- [Limites d'utilisation](https://developers.themoviedb.org/3/system-overview)

---

**Développé avec ❤️ pour FLK STREAM**
