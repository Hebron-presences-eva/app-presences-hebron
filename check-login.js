require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkMembres() {
  try {
    const { data, error } = await supabase
      .from('membres')
      .select('id, nom, identifiant, mot_de_passe')
      .limit(5);
    
    if (error) {
      console.error('Erreur:', error);
    } else {
      console.log('Membres disponibles pour test login:');
      data.forEach(membre => {
        console.log(`- Nom: ${membre.nom}, Identifiant: "${membre.identifiant}", Mot de passe: "${membre.mot_de_passe}"`);
      });
    }
  } catch (err) {
    console.error('Erreur:', err);
  }
}

checkMembres();