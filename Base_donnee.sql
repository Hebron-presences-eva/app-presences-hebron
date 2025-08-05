-- Database: AppTexte

-- DROP DATABASE IF EXISTS "AppTexte";

CREATE DATABASE "AppTexte"
    WITH
    OWNER = zatourexeva
    ENCODING = 'UTF8'
    LC_COLLATE = 'C'
    LC_CTYPE = 'C'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

-- 🔄 Supprimer les tables si elles existent déjà (ordre inverse des dépendances)
DROP TABLE IF EXISTS presences;
DROP TABLE IF EXISTS membres;
DROP TABLE IF EXISTS groupes;
DROP TABLE IF EXISTS reunions;

-- 📁 Table des groupes de croissance
CREATE TABLE groupes (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL
);

-- 📁 Table des types de réunions
CREATE TABLE reunions (
  id SERIAL PRIMARY KEY,
  libelle VARCHAR(100) UNIQUE NOT NULL
);

-- 👥 Table des membres
CREATE TABLE membres (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  identifiant VARCHAR(50) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  groupe_id INTEGER REFERENCES groupes(id)
);

-- 🗓️ Table des présences
CREATE TABLE presences (
  id SERIAL PRIMARY KEY,
  membre_id INTEGER REFERENCES membres(id),
  date_presence DATE NOT NULL,
  reunion_id INTEGER REFERENCES reunions(id),
  UNIQUE (membre_id, date_presence, reunion_id)
);

-- 🔢 Insérer des groupes
INSERT INTO groupes (nom) VALUES 
  ('Agate'),
  ('Jaspe'),
  ('Diamant'),
  ('Beryl'),
  ('Calcedoine'),
  ('Saphir');

-- 🔢 Insérer des types de réunions
INSERT INTO reunions (libelle) VALUES 
  ('Culte de dimanche'),
  ('Survol doctrinal'),
  ('Réunion GC'),
  ('Réunion GP');

-- 👤 Insérer des membres avec affectation à un groupe
INSERT INTO membres (nom, identifiant, mot_de_passe, groupe_id) VALUES
  ('Andre', 'andre01', 'andre123', 2),
  ('Loic', 'loic02', 'loic123', 2),
  ('Fabrice', 'fabrice03', 'fabrice123', 2),
  ('Billy', 'billy04', 'billy123', 2),
  ('Kevin', 'kevin05', 'kevin123', 2),
  ('Israel', 'israel06', 'israel123', 2),
  ('Caleb', 'caleb07', 'caleb123', 2),
  ('Alvin', 'alvin08', 'alvin123', 2),
  ('Eva', 'eva09', 'eva123', 2),

  ('Gas', 'isr10', 'motdepasse123', 1),
  ('Kams', 'cal11', 'motdepasse123', 1),
  ('Yannick', 'alv12', 'motdepasse123', 4),
  ('Christophe', 'ev13', 'motdepasse123', 3);

-- ✅ Simuler quelques présences (mai 2025)
-- Format : membre_id, date, reunion_id

INSERT INTO presences (membre_id, date_presence, reunion_id) VALUES
-- Groupe Agate (1)
(10, '2025-02-05', 1), -- Andre - Culte
(11, '2025-02-12', 1),

-- Groupe Jaspe (2)
(4, '2025-05-05', 2), -- Billy
(5, '2025-05-12', 2), -- Kevin
(1, '2025-05-05', 2), -- Andre - Culte
(1, '2025-05-12', 2), -- 
(2, '2025-05-12', 1), -- Loic
(3, '2025-05-12', 3), -- Fabrice
(9, '2025-05-05', 2), -- Eva - Doctrinal


-- Groupe Diamant (3)
(13, '2025-05-12', 3), -- Israel - GC

-- Groupe Beryl (4)
(12, '2025-05-12', 4); -- Israel - GC

