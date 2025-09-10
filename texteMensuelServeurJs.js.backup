

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');


// ✅ AJOUTEZ CES FONCTIONS ICI (LIGNE ~10-15)
function normalizeDate(dateString) {
  // Assure que la date est au format YYYY-MM-DD sans décalage
  const [year, month, day] = dateString.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatDateForClient(pgDate) {
  if (!pgDate) return null;
  
  // Si c'est déjà une string au bon format, la retourner
  if (typeof pgDate === 'string') {
    return pgDate.split('T')[0];
  }
  
  // Si c'est un objet Date de PostgreSQL
  if (pgDate instanceof Date) {
    const year = pgDate.getFullYear();
    const month = String(pgDate.getMonth() + 1).padStart(2, '0');
    const day = String(pgDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}


const app = express();
const port = 3000;


/*
const pool = new Pool({
  user: 'zatourexeva',
  host: 'localhost',
  database: 'appjaspe',
  password: '1989',
  port: 5432, 
  
  timezone: 'UTC'

});
*/

// Code pour PWA 

// ✅ Nouveau code (connexion Render + fallback local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://zatourexeva:1989@localhost:5432/appjaspe',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
 

// Dans texteMensuelServeurJs.js, ajoutez ces headers
app.use((req, res, next) => {
  // Headers pour PWA
  res.setHeader('Service-Worker-Allowed', '/');
  next();
});

// Servir le manifest avec le bon content-type
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.json'));
});




// 2. FONCTION UTILITAIRE POUR NORMALISER LES DATES
function normalizeDate(dateString) {
  // Assure que la date est au format YYYY-MM-DD et force UTC
  //const date = new Date(dateString + 'T00:00:00.000Z');
  //return date.toISOString().split('T')[0];

  const [year, month, day] = dateString.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}




function fixPostgreSQLDate(pgDate) {
  if (!pgDate) return null;
  
  // Si c'est déjà une string au bon format, la retourner
  if (typeof pgDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pgDate)) {
    return pgDate;
  }
  
  // Si c'est un objet Date de PostgreSQL avec décalage
  if (pgDate instanceof Date) {
    // CORRECTION : Ajouter un jour pour compenser le décalage
    const correctedDate = new Date(pgDate);
    correctedDate.setDate(correctedDate.getDate() + 1);
    
    const year = correctedDate.getFullYear();
    const month = String(correctedDate.getMonth() + 1).padStart(2, '0');
    const day = String(correctedDate.getDate()).padStart(2, '0');
    
    console.log(`🔧 Correction date: ${pgDate.toISOString().split('T')[0]} → ${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
  }
  
  return null;
}




app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Test de connexion à la base de données
pool.on('connect', () => {
  console.log('✅ Connexion à PostgreSQL établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL:', err);
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
    const result = await pool.query(
      `SELECT id, nom, groupe_id 
       FROM membres 
       WHERE identifiant = $1 AND mot_de_passe = $2`,
      [identifiant, mot_de_passe]
    );
    
    if (result.rows.length > 0) {
      console.log("✅ Connexion réussie pour:", identifiant);
      return res.json(result.rows[0]);
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
    const result = await pool.query(
      `SELECT id, nom 
       FROM groupes 
       ORDER BY nom ASC`
    );
    
    console.log(`✅ ${result.rows.length} groupes récupérés`);
    res.json(result.rows);
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
    const result = await pool.query(
      `SELECT id, libelle 
       FROM reunions 
       ORDER BY libelle ASC`
    );
    
    console.log(`✅ ${result.rows.length} réunions récupérées`);
    res.json(result.rows);
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
    const result = await pool.query(
      `SELECT id, nom, groupe_id
       FROM membres 
       WHERE groupe_id = $1
       ORDER BY nom ASC`,
      [groupeId]
    );
    
    console.log(`✅ ${result.rows.length} membres récupérés pour le groupe ${groupeId}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur récupération membres:", err);
    res.status(500).json({ error: "Erreur récupération membres" });
  }
});



//===========================================
// CORRECTIONS POUR LES ROUTES
// ===========================================

// 1. Vérifiez que la route debug est bien définie AVANT la route générale /api/presences
// Déplacez cette route AVANT la route GET /api/presences

