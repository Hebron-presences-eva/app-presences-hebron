

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// SUPABASE CONFIGURATION
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('Vérifiez SUPABASE_URL et SUPABASE_ANON_KEY dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Connexion Supabase initialisée');

// Test de connexion
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('groupes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
    } else {
      console.log('✅ Connexion Supabase opérationnelle');
    }
  } catch (err) {
    console.error('❌ Test de connexion échoué:', err);
  }
}

// FONCTIONS UTILITAIRES
function formatDateForClient(pgDate) {
  if (!pgDate) return null;
  
  if (typeof pgDate === 'string') {
    return pgDate.split('T')[0];
  }
  
  if (pgDate instanceof Date) {
    const year = pgDate.getFullYear();
    const month = String(pgDate.getMonth() + 1).padStart(2, '0');
    const day = String(pgDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

const app = express();
const port = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Headers pour PWA
app.use((req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});

// Servir le manifest
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.url}`, req.query);
  next();
});

// ===========================================
// ROUTES D'AUTHENTIFICATION
// ===========================================

app.post('/api/login', async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;
  
  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ message: "Identifiant et mot de passe requis" });
  }

  try {
    const { data, error } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('identifiant', identifiant)
      .eq('mot_de_passe', mot_de_passe);
    
    if (error) {
      console.error("❌ Erreur Supabase login:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    if (data && data.length > 0) {
      console.log("✅ Connexion réussie pour:", identifiant);
      return res.json(data[0]);
    }
    
    console.log("❌ Tentative de connexion échouée pour:", identifiant);
    res.status(401).json({ message: "Identifiants invalides" });
  } catch (err) {
    console.error("❌ Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ===========================================
// ROUTES POUR LES GROUPES
// ===========================================

app.get('/api/groupes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('groupes')
      .select('id, libelle')
      .order('libelle', { ascending: true });
    
    if (error) {
      console.error("❌ Erreur récupération groupes:", error);
      return res.status(500).json({ error: "Erreur récupération groupes" });
    }
    
    console.log(`✅ ${data.length} groupes récupérés`);
    // ⚠️ TRANSFORMATION NÉCESSAIRE : libelle → nom pour le frontend
    const groupesTransformed = data.map(groupe => ({
      id: groupe.id,
      nom: groupe.libelle  // Transformer libelle en nom
    }));
    
    res.json(groupesTransformed);
  } catch (err) {
    console.error("❌ Erreur récupération groupes:", err);
    res.status(500).json({ error: "Erreur récupération groupes" });
  }
});

// ===========================================
// ROUTES POUR LES RÉUNIONS
// ===========================================

app.get('/api/reunions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reunions')
      .select('id, libelle')
      .order('libelle', { ascending: true });
    
    if (error) {
      console.error("❌ Erreur récupération réunions:", error);
      return res.status(500).json({ error: "Erreur récupération réunions" });
    }
    
    console.log(`✅ ${data.length} réunions récupérées`);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur récupération réunions:", err);
    res.status(500).json({ error: "Erreur récupération réunions" });
  }
});

// ===========================================
// ROUTES POUR LES MEMBRES
// ===========================================

app.get('/api/membres', async (req, res) => {
  const { groupe_id } = req.query;
  
  if (!groupe_id) {
    return res.status(400).json({ error: "groupe_id requis" });
  }
  
  const groupeId = parseInt(groupe_id, 10);
  if (isNaN(groupeId)) {
    return res.status(400).json({ error: "groupe_id doit être un nombre" });
  }
  
  try {
    const { data, error } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('groupe_id', groupeId)
      .order('nom', { ascending: true });
    
    if (error) {
      console.error("❌ Erreur récupération membres:", error);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }
    
    console.log(`✅ ${data.length} membres récupérés pour le groupe ${groupeId}`);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur récupération membres:", err);
    res.status(500).json({ error: "Erreur récupération membres" });
  }
});

// ===========================================
// ROUTE POUR LE RÉSUMÉ MENSUEL - ROUTE MANQUANTE AJOUTÉE
// ===========================================

app.get('/api/presences/resume', async (req, res) => {
  const { groupe, mois, annee, reunion_id } = req.query;
  
  const groupeId = parseInt(groupe, 10);
  const moisNum = parseInt(mois, 10);
  const anneeNum = parseInt(annee, 10);
  const reunionId = parseInt(reunion_id, 10);

  if (isNaN(groupeId) || isNaN(moisNum) || isNaN(anneeNum) || isNaN(reunionId)) {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    console.log(`📊 Génération résumé: Groupe=${groupeId}, ${moisNum}/${anneeNum}, Réunion=${reunionId}`);

    // Récupérer tous les membres du groupe
    const { data: membres, error: membresError } = await supabase
      .from('membres')
      .select('id, nom')
      .eq('groupe_id', groupeId)
      .order('nom', { ascending: true });

    if (membresError) {
      console.error("❌ Erreur membres:", membresError);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }

    if (!membres || membres.length === 0) {
      return res.json({
        total_reunions: 0,
        presents: [],
        absents: [],
        dates_reunions: [],
        stats: {
          total_membres: 0,
          total_presents: 0,
          total_absents: 0,
          taux_participation: 0
        }
      });
    }

    // Récupérer les présences du mois
    const startDate = `${anneeNum}-${String(moisNum).padStart(2, '0')}-01`;
    const endDate = `${anneeNum}-${String(moisNum).padStart(2, '0')}-31`;

    const { data: presences, error: presencesError } = await supabase
      .from('presences')
      .select('membre_id, date_presence')
      .eq('reunion_id', reunionId)
      .gte('date_presence', startDate)
      .lte('date_presence', endDate)
      .in('membre_id', membres.map(m => m.id));

    if (presencesError) {
      console.error("❌ Erreur présences:", presencesError);
      return res.status(500).json({ error: "Erreur récupération présences" });
    }

    // Compter les présences par membre
    const presencesParMembre = {};
    membres.forEach(membre => {
      presencesParMembre[membre.id] = 0;
    });

    presences.forEach(presence => {
      if (presencesParMembre[presence.membre_id] !== undefined) {
        presencesParMembre[presence.membre_id]++;
      }
    });

    // Compter le nombre total de réunions distinctes pour ce mois
    const datesUniques = [...new Set(presences.map(p => p.date_presence.split('T')[0]))];
    const totalReunions = datesUniques.length;

    // Séparer présents et absents
    const presents = [];
    const absents = [];

    membres.forEach(membre => {
      const totalPresences = presencesParMembre[membre.id];
      const membreData = {
        id: membre.id,
        nom: membre.nom,
        total_presences: totalPresences
      };

      if (totalPresences > 0) {
        presents.push(membreData);
      } else {
        absents.push(membreData);
      }
    });

    console.log(`✅ Résumé généré: ${presents.length} présents, ${absents.length} absents`);

    res.json({
      total_reunions: totalReunions,
      presents,
      absents,
      dates_reunions: datesUniques,
      stats: {
        total_membres: membres.length,
        total_presents: presents.length,
        total_absents: absents.length,
        taux_participation: membres.length > 0 
          ? Math.round((presents.length / membres.length) * 100) 
          : 0
      }
    });

  } catch (err) {
    console.error("❌ Erreur génération résumé:", err);
    res.status(500).json({ error: "Erreur serveur lors de la génération du résumé" });
  }
});

// ===========================================
// ROUTE POUR LES PRÉSENCES ANNUELLES - CORRIGÉE
// ===========================================

app.get('/api/presences/annuel', async (req, res) => {
  const { groupe, annee, type, reunion_id } = req.query;
  
  const groupeId = parseInt(groupe, 10);
  const anneeNum = parseInt(annee, 10);
  
  console.log("🔍 Paramètres présences annuelles:", { groupe, annee, type, reunion_id });

  if (!groupe || !annee) {
    return res.status(400).json({ 
      error: "Paramètres 'groupe' et 'annee' requis"
    });
  }

  if (isNaN(groupeId) || isNaN(anneeNum)) {
    return res.status(400).json({ 
      error: "Les paramètres doivent être des nombres valides" 
    });
  }

  // MAPPING CORRIGÉ DES TYPES DE RÉUNION
  const reunionTypes = {
    'tous': 1,        // Culte de Dimanche
    'reunion': 2,     // Survol Doctrinal
    'croissance': 3,  // Groupe de Croissance
    'atelier': 4      // Groupe de Personne
  };

  try {
    // 1. Récupérer le groupe
    const { data: groupe_data, error: groupeError } = await supabase
      .from('groupes')
      .select('id, libelle')
      .eq('id', groupeId)
      .single();
    
    if (groupeError || !groupe_data) {
      return res.status(404).json({ error: "Groupe non trouvé" });
    }

    // 2. Récupérer les membres du groupe
    const { data: membres, error: membresError } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('groupe_id', groupeId)
      .order('nom', { ascending: true });

    if (membresError) {
      console.error("❌ Erreur membres:", membresError);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }

    console.log(`👥 ${membres.length} membres trouvés`);

    if (membres.length === 0) {
      return res.json({
        groupe: { id: groupeId, nom: groupe_data.libelle },
        reunion: null,
        annee: anneeNum,
        membres: [],
        donnees: {},
        presences: []
      });
    }

    // 3. Construire la requête présences
    let query = supabase
      .from('presences')
      .select('membre_id, date_presence, reunion_id')
      .gte('date_presence', `${anneeNum}-01-01`)
      .lte('date_presence', `${anneeNum}-12-31`)
      .in('membre_id', membres.map(m => m.id));

    // APPLIQUER LES FILTRES CORRIGÉS
    if (reunion_id && reunion_id !== 'undefined') {
      const reunionIdNum = parseInt(reunion_id, 10);
      if (!isNaN(reunionIdNum)) {
        query = query.eq('reunion_id', reunionIdNum);
        console.log("🎯 Filtrage par reunion_id:", reunionIdNum);
      }
    } else if (type && type !== 'tous' && reunionTypes[type]) {
      const reunionIdFromType = reunionTypes[type];
      query = query.eq('reunion_id', reunionIdFromType);
      console.log(`🔍 Filtrage par type '${type}' -> reunion_id: ${reunionIdFromType}`);
    }

    const { data: presences, error: presencesError } = await query
      .order('date_presence', { ascending: true });

    if (presencesError) {
      console.error("❌ Erreur présences:", presencesError);
      return res.status(500).json({ error: "Erreur récupération présences" });
    }

    console.log(`📊 ${presences.length} présences trouvées`);

    // 4. Organiser les données par mois
    const donnees = {};
    for (let mois = 1; mois <= 12; mois++) {
      donnees[mois] = {
        presences_par_membre: {}
      };
      
      membres.forEach(membre => {
        donnees[mois].presences_par_membre[membre.id] = 0;
      });
    }

    // Compter les présences par mois et par membre
    presences.forEach(presence => {
      const date = new Date(presence.date_presence + 'T00:00:00');
      const mois = date.getMonth() + 1;
      
      if (donnees[mois] && donnees[mois].presences_par_membre[presence.membre_id] !== undefined) {
        donnees[mois].presences_par_membre[presence.membre_id]++;
      }
    });

    res.json({
      groupe: { id: groupeId, nom: groupe_data.libelle },
      reunion: reunion_id ? { id: reunion_id } : null,
      annee: anneeNum,
      membres: membres,
      donnees: donnees,
      presences: presences
    });

  } catch (err) {
    console.error("❌ Erreur présences annuelles:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ===========================================
// ROUTES POUR LES PRÉSENCES - VUE MENSUELLE
// ===========================================

app.get('/api/presences', async (req, res) => {
  const { groupe, reunion_id, mois, annee } = req.query;
  
  const groupeId = parseInt(groupe, 10);
  const reunionId = parseInt(reunion_id, 10);
  const moisNum = parseInt(mois, 10);
  const anneeNum = parseInt(annee, 10);

  if (!groupe || !reunion_id || !mois || !annee) {
    return res.status(400).json({ 
      error: "Paramètres manquants: groupe, reunion_id, mois, annee sont requis" 
    });
  }

  if (isNaN(groupeId) || isNaN(reunionId) || isNaN(moisNum) || isNaN(anneeNum)) {
    return res.status(400).json({ 
      error: "Tous les paramètres doivent être des nombres valides" 
    });
  }

  if (moisNum < 1 || moisNum > 12) {
    return res.status(400).json({ error: "Le mois doit être entre 1 et 12" });
  }

  try {
    console.log(`🔍 Recherche présences: Groupe=${groupeId}, Réunion=${reunionId}, ${moisNum}/${anneeNum}`);

    // 1. Vérifier l'existence du groupe
    const { data: groupe_data, error: groupeError } = await supabase
      .from('groupes')
      .select('id, libelle')
      .eq('id', groupeId)
      .single();
    
    if (groupeError || !groupe_data) {
      return res.status(404).json({ error: "Groupe non trouvé" });
    }

    // 2. Vérifier l'existence de la réunion
    const { data: reunion_data, error: reunionError } = await supabase
      .from('reunions')
      .select('id, libelle')
      .eq('id', reunionId)
      .single();
    
    if (reunionError || !reunion_data) {
      return res.status(404).json({ error: "Réunion non trouvée" });
    }

    // 3. Récupérer les membres du groupe
    const { data: membres, error: membresError } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('groupe_id', groupeId)
      .order('nom', { ascending: true });

    if (membresError) {
      console.error("❌ Erreur membres:", membresError);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }

    console.log(`👥 ${membres.length} membres trouvés`);

    // 4. Récupérer les présences du mois
    const startDate = `${anneeNum}-${String(moisNum).padStart(2, '0')}-01`;
    const endDate = `${anneeNum}-${String(moisNum).padStart(2, '0')}-31`;

    const { data: presences, error: presencesError } = await supabase
      .from('presences')
      .select('membre_id, date_presence, reunion_id')
      .eq('reunion_id', reunionId)
      .gte('date_presence', startDate)
      .lte('date_presence', endDate)
      .in('membre_id', membres.map(m => m.id))
      .order('date_presence', { ascending: true });

    if (presencesError) {
      console.error("❌ Erreur présences:", presencesError);
      return res.status(500).json({ error: "Erreur récupération présences" });
    }

    console.log(`📅 ${presences.length} présences trouvées`);

    // Calculer le nombre de jours dans le mois
    const nombreJours = new Date(anneeNum, moisNum, 0).getDate();

    res.json({
      groupe: groupe_data,
      reunion: reunion_data,
      mois: moisNum,
      annee: anneeNum,
      nombre_jours: nombreJours,
      membres: membres,
      presences: presences
    });

  } catch (err) {
    console.error("❌ Erreur GET /api/presences:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des présences" });
  }
});

// ===========================================
// ROUTES MODIFICATION DES PRÉSENCES
// ===========================================

// Ajouter des présences
app.post('/api/presences', async (req, res) => {
  const presences = req.body;
  
  if (!Array.isArray(presences) || presences.length === 0) {
    return res.status(400).json({ error: "Le body doit être un tableau non vide de présences" });
  }

  // Validation de chaque présence
  for (let i = 0; i < presences.length; i++) {
    const p = presences[i];
    if (!p.membre_id || !p.date_presence || !p.reunion_id) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: membre_id, date_presence et reunion_id sont requis` 
      });
    }
    
    if (isNaN(parseInt(p.membre_id)) || isNaN(parseInt(p.reunion_id))) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: membre_id et reunion_id doivent être des nombres` 
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date_presence)) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: date_presence doit être au format YYYY-MM-DD` 
      });
    }
  }

  try {
    let insertCount = 0;
    let duplicateCount = 0;
    
    for (const p of presences) {
      const membreId = parseInt(p.membre_id);
      const reunionId = parseInt(p.reunion_id);
      
      // Vérifier si la présence existe déjà  
      const { data: existing, error: checkError } = await supabase
        .from('presences')
        .select('id')
        .eq('membre_id', membreId)
        .eq('date_presence', p.date_presence)
        .eq('reunion_id', reunionId);
      
      if (checkError) {
        console.error("❌ Erreur vérification:", checkError);
        continue;
      }
      
      if (existing && existing.length > 0) {
        duplicateCount++;
        console.log(`⚠️ Présence déjà existante: membre ${membreId}, date ${p.date_presence}, réunion ${reunionId}`);
      } else {
        const { error: insertError } = await supabase
          .from('presences')
          .insert({
            membre_id: membreId,
            date_presence: p.date_presence,
            reunion_id: reunionId
          });
        
        if (insertError) {
          console.error("❌ Erreur insertion:", insertError);
        } else {
          insertCount++;
        }
      }
    }

    console.log(`✅ Présences traitées: ${insertCount} ajoutées, ${duplicateCount} doublons ignorés`);
    
    res.json({ 
      success: true, 
      inserted: insertCount,
      duplicates: duplicateCount,
      total_processed: presences.length
    });

  } catch (err) {
    console.error("❌ Erreur ajout présences:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout des présences" });
  }
});

