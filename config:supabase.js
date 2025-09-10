// config/supabase.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test de connexion
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('groupes')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Connexion Supabase réussie !');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion Supabase:', error.message);
    return false;
  }
}

// Fonctions de base de données
const db = {
  // Authentification
  async authenticateMember(identifiant, motDePasse) {
    const { data, error } = await supabase
      .from('membres')
      .select(`
        *,
        groupes (
          id,
          libelle
        )
      `)
      .eq('identifiant', identifiant)
      .eq('mot_de_passe', motDePasse)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Récupérer tous les groupes
  async getGroupes() {
    const { data, error } = await supabase
      .from('groupes')
      .select('*')
      .order('libelle');
    
    if (error) throw error;
    return data;
  },

  // Récupérer tous les membres avec leur groupe
  async getMembres() {
    const { data, error } = await supabase
      .from('membres')
      .select(`
        *,
        groupes (
          id,
          libelle
        )
      `)
      .order('nom');
    
    if (error) throw error;
    return data;
  },

  // Récupérer toutes les réunions
  async getReunions() {
    const { data, error } = await supabase
      .from('reunions')
      .select('*')
      .order('libelle');
    
    if (error) throw error;
    return data;
  },

  // Ajouter une présence
  async addPresence(membreId, datePresence, reunionId) {
    const { data, error } = await supabase
      .from('presences')
      .insert([
        {
          membre_id: membreId,
          date_presence: datePresence,
          reunion_id: reunionId
        }
      ])
      .select(`
        *,
        membres (
          nom,
          groupes (
            libelle
          )
        ),
        reunions (
          libelle
        )
      `);
    
    if (error) throw error;
    return data[0];
  },

  // Récupérer les présences d'une date
  async getPresencesByDate(date) {
    const { data, error } = await supabase
      .from('presences')
      .select(`
        *,
        membres (
          nom,
          groupes (
            libelle
          )
        ),
        reunions (
          libelle
        )
      `)
      .eq('date_presence', date)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Supprimer une présence
  async deletePresence(id) {
    const { error } = await supabase
      .from('presences')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  // Statistiques
  async getStats() {
    const { data: groupes } = await supabase.from('groupes').select('count');
    const { data: membres } = await supabase.from('membres').select('count');
    const { data: presences } = await supabase.from('presences').select('count');
    
    return {
      groupes: groupes?.length || 0,
      membres: membres?.length || 0,
      presences: presences?.length || 0
    };
  }
};

module.exports = { supabase, db, testConnection };