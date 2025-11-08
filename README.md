1️⃣ Vérifier le dépôt distant

Pour savoir quel dépôt distant tu as configuré :

git remote -v

Normalement tu verras origin avec l’URL de ton dépôt GitHub.

Si tu n’as pas origin, ajoute-le :

git remote add origin https://github.com/TON_UTILISATEUR/TON_DEPOT.git

2️⃣ Récupérer les changements depuis le dépôt distant
git fetch

Cela récupère toutes les branches distantes mais ne les fusionne pas.

Pour récupérer et mettre à jour ta branche locale automatiquement :

git pull origin main

Ici main = la branche que tu veux mettre à jour.

Cela fait fetch + merge en une seule commande.

3️⃣ Pousser tes changements sur GitHub

Après avoir ajouté et commit tes changements :

git push origin main

Si c’est la première fois pour cette branche :

git push -u origin main

-u = configure la branche locale pour suivre la branche distante, plus besoin de préciser origin main à chaque fois.
