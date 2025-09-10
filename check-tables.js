require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTables() {
  try {
    console.log('🔍 Vérification des tables Supabase...\n');
    
    // Test simple sans count()
    const { data: groupes, error: groupesError } = await supabase
      .from('groupes')
      .select('*')
      .limit(1);
    
    if (groupesError) {
      console.error('❌ Erreur table groupes:', groupesError);
    } else {
      console.log('✅ Table groupes OK');
      console.log('Colonnes disponibles:', Object.keys(groupes[0] || {}));
      console.log('Premier enregistrement:', groupes[0]);
    }

    console.log('\n---\n');

    const { data: membres, error: membresError } = await supabase
      .from('membres')
      .select('*')
      .limit(1);
    
    if (membresError) {
      console.error('❌ Erreur table membres:', membresError);
    } else {
      console.log('✅ Table membres OK');
      console.log('Colonnes disponibles:', Object.keys(membres[0] || {}));
    }

    console.log('\n---\n');

    const { data: reunions, error: reunionsError } = await supabase
      .from('reunions')
      .select('*')
      .limit(1);
    
    if (reunionsError) {
      console.error('❌ Erreur table reunions:', reunionsError);
    } else {
      console.log('✅ Table reunions OK');
      console.log('Colonnes disponibles:', Object.keys(reunions[0] || {}));
    }

  } catch (err) {
    console.error('❌ Erreur générale:', err);
  }
}

checkTables();