// Supprimer une présence
app.delete('/api/presences', async (req, res) => {
  const { membre_id, date_presence, reunion_id } = req.body;

  if (!membre_id || !date_presence || !reunion_id) {
    return res.status(400).json({ 
      error: "membre_id, date_presence et reunion_id sont requis" 
    });
  }

  const membreId = parseInt(membre_id, 10);
  const reunionId = parseInt(reunion_id, 10);

  if (isNaN(membreId) || isNaN(reunionId)) {
    return res.status(400).json({ 
      error: "membre_id et reunion_id doivent être des nombres valides" 
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_presence)) {
    return res.status(400).json({ 
      error: "date_presence doit être au format YYYY-MM-DD" 
    });
  }

  try {
    console.log(`🗑️ Suppression présence: membre ${membreId}, date ${date_presence}, réunion ${reunionId}`);

    const { error } = await supabase
      .from('presences')
      .delete()
      .eq('membre_id', membreId)
      .eq('date_presence', date_presence)
      .eq('reunion_id', reunionId);

    if (error) {
      console.error("❌ Erreur suppression:", error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }

    console.log("✅ Présence supprimée avec succès");
    res.json({ 
      success: true, 
      message: "Présence supprimée"
    });

  } catch (err) {
    console.error("❌ Erreur suppression présence:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
});

// ===========================================
// ROUTES DE DEBUG
// ===========================================

app.get('/api/debug/general', async (req, res) => {
  try {
    console.log('🔍 DEBUG GÉNÉRAL: Vérification de la base de données');

    const [groupesCount, membresCount, reunionsCount, presencesCount] = await Promise.all([
      supabase.from('groupes').select('*', { count: 'exact', head: true }),
      supabase.from('membres').select('*', { count: 'exact', head: true }),
      supabase.from('reunions').select('*', { count: 'exact', head: true }),
      supabase.from('presences').select('*', { count: 'exact', head: true })
    ]);

    // Dernières présences
    const { data: dernieresPresences } = await supabase
      .from('presences')
      .select(`
        id,
        date_presence,
        membre_id,
        reunion_id
      `)
      .order('date_presence', { ascending: false })
      .limit(10);

    res.json({
      timestamp: new Date().toISOString(),
      statistiques: {
        groupes: groupesCount.count || 0,
        membres: membresCount.count || 0,
        reunions: reunionsCount.count || 0,
        presences: presencesCount.count || 0
      },
      dernieres_presences: dernieresPresences || [],
      routes_debug_disponibles: [
        '/api/debug/general',
        '/api/debug/reunions',
        '/api/presences/debug?groupe=X&annee=Y'
      ]
    });

  } catch (err) {
    console.error("❌ Erreur debug général:", err);
    res.status(500).json({ 
      error: "Erreur debug général", 
      details: err.message 
    });
  }
});

app.get('/api/debug/reunions', async (req, res) => {
  try {
    const { data: reunions, error } = await supabase
      .from('reunions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      timestamp: new Date().toISOString(),
      total: reunions.length,
      reunions: reunions,
      mapping_attendu: {
        1: "Culte de Dimanche",
        2: "Survol Doctrinal",
        3: "Groupe de Croissance",
        4: "Groupe de Personne"
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug présences par groupe/année
app.get('/api/presences/debug', async (req, res) => {
  const { groupe, annee } = req.query;
  
  if (!groupe || !annee) {
    return res.status(400).json({ 
      error: "Paramètres 'groupe' et 'annee' requis",
      exemple: "/api/presences/debug?groupe=1&annee=2024"
    });
  }
  
  const groupeId = parseInt(groupe, 10);
  const anneeNum = parseInt(annee, 10);

  if (isNaN(groupeId) || isNaN(anneeNum)) {
    return res.status(400).json({ 
      error: "Les paramètres 'groupe' et 'annee' doivent être des nombres valides" 
    });
  }

  try {
    console.log(`🔍 DEBUG: Recherche présences pour groupe ${groupeId}, année ${anneeNum}`);

    // Récupérer les présences avec jointures manuelles
    const { data: presences, error } = await supabase
      .from('presences')
      .select('*')
      .gte('date_presence', `${anneeNum}-01-01`)
      .lte('date_presence', `${anneeNum}-12-31`);

    if (error) {
      console.error("❌ Erreur debug:", error);
      return res.status(500).json({ error: "Erreur debug", details: error.message });
    }

    // Filtrer manuellement par groupe (récupérer d'abord les membres du groupe)
    const { data: membres } = await supabase
      .from('membres')
      .select('id, nom')
      .eq('groupe_id', groupeId);

    const membresIds = membres ? membres.map(m => m.id) : [];
    const presencesFiltered = presences ? presences.filter(p => membresIds.includes(p.membre_id)) : [];

    console.log(`🔍 DEBUG: ${presencesFiltered.length} présences trouvées`);
    
    res.json({
      parametres: {
        groupe_id: groupeId,
        annee: anneeNum
      },
      total: presencesFiltered.length,
      presences: presencesFiltered
    });

  } catch (err) {
    console.error("❌ Erreur debug:", err);
    res.status(500).json({ 
      error: "Erreur debug", 
      details: err.message 
    });
  }
});

// ===========================================
// ROUTE DE TEST
// ===========================================

app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Serveur Supabase fonctionne correctement",
    timestamp: new Date().toISOString(),
    database: "Supabase",
    routes_disponibles: [
      'GET  /api/test',
      'GET  /api/groupes',
      'GET  /api/reunions',
      'GET  /api/membres?groupe_id=X',
      'GET  /api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W',
      'GET  /api/presences/resume?groupe=X&reunion_id=Y&mois=Z&annee=W',
      'GET  /api/presences/annuel?groupe=X&annee=Y[&type=Z][&reunion_id=W]',
      'GET  /api/presences/debug?groupe=X&annee=Y',
      'GET  /api/debug/general',
      'GET  /api/debug/reunions',
      'POST /api/login',
      'POST /api/presences',
      'DELETE /api/presences'
    ]
  });
});

// ===========================================
// GESTION DES ERREURS ET DÉMARRAGE
// ===========================================

// Middleware de gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error("❌ Erreur non gérée:", err);
  res.status(500).json({ error: "Erreur serveur interne" });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// DÉMARRAGE DU SERVEUR
app.listen(port, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`📊 Interface d'administration disponible`);
  console.log(`🔗 Base de données: Supabase`);
  console.log(`📡 URL Supabase: ${supabaseUrl}`);
  
  // Tester la connexion au démarrage
  await testSupabaseConnection();
  
  console.log(`🔗 Routes API disponibles:`);
  console.log(`   GET  /api/test`);
  console.log(`   GET  /api/groupes`);
  console.log(`   GET  /api/reunions`);
  console.log(`   GET  /api/membres?groupe_id=X`);
  console.log(`   GET  /api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W`);
  console.log(`   GET  /api/presences/resume?groupe=X&reunion_id=Y&mois=Z&annee=W`);
  console.log(`   GET  /api/presences/annuel?groupe=X&annee=Y[&type=Z][&reunion_id=W]`);
  console.log(`   GET  /api/presences/debug?groupe=X&annee=Y`);
  console.log(`   GET  /api/debug/general`);
  console.log(`   GET  /api/debug/reunions`);
  console.log(`   POST /api/login`);
  console.log(`   POST /api/presences`);
  console.log(`   DELETE /api/presences`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  console.log('✅ Connexions fermées');
  process.exit(0);
});



















/*
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// SUPABASE CONFIGURATION
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('Vérifiez SUPABASE_URL et SUPABASE_ANON_KEY dans votre fichier .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Connexion Supabase initialisée');

// Test de connexion
async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('groupes')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion Supabase:', error);
    } else {
      console.log('✅ Connexion Supabase opérationnelle');
    }
  } catch (err) {
    console.error('❌ Test de connexion échoué:', err);
  }
}

// FONCTIONS UTILITAIRES
function formatDateForClient(pgDate) {
  if (!pgDate) return null;
  
  if (typeof pgDate === 'string') {
    return pgDate.split('T')[0];
  }
  
  if (pgDate instanceof Date) {
    const year = pgDate.getFullYear();
    const month = String(pgDate.getMonth() + 1).padStart(2, '0');
    const day = String(pgDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

const app = express();
const port = process.env.PORT || 3000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Headers pour PWA
app.use((req, res, next) => {
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});

// Servir le manifest
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`🔥 ${req.method} ${req.url}`, req.query);
  next();
});

// ===========================================
// ROUTES D'AUTHENTIFICATION
// ===========================================

app.post('/api/login', async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;
  
  if (!identifiant || !mot_de_passe) {
    return res.status(400).json({ message: "Identifiant et mot de passe requis" });
  }

  try {
    const { data, error } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('identifiant', identifiant)
      .eq('mot_de_passe', mot_de_passe);
    
    if (error) {
      console.error("❌ Erreur Supabase login:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    
    if (data && data.length > 0) {
      console.log("✅ Connexion réussie pour:", identifiant);
      return res.json(data[0]);
    }
    
    console.log("❌ Tentative de connexion échouée pour:", identifiant);
    res.status(401).json({ message: "Identifiants invalides" });
  } catch (err) {
    console.error("❌ Erreur lors de la connexion:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// ===========================================
// ROUTES POUR LES GROUPES
// ===========================================

app.get('/api/groupes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('groupes')
      .select('id, libelle')
      .order('libelle', { ascending: true });
    
    if (error) {
      console.error("❌ Erreur récupération groupes:", error);
      return res.status(500).json({ error: "Erreur récupération groupes" });
    }
    
    console.log(`✅ ${data.length} groupes récupérés`);
     // ⚠️ TRANSFORMATION NÉCESSAIRE : libelle → nom pour le frontend
     const groupesTransformed = data.map(groupe => ({
      id: groupe.id,
      nom: groupe.libelle  // Transformer libelle en nom
    }));
    
    res.json(groupesTransformed);
  } catch (err) {
    console.error("❌ Erreur récupération groupes:", err);
    res.status(500).json({ error: "Erreur récupération groupes" });
  }
});

// ===========================================
// ROUTES POUR LES RÉUNIONS
// ===========================================

app.get('/api/reunions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reunions')
      .select('id, libelle')
      .order('libelle', { ascending: true });
    
    if (error) {
      console.error("❌ Erreur récupération réunions:", error);
      return res.status(500).json({ error: "Erreur récupération réunions" });
    }
    
    console.log(`✅ ${data.length} réunions récupérées`);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur récupération réunions:", err);
    res.status(500).json({ error: "Erreur récupération réunions" });
  }
});

// ===========================================
// ROUTES POUR LES MEMBRES
// ===========================================

app.get('/api/membres', async (req, res) => {
  const { groupe_id } = req.query;
  
  if (!groupe_id) {
    return res.status(400).json({ error: "groupe_id requis" });
  }
  
  const groupeId = parseInt(groupe_id, 10);
  if (isNaN(groupeId)) {
    return res.status(400).json({ error: "groupe_id doit être un nombre" });
  }
  
  try {
    const { data, error } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('groupe_id', groupeId)
      .order('nom', { ascending: true });
    
    if (error) {
      console.error("❌ Erreur récupération membres:", error);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }
    
    console.log(`✅ ${data.length} membres récupérés pour le groupe ${groupeId}`);
    res.json(data);
  } catch (err) {
    console.error("❌ Erreur récupération membres:", err);
    res.status(500).json({ error: "Erreur récupération membres" });
  }
});

// ===========================================
// ROUTES POUR LES PRÉSENCES
// ===========================================

// Ajouter des présences
app.post('/api/presences', async (req, res) => {
  const presences = req.body;
  
  if (!Array.isArray(presences) || presences.length === 0) {
    return res.status(400).json({ error: "Le body doit être un tableau non vide de présences" });
  }

  // Validation de chaque présence
  for (let i = 0; i < presences.length; i++) {
    const p = presences[i];
    if (!p.membre_id || !p.date_presence || !p.reunion_id) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: membre_id, date_presence et reunion_id sont requis` 
      });
    }
    
    if (isNaN(parseInt(p.membre_id)) || isNaN(parseInt(p.reunion_id))) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: membre_id et reunion_id doivent être des nombres` 
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date_presence)) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: date_presence doit être au format YYYY-MM-DD` 
      });
    }
  }

  try {
    let insertCount = 0;
    let duplicateCount = 0;
    
    for (const p of presences) {
      const membreId = parseInt(p.membre_id);
      const reunionId = parseInt(p.reunion_id);
      
      // Vérifier si la présence existe déjà 
      const { data: existing, error: checkError } = await supabase
        .from('presences')
        .select('id')
        .eq('membre_id', membreId)
        .eq('date_presence', p.date_presence)
        .eq('reunion_id', reunionId);
      
      if (checkError) {
        console.error("❌ Erreur vérification:", checkError);
        continue;
      }
      
      if (existing && existing.length > 0) {
        duplicateCount++;
        console.log(`⚠️ Présence déjà existante: membre ${membreId}, date ${p.date_presence}, réunion ${reunionId}`);
      } else {
        const { error: insertError } = await supabase
          .from('presences')
          .insert({
            membre_id: membreId,
            date_presence: p.date_presence,
            reunion_id: reunionId
          });
        
        if (insertError) {
          console.error("❌ Erreur insertion:", insertError);
        } else {
          insertCount++;
        }
      }
    }

    console.log(`✅ Présences traitées: ${insertCount} ajoutées, ${duplicateCount} doublons ignorés`);
    
    res.json({ 
      success: true, 
      inserted: insertCount,
      duplicates: duplicateCount,
      total_processed: presences.length
    });

  } catch (err) {
    console.error("❌ Erreur ajout présences:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout des présences" });
  }
});

// Supprimer une présence
app.delete('/api/presences', async (req, res) => {
  const { membre_id, date_presence, reunion_id } = req.body;

  if (!membre_id || !date_presence || !reunion_id) {
    return res.status(400).json({ 
      error: "membre_id, date_presence et reunion_id sont requis" 
    });
  }

  const membreId = parseInt(membre_id, 10);
  const reunionId = parseInt(reunion_id, 10);

  if (isNaN(membreId) || isNaN(reunionId)) {
    return res.status(400).json({ 
      error: "membre_id et reunion_id doivent être des nombres valides" 
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_presence)) {
    return res.status(400).json({ 
      error: "date_presence doit être au format YYYY-MM-DD" 
    });
  }

  try {
    console.log(`🗑️ Suppression présence: membre ${membreId}, date ${date_presence}, réunion ${reunionId}`);

    const { error } = await supabase
      .from('presences')
      .delete()
      .eq('membre_id', membreId)
      .eq('date_presence', date_presence)
      .eq('reunion_id', reunionId);

    if (error) {
      console.error("❌ Erreur suppression:", error);
      return res.status(500).json({ error: "Erreur lors de la suppression" });
    }

    console.log("✅ Présence supprimée avec succès");
    res.json({ 
      success: true, 
      message: "Présence supprimée"
    });

  } catch (err) {
    console.error("❌ Erreur suppression présence:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
});

// Récupérer les présences avec filtres
app.get('/api/presences', async (req, res) => {
  const { groupe, reunion_id, mois, annee } = req.query;
  
  const groupeId = parseInt(groupe, 10);
  const reunionId = parseInt(reunion_id, 10);
  const moisNum = parseInt(mois, 10);
  const anneeNum = parseInt(annee, 10);

  if (!groupe || !reunion_id || !mois || !annee) {
    return res.status(400).json({ 
      error: "Paramètres manquants: groupe, reunion_id, mois, annee sont requis" 
    });
  }

  if (isNaN(groupeId) || isNaN(reunionId) || isNaN(moisNum) || isNaN(anneeNum)) {
    return res.status(400).json({ 
      error: "Tous les paramètres doivent être des nombres valides" 
    });
  }

  if (moisNum < 1 || moisNum > 12) {
    return res.status(400).json({ error: "Le mois doit être entre 1 et 12" });
  }

  try {
    console.log(`🔍 Recherche présences: Groupe=${groupeId}, Réunion=${reunionId}, ${moisNum}/${anneeNum}`);

    // 1. Vérifier l'existence du groupe
    const { data: groupe_data, error: groupeError } = await supabase
      .from('groupes')
      .select('id, libelle')
      .eq('id', groupeId)
      .single();
    
    if (groupeError || !groupe_data) {
      return res.status(404).json({ error: "Groupe non trouvé" });
    }

    // 2. Vérifier l'existence de la réunion
    const { data: reunion_data, error: reunionError } = await supabase
      .from('reunions')
      .select('id, libelle')
      .eq('id', reunionId)
      .single();
    
    if (reunionError || !reunion_data) {
      return res.status(404).json({ error: "Réunion non trouvée" });
    }

    // 3. Récupérer les membres du groupe
    const { data: membres, error: membresError } = await supabase
    .from('membres')
    .select('id, nom, groupe_id')  // ✅ CORRIGÉ
    .eq('groupe_id', groupeId)
    .order('nom', { ascending: true });

    if (membresError) {
      console.error("❌ Erreur membres:", membresError);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }

    console.log(`👥 ${membres.length} membres trouvés`);

    // 4. Récupérer les présences du mois
    const startDate = `${anneeNum}-${String(moisNum).padStart(2, '0')}-01`;
    const endDate = `${anneeNum}-${String(moisNum).padStart(2, '0')}-31`;

    const { data: presences, error: presencesError } = await supabase
      .from('presences')
      .select('membre_id, date_presence, reunion_id')
      .eq('reunion_id', reunionId)
      .gte('date_presence', startDate)
      .lte('date_presence', endDate)
      .in('membre_id', membres.map(m => m.id))
      .order('date_presence', { ascending: true });

    if (presencesError) {
      console.error("❌ Erreur présences:", presencesError);
      return res.status(500).json({ error: "Erreur récupération présences" });
    }

    console.log(`📅 ${presences.length} présences trouvées`);

    // Calculer le nombre de jours dans le mois
    const nombreJours = new Date(anneeNum, moisNum, 0).getDate();

    res.json({
      groupe: groupe_data,
      reunion: reunion_data,
      mois: moisNum,
      annee: anneeNum,
      nombre_jours: nombreJours,
      membres: membres,
      presences: presences
    });

  } catch (err) {
    console.error("❌ Erreur GET /api/presences:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des présences" });
  }
});



// 5. AJOUT DE LA ROUTE PRÉSENCES ANNUELLES MANQUANTE
app.get('/api/presences/annuel', async (req, res) => {
  const { groupe, annee, type, reunion_id } = req.query;
  
  const groupeId = parseInt(groupe, 10);
  const anneeNum = parseInt(annee, 10);
  
  console.log("🔍 Paramètres présences annuelles:", { groupe, annee, type, reunion_id });

  if (!groupe || !annee) {
    return res.status(400).json({ 
      error: "Paramètres 'groupe' et 'annee' requis"
    });
  }

  if (isNaN(groupeId) || isNaN(anneeNum)) {
    return res.status(400).json({ 
      error: "Les paramètres doivent être des nombres valides" 
    });
  }

  try {
    // 1. Récupérer le groupe
    const { data: groupe_data, error: groupeError } = await supabase
      .from('groupes')
      .select('id, libelle')  // ✅ CORRECT pour groupes
      .eq('id', groupeId)
      .single();
    
    if (groupeError || !groupe_data) {
      return res.status(404).json({ error: "Groupe non trouvé" });
    }

    // 2. Récupérer les membres du groupe
    const { data: membres, error: membresError } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')  // ✅ CORRECT pour membres
      .eq('groupe_id', groupeId)
      .order('nom', { ascending: true });

    if (membresError) {
      console.error("❌ Erreur membres:", membresError);
      return res.status(500).json({ error: "Erreur récupération membres" });
    }

    console.log(`👥 ${membres.length} membres trouvés`);

    if (membres.length === 0) {
      return res.json({
        groupe: { id: groupeId, nom: groupe_data.libelle },
        reunion: null,
        annee: anneeNum,
        membres: [],
        donnees: {},
        presences: []
      });
    }

    // 3. Construire la requête présences
    let query = supabase
      .from('presences')
      .select('membre_id, date_presence, reunion_id')
      .gte('date_presence', `${anneeNum}-01-01`)
      .lte('date_presence', `${anneeNum}-12-31`)
      .in('membre_id', membres.map(m => m.id));

    // Filtrer par réunion si spécifié
    if (reunion_id && reunion_id !== 'undefined') {
      const reunionIdNum = parseInt(reunion_id, 10);
      if (!isNaN(reunionIdNum)) {
        query = query.eq('reunion_id', reunionIdNum);
        console.log("🎯 Filtrage par reunion_id:", reunionIdNum);
      }
    }

    const { data: presences, error: presencesError } = await query
      .order('date_presence', { ascending: true });

    if (presencesError) {
      console.error("❌ Erreur présences:", presencesError);
      return res.status(500).json({ error: "Erreur récupération présences" });
    }

    console.log(`📊 ${presences.length} présences trouvées`);

    // 4. Organiser les données par mois
    const donnees = {};
    for (let mois = 1; mois <= 12; mois++) {
      donnees[mois] = {
        presences_par_membre: {}
      };
      
      membres.forEach(membre => {
        donnees[mois].presences_par_membre[membre.id] = 0;
      });
    }

    // Compter les présences
    presences.forEach(presence => {
      const date = new Date(presence.date_presence + 'T00:00:00');
      const mois = date.getMonth() + 1;
      
      if (donnees[mois] && donnees[mois].presences_par_membre[presence.membre_id] !== undefined) {
        donnees[mois].presences_par_membre[presence.membre_id]++;
      }
    });

    res.json({
      groupe: { id: groupeId, nom: groupe_data.libelle },
      reunion: reunion_id ? { id: reunion_id } : null,
      annee: anneeNum,
      membres: membres,
      donnees: donnees,
      presences: presences
    });

  } catch (err) {
    console.error("❌ Erreur présences annuelles:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// 6. ROUTE DE DEBUG POUR VÉRIFIER LES RÉUNIONS
app.get('/api/debug/reunions', async (req, res) => {
  try {
    const { data: reunions, error } = await supabase
      .from('reunions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      timestamp: new Date().toISOString(),
      total: reunions.length,
      reunions: reunions,
      mapping_attendu: {
        1: "Culte de Dimanche",
        2: "Survol Doctrinal", 
        3: "Groupe de Croissance",
        4: "Groupe de Personne"
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// ===========================================
// ROUTES DE DEBUG
// ===========================================

app.get('/api/debug/general', async (req, res) => {
  try {
    console.log('🔍 DEBUG GÉNÉRAL: Vérification de la base de données');

    const [groupesCount, membresCount, reunionsCount, presencesCount] = await Promise.all([
      supabase.from('groupes').select('*', { count: 'exact', head: true }),
      supabase.from('membres').select('*', { count: 'exact', head: true }),
      supabase.from('reunions').select('*', { count: 'exact', head: true }),
      supabase.from('presences').select('*', { count: 'exact', head: true })
    ]);

    // Dernières présences
    const { data: dernieresPresences } = await supabase
      .from('presences')
      .select(`
        id,
        date_presence,
        membre_id,
        reunion_id
      `)
      .order('date_presence', { ascending: false })
      .limit(10);

    res.json({
      timestamp: new Date().toISOString(),
      statistiques: {
        groupes: groupesCount.count || 0,
        membres: membresCount.count || 0,
        reunions: reunionsCount.count || 0,
        presences: presencesCount.count || 0
      },
      dernieres_presences: dernieresPresences || [],
      routes_debug_disponibles: [
        '/api/debug/general',
        '/api/presences/debug?groupe=X&annee=Y'
      ]
    });

  } catch (err) {
    console.error("❌ Erreur debug général:", err);
    res.status(500).json({ 
      error: "Erreur debug général", 
      details: err.message 
    });
  }
});

// Debug présences par groupe/année
app.get('/api/presences/debug', async (req, res) => {
  const { groupe, annee } = req.query;
  
  if (!groupe || !annee) {
    return res.status(400).json({ 
      error: "Paramètres 'groupe' et 'annee' requis",
      exemple: "/api/presences/debug?groupe=1&annee=2024"
    });
  }
  
  const groupeId = parseInt(groupe, 10);
  const anneeNum = parseInt(annee, 10);

  if (isNaN(groupeId) || isNaN(anneeNum)) {
    return res.status(400).json({ 
      error: "Les paramètres 'groupe' et 'annee' doivent être des nombres valides" 
    });
  }

  try {
    console.log(`🔍 DEBUG: Recherche présences pour groupe ${groupeId}, année ${anneeNum}`);

    // Récupérer les présences avec jointures manuelles
    const { data: presences, error } = await supabase
      .from('presences')
      .select('*')
      .gte('date_presence', `${anneeNum}-01-01`)
      .lte('date_presence', `${anneeNum}-12-31`);

    if (error) {
      console.error("❌ Erreur debug:", error);
      return res.status(500).json({ error: "Erreur debug", details: error.message });
    }

    // Filtrer manuellement par groupe (récupérer d'abord les membres du groupe)
    const { data: membres } = await supabase
      .from('membres')
      .select('id, libelle')
      .eq('groupe_id', groupeId);

    const membresIds = membres ? membres.map(m => m.id) : [];
    const presencesFiltered = presences ? presences.filter(p => membresIds.includes(p.membre_id)) : [];

    console.log(`🔍 DEBUG: ${presencesFiltered.length} présences trouvées`);
    
    res.json({
      parametres: {
        groupe_id: groupeId,
        annee: anneeNum
      },
      total: presencesFiltered.length,
      presences: presencesFiltered
    });

  } catch (err) {
    console.error("❌ Erreur debug:", err);
    res.status(500).json({ 
      error: "Erreur debug", 
      details: err.message 
    });
  }
});

// ===========================================
// ROUTE DE TEST
// ===========================================

app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Serveur Supabase fonctionne correctement",
    timestamp: new Date().toISOString(),
    database: "Supabase",
    routes_disponibles: [
      'GET  /api/test',
      'GET  /api/groupes',
      'GET  /api/reunions',
      'GET  /api/membres?groupe_id=X',
      'GET  /api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W',
      'GET  /api/presences/debug?groupe=X&annee=Y',
      'GET  /api/debug/general',
      'POST /api/login',
      'POST /api/presences',
      'DELETE /api/presences'
    ]
  });
});

// ===========================================
// GESTION DES ERREURS ET DÉMARRAGE
// ===========================================

// Middleware de gestion d'erreur globale
app.use((err, req, res, next) => {
  console.error("❌ Erreur non gérée:", err);
  res.status(500).json({ error: "Erreur serveur interne" });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

// DÉMARRAGE DU SERVEUR
app.listen(port, async () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`📊 Interface d'administration disponible`);
  console.log(`🔗 Base de données: Supabase`);
  console.log(`📡 URL Supabase: ${supabaseUrl}`);
  
  // Tester la connexion au démarrage
  await testSupabaseConnection();
  
  console.log(`🔗 Routes API disponibles:`);
  console.log(`   GET  /api/test`);
  console.log(`   GET  /api/groupes`);
  console.log(`   GET  /api/reunions`);
  console.log(`   GET  /api/membres?groupe_id=X`);
  console.log(`   GET  /api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W`);
  console.log(`   GET  /api/presences/debug?groupe=X&annee=Y`);
  console.log(`   GET  /api/debug/general`);
  console.log(`   POST /api/login`);
  console.log(`   POST /api/presences`);
  console.log(`   DELETE /api/presences`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  console.log('✅ Connexions fermées');
  process.exit(0);
});

*/