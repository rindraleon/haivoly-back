# Migrations historiques (Prisma)

Ces fichiers SQL sont la **trace de l'historique du schéma** tel qu'il a été
créé par Prisma avant la migration vers TypeORM. Ils ne sont **plus exécutés**
par l'application : ils servent uniquement de référence d'audit.

L'application utilise désormais les migrations TypeORM situées dans
`src/database/migrations/`, qui reconstituent exactement le même schéma de
façon idempotente et non destructive.
