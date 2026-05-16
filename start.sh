#!/bin/bash
# Script de démarrage rapide GesConge

echo "🚀 Démarrage de GesConge..."

# Vérifier que PostgreSQL est disponible
echo "📦 Vérification PostgreSQL..."
until pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} 2>/dev/null; do
  echo "  En attente de PostgreSQL..."
  sleep 2
done

# Backend
echo "⚙️  Démarrage du backend..."
cd backend
[ ! -f .env ] && cp .env.example .env && echo "  .env créé depuis .env.example"
npm install --silent
npm run build
npm run seed 2>/dev/null || true
node dist/main &
BACKEND_PID=$!
echo "  Backend démarré (PID: $BACKEND_PID)"

# Frontend
echo "🎨 Démarrage du frontend..."
cd ../frontend
[ ! -f .env.local ] && cp .env.example .env.local && echo "  .env.local créé"
npm install --silent
npm run dev &
FRONTEND_PID=$!
echo "  Frontend démarré (PID: $FRONTEND_PID)"

echo ""
echo "✅ GesConge est opérationnel!"
echo "   Frontend : http://localhost:3000"
echo "   Backend  : http://localhost:3001"
echo "   Swagger  : http://localhost:3001/api-docs"
echo ""
echo "Comptes de test:"
echo "   admin@gesconge.dz / Admin@2024 (Super Admin)"
echo "   chef@gesconge.dz  / Chef@2024  (Chef Exploitation)"
echo "   op.a@gesconge.dz  / Agent@2024 (Opérateur)"
echo ""
echo "Ctrl+C pour arrêter"

wait $BACKEND_PID $FRONTEND_PID