app.get('/api/presences/debug', async (req, res) => {
  const { groupe, annee } = req.query;
  
  // Validation des paramètres
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

    // Requête simple pour voir toutes les présences
    

    const result = await pool.query(`
      SELECT 
        p.id,
        p.membre_id,
        m.nom as membre_nom,
        (p.date_presence + INTERVAL '1 day')::date as date_presence,
        p.reunion_id,
        r.libelle as reunion_libelle,
        EXTRACT(MONTH FROM p.date_presence) as mois,
        EXTRACT(DAY FROM p.date_presence) as jour
      FROM presences p
      INNER JOIN membres m ON p.membre_id = m.id
      INNER JOIN reunions r ON p.reunion_id = r.id
      WHERE EXTRACT(YEAR FROM p.date_presence) = $1
        AND m.groupe_id = $2
      ORDER BY p.date_presence ASC
    `, [anneeNum, groupeId]);
    


    console.log(`🔍 DEBUG: ${result.rows.length} présences trouvées`);
    
    // Grouper par mois pour analyse
    const parMois = {};
    result.rows.forEach(p => {
      const mois = p.mois;
      if (!parMois[mois]) {
        parMois[mois] = [];
      }
      parMois[mois].push(p);
    });

    console.log(`📊 DEBUG: Répartition par mois:`, Object.keys(parMois).map(m => `${m}: ${parMois[m].length}`));
    
    res.json({
      parametres: {
        groupe_id: groupeId,
        annee: anneeNum
      },
      total: result.rows.length,
      par_mois: Object.keys(parMois).map(mois => ({
        mois: parseInt(mois),
        nombre_presences: parMois[mois].length,
        membres_uniques: [...new Set(parMois[mois].map(p => p.membre_id))].length,
        dates_uniques: [...new Set(parMois[mois].map(p => p.date_presence.toISOString().split('T')[0]))].length
      })),
      presences_detaillees: result.rows.map(p => ({
        id: p.id,
        membre: `${p.membre_nom} (ID:${p.membre_id})`,
        date: formatDateForClient(p.date_presence), // ← UTILISEZ LA FONCTION CORRIGÉE
        //date: p.date_presence.toISOString().split('T')[0],
        mois: p.mois,
        jour: p.jour,
        reunion: `${p.reunion_libelle} (ID:${p.reunion_id})`
      }))
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
// ROUTE POUR LE RÉSUMÉ MENSUEL
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

    // Récupérer tous les membres du groupe avec leurs présences
    const result = await pool.query(`
      SELECT 
        m.id,
        m.nom,
        COUNT(p.id) as total_presences
      FROM membres m
      LEFT JOIN presences p ON m.id = p.membre_id 
        AND EXTRACT(MONTH FROM p.date_presence) = $1
        AND EXTRACT(YEAR FROM p.date_presence) = $2
        AND p.reunion_id = $3
      WHERE m.groupe_id = $4
      GROUP BY m.id, m.nom
      ORDER BY m.nom ASC
    `, [moisNum, anneeNum, reunionId, groupeId]);

    // Compter le nombre total de réunions distinctes pour ce mois
   
  
    const totalReunionsResult = await pool.query(`
      SELECT COUNT(DISTINCT DATE(date_presence)) as total
      FROM presences p
      INNER JOIN membres m ON p.membre_id = m.id
      WHERE EXTRACT(MONTH FROM p.date_presence) = $1
        AND EXTRACT(YEAR FROM p.date_presence) = $2
        AND p.reunion_id = $3
        AND m.groupe_id = $4
    `, [moisNum, anneeNum, reunionId, groupeId]);

    const totalReunions = totalReunionsResult.rows[0]?.total || 0;
   


    const datesReunionsResult = await pool.query(`
      SELECT DISTINCT (date_presence + INTERVAL '1 day')::date as date_presence
      FROM presences p
      INNER JOIN membres m ON p.membre_id = m.id
      WHERE EXTRACT(MONTH FROM date_presence) = $1
        AND EXTRACT(YEAR FROM date_presence) = $2
        AND p.reunion_id = $3
        AND m.groupe_id = $4
      ORDER BY date_presence ASC
    `, [moisNum, anneeNum, reunionId, groupeId]);
    




    //const datesReunions = datesReunionsResult.rows.map(row => row.date_presence);
    const datesReunions = datesReunionsResult.rows.map(row => 
      formatDateForClient(row.date_presence)
    );

    console.log('📊 Total réunions dans le mois:', totalReunions);
    console.log('📊 Membres du groupe:', result.rows.length);









    // Séparer présents et absents
    const presents = [];
    const absents = [];

    result.rows.forEach(membre => {
      const totalPresences = parseInt(membre.total_presences, 10);
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
      total_reunions: parseInt(totalReunions, 10),
      presents,
      absents,

      //C'EST ICI QUE J'AI RAJOUTER 
      dates_reunions: datesReunions, // ➕ Ajout utile
      stats: {
        total_membres: result.rows.length,
        total_presents: presents.length,
        total_absents: absents.length,
        taux_participation: result.rows.length > 0 
          ? Math.round((presents.length / result.rows.length) * 100) 
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
  const reunionIdParam = reunion_id ? parseInt(reunion_id, 10) : null;

  if (isNaN(groupeId) || isNaN(anneeNum)) {
    return res.status(400).json({ error: "Paramètres groupe et annee requis et doivent être des nombres" });
  }

  // MAPPING CORRIGÉ DES TYPES DE RÉUNION
  const reunionTypes = {
    'survol': 2,     // Survol Doctrinal
    'atelier': 4,    // Groupe de Personne
    'croissance': 3, // Groupe de Croissance
    'culte': 1       // Culte de Dimanche
  };

  try {
    console.log(`📅 Données annuelles: Groupe=${groupeId}, Année=${anneeNum}, Type=${type || 'tous'}, ReunionID=${reunionIdParam || 'N/A'}`);

    // 1. Récupérer les membres du groupe
    const membresResult = await pool.query(`
      SELECT id, nom
      FROM membres
      WHERE groupe_id = $1
      ORDER BY nom ASC
    `, [groupeId]);

    const membres = membresResult.rows;
    console.log(`👥 ${membres.length} membres trouvés`);

  

    let presencesQuery = `
  SELECT 
    p.membre_id, 
    (p.date_presence + INTERVAL '1 day')::date as date_presence, 
    p.reunion_id,
    r.libelle as reunion_libelle,
    EXTRACT(MONTH FROM p.date_presence + INTERVAL '1 day') as mois
  FROM presences p
  INNER JOIN reunions r ON r.id = p.reunion_id
  INNER JOIN membres m ON p.membre_id = m.id
  WHERE EXTRACT(YEAR FROM p.date_presence) = $1
    AND m.groupe_id = $2
`;
    
    const queryParams = [anneeNum, groupeId];

    // APPLIQUER LES FILTRES CORRIGÉS
    if (reunionIdParam) {
      // Si un reunion_id spécifique est fourni, l'utiliser
      presencesQuery += ` AND p.reunion_id = $3`;
      queryParams.push(reunionIdParam);
      console.log(`🔍 Filtrage par reunion_id: ${reunionIdParam}`);
    } else if (type && type !== 'tous' && reunionTypes[type]) {
      // Si un type est fourni et existe dans le mapping, utiliser l'ID correspondant
      const reunionIdFromType = reunionTypes[type];
      presencesQuery += ` AND p.reunion_id = $3`;
      queryParams.push(reunionIdFromType);
      console.log(`🔍 Filtrage par type '${type}' -> reunion_id: ${reunionIdFromType}`);
    }

    presencesQuery += ` ORDER BY p.date_presence ASC`;

    const presencesResult = await pool.query(presencesQuery, queryParams);
    console.log(`📊 ${presencesResult.rows.length} présences trouvées`);

    // 3. Organiser les données par mois
    const donnees = {};
    for (let mois = 1; mois <= 12; mois++) {
      donnees[mois] = {
        total_reunions: 0,
        presences_par_membre: {},
        dates_reunions: new Set()
      };
      
      // Initialiser les compteurs pour chaque membre
      membres.forEach(membre => {
        donnees[mois].presences_par_membre[membre.id] = 0;
      });
    }

    // 4. Remplir les données avec les présences
    presencesResult.rows.forEach(presence => {
      const mois = parseInt(presence.mois, 10);
      const membreId = presence.membre_id;
      const dateStr = formatDateForClient(presence.date_presence);
      //const dateStr = presence.date_presence.toISOString().split('T')[0];
      
      if (donnees[mois] && dateStr) {
      //if (donnees[mois]) {
        donnees[mois].presences_par_membre[membreId]++;
        donnees[mois].dates_reunions.add(dateStr);
      }
    });

    // 5. Calculer le nombre de réunions distinctes par mois
    Object.keys(donnees).forEach(mois => {
      donnees[mois].total_reunions = donnees[mois].dates_reunions.size;
      delete donnees[mois].dates_reunions; // Nettoyer les Sets qui ne sont pas sérialisables
    });

    console.log("✅ Données annuelles organisées par mois");

    // AJOUTER DES INFORMATIONS DE DEBUG
    const debugInfo = {
      type_demande: type,
      reunion_id_demande: reunionIdParam,
      reunion_id_utilise: null
    };

    if (type && reunionTypes[type]) {
      debugInfo.reunion_id_utilise = reunionTypes[type];
    } else if (reunionIdParam) {
      debugInfo.reunion_id_utilise = reunionIdParam;
    }

    res.json({
      groupe_id: groupeId,
      annee: anneeNum,
      type_filtre: type || 'tous',
      reunion_id: reunionIdParam,
      membres,
      donnees,
      debug: debugInfo, // Informations de debug
      stats: {
        total_membres: membres.length,
        total_presences: presencesResult.rows.length,
        mois_avec_activite: Object.values(donnees)
          .filter(moisData => moisData.total_reunions > 0).length
      }
    });

  } catch (err) {
    console.error("❌ Erreur données annuelles:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des données annuelles" });
  }
});

// ===========================================
// ROUTE DE DEBUG POUR VÉRIFIER LES MAPPINGS
// ===========================================

app.get('/api/debug/mapping', async (req, res) => {
  try {
    // MAPPING DÉFINI
    const reunionTypes = {
      'survol': 2,     // Survol Doctrinal
      'atelier': 4,    // Groupe de Personne  
      'croissance': 3, // Groupe de Croissance
      'culte': 1       // Culte de Dimanche
    };

    // Récupérer toutes les réunions de la base
    const reunionsResult = await pool.query(`
      SELECT id, libelle 
      FROM reunions 
      ORDER BY id ASC
    `);

    // Vérifier la correspondance
    const correspondances = {};
    const reunionsNonMappees = [];

    reunionsResult.rows.forEach(reunion => {
      const typeCorrespondant = Object.keys(reunionTypes).find(
        key => reunionTypes[key] === reunion.id
      );
      
      if (typeCorrespondant) {
        correspondances[typeCorrespondant] = {
          id: reunion.id,
          libelle: reunion.libelle,
          mapping_correct: true
        };
      } else {
        reunionsNonMappees.push(reunion);
      }
    });

    res.json({
      mapping_defini: reunionTypes,
      reunions_base: reunionsResult.rows,
      correspondances,
      reunions_non_mappees: reunionsNonMappees,
      verification: {
        total_reunions_base: reunionsResult.rows.length,
        total_types_mappes: Object.keys(reunionTypes).length,
        correspondances_trouvees: Object.keys(correspondances).length
      }
    });

  } catch (err) {
    console.error("❌ Erreur debug mapping:", err);
    res.status(500).json({ 
      error: "Erreur debug mapping", 
      details: err.message 
    });
  }
});






// ===========================================
// ROUTES DE DEBUG - À AJOUTER APRÈS LES ROUTES EXISTANTES
// ===========================================

// Debug pour les réunions - NOUVELLE ROUTE
app.get('/api/debug/reunions', async (req, res) => {
  const { groupe, annee } = req.query;
  
  if (!groupe || !annee) {
    return res.status(400).json({ 
      error: "Paramètres 'groupe' et 'annee' requis",
      exemple: "/api/debug/reunions?groupe=1&annee=2024"
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
    console.log(`🔍 DEBUG REUNIONS: Recherche pour groupe ${groupeId}, année ${anneeNum}`);

    // 1. Vérifier les réunions disponibles
    const reunionsResult = await pool.query(`
      SELECT id, libelle 
      FROM reunions 
      ORDER BY libelle ASC
    `);

    // 2. Vérifier les présences par type de réunion pour ce groupe/année
    const presencesParReunionResult = await pool.query(`
      SELECT 
        r.id as reunion_id,
        r.libelle as reunion_nom,
        COUNT(p.id) as total_presences,
        COUNT(DISTINCT p.membre_id) as membres_uniques,
        COUNT(DISTINCT p.date_presence) as dates_uniques,
        MIN(p.date_presence) as premiere_date,
        MAX(p.date_presence) as derniere_date
      FROM reunions r
      LEFT JOIN presences p ON r.id = p.reunion_id 
        AND EXTRACT(YEAR FROM p.date_presence) = $1
        AND p.membre_id IN (
          SELECT id FROM membres WHERE groupe_id = $2
        )
      GROUP BY r.id, r.libelle
      ORDER BY r.libelle ASC
    `, [anneeNum, groupeId]);

    // 3. Statistiques par mois pour chaque type de réunion
    const statsParMoisResult = await pool.query(`
      SELECT 
        r.id as reunion_id,
        r.libelle as reunion_nom,
        EXTRACT(MONTH FROM p.date_presence) as mois,
        COUNT(p.id) as presences_mois,
        COUNT(DISTINCT p.membre_id) as membres_mois,
        COUNT(DISTINCT p.date_presence) as dates_mois
      FROM reunions r
      INNER JOIN presences p ON r.id = p.reunion_id
      INNER JOIN membres m ON p.membre_id = m.id
      WHERE EXTRACT(YEAR FROM p.date_presence) = $1
        AND m.groupe_id = $2
      GROUP BY r.id, r.libelle, mois
      ORDER BY r.libelle, mois ASC
    `, [anneeNum, groupeId]);

    // Organiser les stats par mois
    const statsParReunion = {};
    statsParMoisResult.rows.forEach(row => {
      if (!statsParReunion[row.reunion_id]) {
        statsParReunion[row.reunion_id] = {
          reunion_nom: row.reunion_nom,
          par_mois: {}
        };
      }
      statsParReunion[row.reunion_id].par_mois[row.mois] = {
        presences: parseInt(row.presences_mois),
        membres_uniques: parseInt(row.membres_mois),
        dates_uniques: parseInt(row.dates_mois)
      };
    });

    console.log(`📊 DEBUG: ${reunionsResult.rows.length} réunions trouvées`);
    console.log(`📊 DEBUG: ${presencesParReunionResult.rows.length} types avec présences`);

    res.json({
      parametres: {
        groupe_id: groupeId,
        annee: anneeNum
      },
      reunions_disponibles: reunionsResult.rows,
      presences_par_reunion: presencesParReunionResult.rows.map(r => ({
        reunion_id: r.reunion_id,
        reunion_nom: r.reunion_nom,
        total_presences: parseInt(r.total_presences || 0),
        membres_uniques: parseInt(r.membres_uniques || 0),
        dates_uniques: parseInt(r.dates_uniques || 0),
        premiere_date: formatDateForClient(r.premiere_date), // ← UTILISEZ LA FONCTION
        derniere_date: formatDateForClient(r.derniere_date)  // ← UTILISEZ LA FONCTION
  })),
      stats_par_mois: statsParReunion,
      resumé: {
        total_reunions_disponibles: reunionsResult.rows.length,
        reunions_avec_presences: presencesParReunionResult.rows.filter(r => r.total_presences > 0).length,
        total_presences_annee: presencesParReunionResult.rows.reduce((sum, r) => sum + parseInt(r.total_presences || 0), 0)
      }
    });

  } catch (err) {
    console.error("❌ Erreur debug réunions:", err);
    res.status(500).json({ 
      error: "Erreur debug réunions", 
      details: err.message 
    });
  }
});

// Debug pour les membres d'un groupe - NOUVELLE ROUTE
app.get('/api/debug/membres', async (req, res) => {
  const { groupe } = req.query;
  
  if (!groupe) {
    return res.status(400).json({ 
      error: "Paramètre 'groupe' requis",
      exemple: "/api/debug/membres?groupe=1"
    });
  }
  
  const groupeId = parseInt(groupe, 10);

  if (isNaN(groupeId)) {
    return res.status(400).json({ 
      error: "Le paramètre 'groupe' doit être un nombre valide" 
    });
  }

  try {
    console.log(`🔍 DEBUG MEMBRES: Recherche pour groupe ${groupeId}`);

    // Informations sur le groupe
    const groupeResult = await pool.query(`
      SELECT id, nom FROM groupes WHERE id = $1
    `, [groupeId]);

    if (groupeResult.rows.length === 0) {
      return res.status(404).json({ error: "Groupe non trouvé" });
    }

    // Liste des membres avec statistiques
    const membresResult = await pool.query(`
      SELECT 
        m.id,
        m.nom,
        m.identifiant,
        m.groupe_id,
        COUNT(p.id) as total_presences_all_time,
        MIN(p.date_presence) as premiere_presence,
        MAX(p.date_presence) as derniere_presence
      FROM membres m
      LEFT JOIN presences p ON m.id = p.membre_id
      WHERE m.groupe_id = $1
      GROUP BY m.id, m.nom, m.identifiant, m.groupe_id
      ORDER BY m.nom ASC
    `, [groupeId]);

    console.log(`👥 DEBUG: ${membresResult.rows.length} membres trouvés`);

    res.json({
      groupe: groupeResult.rows[0],
      membres: membresResult.rows.map(m => ({
        id: m.id,
        nom: m.nom,
        identifiant: m.identifiant,
        total_presences: parseInt(m.total_presences_all_time || 0),
        premiere_presence: m.premiere_presence ? m.premiere_presence.toISOString().split('T')[0] : null,
        derniere_presence: m.derniere_presence ? m.derniere_presence.toISOString().split('T')[0] : null
      })),
      stats: {
        total_membres: membresResult.rows.length,
        premiere_presence: formatDateForClient(m.premiere_presence), // ← UTILISEZ LA FONCTION
        derniere_presence: formatDateForClient(m.derniere_presence)  // ← UTILISEZ LA FONCTION
 
        //membres_avec_presences: membresResult.rows.filter(m => m.total_presences_all_time > 0).length,
        //membres_sans_presences: membresResult.rows.filter(m => m.total_presences_all_time == 0).length
      }
    });

  } catch (err) {
    console.error("❌ Erreur debug membres:", err);
    res.status(500).json({ 
      error: "Erreur debug membres", 
      details: err.message 
    });
  }
});

// Route de debug générale - AMÉLIORER L'EXISTANTE
app.get('/api/debug/general', async (req, res) => {
  try {
    console.log('🔍 DEBUG GÉNÉRAL: Vérification de la base de données');

    // Compter les tables principales
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM groupes'),
      pool.query('SELECT COUNT(*) as count FROM membres'),
      pool.query('SELECT COUNT(*) as count FROM reunions'),
      pool.query('SELECT COUNT(*) as count FROM presences')
    ]);

    // Dernières présences
    const dernieresPresences = await pool.query(`
      SELECT 
        p.id,
        m.nom as membre_nom,
        r.libelle as reunion_nom,
        g.nom as groupe_nom,
        p.date_presence
      FROM presences p
      INNER JOIN membres m ON p.membre_id = m.id
      INNER JOIN reunions r ON p.reunion_id = r.id
      INNER JOIN groupes g ON m.groupe_id = g.id
      ORDER BY p.date_presence DESC
      LIMIT 10
    `);

    res.json({
      timestamp: new Date().toISOString(),
      statistiques: {
        groupes: parseInt(counts[0].rows[0].count),
        membres: parseInt(counts[1].rows[0].count),
        reunions: parseInt(counts[2].rows[0].count),
        presences: parseInt(counts[3].rows[0].count)
      },
      dernieres_presences: dernieresPresences.rows.map(p => ({
        id: p.id,
        membre: p.membre_nom,
        reunion: p.reunion_nom,
        groupe: p.groupe_nom,
        date: formatDateForClient(p.date_presence) // ← UTILISEZ LA FONCTION
        //date: p.date_presence.toISOString().split('T')[0]
      })),
      routes_debug_disponibles: [
        '/api/debug/general',
        '/api/debug/reunions?groupe=X&annee=Y',
        '/api/debug/membres?groupe=X',
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

// ===========================================
// MISE À JOUR DE LA ROUTE DE TEST
// ===========================================

// Modifier la route de test existante pour inclure les nouvelles routes
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Serveur fonctionne correctement",
    timestamp: new Date().toISOString(),
    routes_disponibles: [
      '/api/test',
      '/api/groupes',
      '/api/reunions',
      '/api/membres?groupe_id=X',
      '/api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W',
      '/api/presences/debug?groupe=X&annee=Y',
      '/api/presences/resume?groupe=X&reunion_id=Y&mois=Z&annee=W',
      '/api/presences/annuel?groupe=X&annee=Y',
      // NOUVELLES ROUTES DE DEBUG
      '/api/debug/general',
      '/api/debug/reunions?groupe=X&annee=Y',
      '/api/debug/membres?groupe=X'
    ]
  });
});






// ===========================================
// ROUTES POUR LES PRÉSENCES - VUE MENSUELLE
// ===========================================

app.get('/api/presences', async (req, res) => {
  const { groupe, reunion_id, mois, annee } = req.query;
  
  // Validation des paramètres
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
    const groupeCheck = await pool.query(
      `SELECT id, nom FROM groupes WHERE id = $1`, 
      [groupeId]
    );
    
    if (groupeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Groupe non trouvé" });
    }

    // 2. Vérifier l'existence de la réunion
    const reunionCheck = await pool.query(
      `SELECT id, libelle FROM reunions WHERE id = $1`, 
      [reunionId]
    );
    
    if (reunionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Réunion non trouvée" });
    }

    // 3. Récupérer les membres du groupe
    const membresResult = await pool.query(
      `SELECT id, nom, groupe_id
       FROM membres 
       WHERE groupe_id = $1
       ORDER BY nom ASC`,
      [groupeId]
    );

    console.log(`👥 ${membresResult.rows.length} membres trouvés`);

    


    const presencesResult = await pool.query(
      `SELECT membre_id, 
              (date_presence + INTERVAL '1 day')::date as date_presence,
              reunion_id
       FROM presences
       WHERE EXTRACT(MONTH FROM date_presence) = $1
         AND EXTRACT(YEAR FROM date_presence) = $2
         AND reunion_id = $3
         AND membre_id IN (
           SELECT id FROM membres WHERE groupe_id = $4
         )
       ORDER BY date_presence ASC`,
      [moisNum, anneeNum, reunionId, groupeId]
    );



    console.log(`📅 ${presencesResult.rows.length} présences trouvées`);

    // Calculer le nombre de jours dans le mois
    const nombreJours = new Date(anneeNum, moisNum, 0).getDate();

    res.json({
      groupe: groupeCheck.rows[0],
      reunion: reunionCheck.rows[0],
      mois: moisNum,
      annee: anneeNum,
      nombre_jours: nombreJours,
      membres: membresResult.rows,
      presences: presencesResult.rows
    });

  } catch (err) {
    console.error("❌ Erreur GET /api/presences:", err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des présences" });
  }
});



// ===========================================
// ORDRE CORRECT DES ROUTES (très important!)
// ===========================================

// 1. Routes spécifiques d'abord
app.get('/api/presences/debug', /* ... code ci-dessus ... */);
app.get('/api/presences/resume', /* ... votre code existant ... */);
app.get('/api/presences/annuel', /* ... votre code existant ... */);

// 2. Route générale en dernier
app.get('/api/presences', /* ... votre code existant ... */);

// ===========================================
// MIDDLEWARE DE LOGGING POUR DIAGNOSTIC
// ===========================================

// Ajoutez ce middleware au début pour logger toutes les requêtes
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`, req.query);
  next();
});

// ===========================================
// ROUTE DE TEST SIMPLE
// ===========================================

// Ajoutez une route de test simple
app.get('/api/test', (req, res) => {
  res.json({ 
    message: "Serveur fonctionne correctement",
    timestamp: new Date().toISOString(),
    routes_disponibles: [
      '/api/test',
      '/api/groupes',
      '/api/reunions',
      '/api/membres?groupe_id=X',
      '/api/presences/debug?groupe=X&annee=Y',
      '/api/presences/resume?groupe=X&reunion_id=Y&mois=Z&annee=W',
      '/api/presences/annuel?groupe=X&annee=Y',
      '/api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W'
    ]
  });
});

// ===========================================
// VÉRIFICATION DE L'ORDRE DES ROUTES
// ===========================================

console.log("🔍 Vérification de l'ordre des routes:");
console.log("   1. /api/presences/debug");
console.log("   2. /api/presences/resume");  
console.log("   3. /api/presences/annuel");
console.log("   4. /api/presences (route générale)");
console.log("⚠️  IMPORTANT: Les routes spécifiques doivent être définies AVANT la route générale!");






// ===========================================
// ROUTES MODIFICATION DES PRÉSENCES
// ===========================================

// Ajouter des présences
app.post('/api/presences', async (req, res) => {
  const presences = req.body;
  
  // Validation du format
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

    // Validation du format de date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date_presence)) {
      return res.status(400).json({ 
        error: `Présence ${i + 1}: date_presence doit être au format YYYY-MM-DD` 
      });
    }
  }

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    let insertCount = 0;
    let duplicateCount = 0;
    
    for (const p of presences) {
      const membreId = parseInt(p.membre_id);
      const reunionId = parseInt(p.reunion_id);
      
      // Vérifier si la présence existe déjà
      const existingResult = await client.query(
        `SELECT id FROM presences 
         WHERE membre_id = $1 AND date_presence = $2 AND reunion_id = $3`,
        [membreId, p.date_presence, reunionId]
      );
      
      if (existingResult.rows.length > 0) {
        duplicateCount++;
        console.log(`⚠️ Présence déjà existante: membre ${membreId}, date ${p.date_presence}, réunion ${reunionId}`);
      } else {
        await client.query(
          `INSERT INTO presences (membre_id, date_presence, reunion_id)
           VALUES ($1, $2, $3)`,
          [membreId, p.date_presence, reunionId]
        );
        insertCount++;
      }
    }

    await client.query('COMMIT');
    
    console.log(`✅ Présences traitées: ${insertCount} ajoutées, ${duplicateCount} doublons ignorés`);
    
    res.json({ 
      success: true, 
      inserted: insertCount,
      duplicates: duplicateCount,
      total_processed: presences.length
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Erreur ajout présences:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout des présences" });
  } finally {
    client.release();
  }
});

// Supprimer une présence
app.delete('/api/presences', async (req, res) => {
  const { membre_id, date_presence, reunion_id } = req.body;

  // Validation des paramètres
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

    const result = await pool.query(
      `DELETE FROM presences 
       WHERE membre_id = $1 AND date_presence = $2 AND reunion_id = $3`,
      [membreId, date_presence, reunionId]
    );

    if (result.rowCount === 0) {
      console.log("⚠️ Aucune présence trouvée à supprimer");
      return res.status(404).json({ error: "Présence non trouvée" });
    }

    console.log("✅ Présence supprimée avec succès");
    res.json({ 
      success: true, 
      message: "Présence supprimée",
      deleted_count: result.rowCount
    });

  } catch (err) {
    console.error("❌ Erreur suppression présence:", err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression" });
  }
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

// Démarrage du serveur
app.listen(port, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
  console.log(`📊 Interface d'administration disponible`);
  console.log(`🔗 Routes API disponibles:`);
  console.log(`   GET  /api/groupes`);
  console.log(`   GET  /api/reunions`);
  console.log(`   GET  /api/membres?groupe_id=X`);
  console.log(`   GET  /api/presences?groupe=X&reunion_id=Y&mois=Z&annee=W`);
  console.log(`   GET  /api/presences/resume?groupe=X&reunion_id=Y&mois=Z&annee=W`);
  console.log(`   GET  /api/presences/annuel?groupe=X&annee=Y[&type=Z][&reunion_id=W]`);
  console.log(`   POST /api/presences`);
  console.log(`   DELETE /api/presences`);
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await pool.end();
  console.log('✅ Connexions fermées');
  process.exit(0);
});



