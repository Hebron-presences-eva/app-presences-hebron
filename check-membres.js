require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkMembres() {
  try {
    console.log('🔍 Test route membres...');
    
    const { data, error } = await supabase
      .from('membres')
      .select('id, nom, groupe_id')
      .eq('groupe_id', 1)
      .order('nom', { ascending: true });
    
    if (error) {
      console.error('❌ Erreur:', error);
    } else {
      console.log('✅ Succès!');
      console.log(`Nombre de membres dans groupe 1: ${data.length}`);
      console.log('Premier membre:', data[0]);
    }
  } catch (err) {
    console.error('❌ Erreur catch:', err);
  }
}

checkMembres();