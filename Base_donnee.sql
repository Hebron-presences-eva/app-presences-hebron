-- Supprimer les tables si elles existent
DROP TABLE IF EXISTS presences;
DROP TABLE IF EXISTS membres;
DROP TABLE IF EXISTS groupes;
DROP TABLE IF EXISTS reunions;

-- Table groupes
CREATE TABLE groupes (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL
);

-- Table reunions
CREATE TABLE reunions (
  id SERIAL PRIMARY KEY,
  libelle VARCHAR(100) UNIQUE NOT NULL
);

-- Table membres
CREATE TABLE membres (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  identifiant VARCHAR(50) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  groupe_id INTEGER REFERENCES groupes(id)
);

-- Table presences
CREATE TABLE presences (
  id SERIAL PRIMARY KEY,
  membre_id INTEGER REFERENCES membres(id),
  date_presence DATE NOT NULL,
  reunion_id INTEGER REFERENCES reunions(id),
  UNIQUE (membre_id, date_presence, reunion_id)
);

-- Insertion groupes
INSERT INTO groupes (nom) VALUES 
  ('Agate'),
  ('Jaspe'),
  ('Diamant'),
  ('Chrysophase'),
  ('Beryl'),
  ('Topaz');

-- Insertion reunions
INSERT INTO reunions (libelle) VALUES 
  ('Culte de dimanche'),
  ('Survol doctrinal'),
  ('Groupe de croissance'),
  ('Groupe de Personne');

-- Insertion membres
INSERT INTO membres (nom, identifiant, mot_de_passe, groupe_id) VALUES
  
  ('Gas', 'gas10', 'gas123', 1),
  ('Jean-Denis', 'jeand11', 'jeand123', 1),
  ('Jean-Claude', 'jeanC10', 'jeanc123', 1),
  ('Odilon', 'odilon11', 'odilon123', 1),
  ('Lilian', 'lilian10', 'lilian123', 1),
  ('Tresor', 'tresor11', 'tresor123', 1),
  ('Fabrice', 'fabrice10', 'fabrice123', 1),
  ('Omogaby', 'omogaby11', 'omogaby123', 1),
  ('Edwin', 'edwin11', 'edwin123', 1),
  ('Stopyra', 'stopyra10', 'stopyra123', 1),
  
  
  ('Andre', 'andre01', 'andre123', 2),
  ('Loic', 'loic02', 'loic123', 2),
  ('Fabrice', 'fabrice03', 'fabrice123', 2),
  ('Kevin', 'kevin05', 'kevin123', 2),
  ('Israel', 'israel06', 'israel123', 2),
  ('Caleb', 'caleb07', 'caleb123', 2),
  ('Alvin', 'alvin08', 'alvin123', 2),
  ('Eva', 'eva09', 'Simbaye1989', 2),
 
  
  ('David', 'david01', 'david123', 3),
  ('Felix', 'felix02', 'felix123', 3),
  ('Christopher', 'christophe03', 'christophe123', 3),
  ('Jures', 'Jures04', 'Jures123', 3),
  ('Toussaint', 'touss05', 'touss123', 3),
  ('Fofana', 'fofa06', 'fofa123', 3),
  ('Ricot', 'ricot07', 'ricot123', 3),
  ('Platini', 'plati08', 'plati123', 3),
  ('Pytho', 'pytho09', 'pytho123', 3),
  
  
  ('Yannick', 'yann12', 'yann123', 4),
  ('Andrew', 'andrew01', 'andrew123', 4),
  ('Francis', 'francis02', 'francis123', 4),
  ('Cedric', 'cedric03', 'cedric123', 4),
  ('Shady', 'shady04', 'shady123', 4),
  ('Jean-David', 'jean05', 'jean123', 4),
  ('Frederic', 'frederic06', 'frederic123', 4),
  ('Marvin', 'marvin07', 'marvin123', 4),
  ('Blady', 'blady06', 'blady123', 4),
  ('Antony', 'antony07', 'antony123', 4),
  
  
  ('Ambro', 'ambro12', 'ambro123', 5),
  ('Heritier', 'heritier01', 'heritier123', 5),
  ('Louis', 'louis02', 'louis123', 5),
  ('Wesley', 'wesley03', 'wesley123', 5),
  ('Israel', 'israel04', 'israel123', 5),
  ('Sekou', 'sekou05', 'sekou123', 5),
  ('Vincent', 'vincent06', 'vincent123', 5),
  ('Roger', 'roger07', 'roger123', 5),
  ('Jose', 'jose06', 'jose123', 5),
  ('Platiny', 'platiny07', 'platiny123', 5),
  ('Nelson', 'nelson07', 'nelson123', 5),
  
  
  ('Benny', 'benny04', 'benny123', 6),
  ('PA', 'pa05', 'pa123', 6),
  ('Jean-Paul', 'paul06', 'paul123', 6),
  ('Raphael', 'raph07', 'raph123', 6),
  ('Michel', 'michel06', 'michel123', 6),
  ('Didier', 'didier07', 'didier123', 6),
  ('Kamakura', 'kams07', 'kams123', 6),
  
  
  
  

