
console.log("JS chargé !");

// ===================================
// FONCTION D'AUTHENTIFICATION
// ===================================
function fetchAvecAuth(url, options = {}) {
  const membre = JSON.parse(localStorage.getItem("membre"));
  
  if (!membre) {
    alert("Session expirée, veuillez vous reconnecter");
    window.location.href = "login.html";
    return Promise.reject("Non authentifié");
  }
  
  // Ajouter le header avec les données du membre
  options.headers = {
    ...options.headers,
    'X-Membre-Data': JSON.stringify(membre)
  };
  
  return fetch(url, options);
}


document.addEventListener("DOMContentLoaded", () => {
  const moisSelect = document.getElementById("mois");
  const anneeSelect = document.getElementById("annee");
  const groupeSelect = document.getElementById("groupe");
  const reunionSelect = document.getElementById("reunion");
  const typeSelect = document.getElementById("type");
  const headerRow = document.getElementById("header-row");
  const tableBody = document.getElementById("table-body");
  const tableAnnuel = document.getElementById("tableAnnuel");
  
  // NOUVEAUX ÉLÉMENTS POUR LA GESTION DES VUES
  const btnVueMensuelle = document.getElementById("btnVueMensuelle");
  const btnGroupePersonneAnnuel = document.getElementById("btnGroupePersonneAnnuel");
  const btnPresenceAnnee = document.getElementById("btnPresenceAnnee");
  const tableMensuelWrapper = document.getElementById("table-mensuel-wrapper");
  const resumeTable = document.getElementById("resumeTable");
  const texteMensuel = document.getElementById("texteMensuel");

  const moisNoms = ["Jan", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];




// ✅ FONCTION UTILITAIRE POUR EXTRAIRE LE MOIS SANS DÉCALAGE DE TIMEZONE - CORRIGÉE
function extraireMoisSansDecalage(dateString) {
  if (!dateString) return null;
  
  // Extraire directement le mois de la chaîne ISO (format: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
  const matches = dateString.match(/^\d{4}-(\d{2})-\d{2}/);
  if (matches) {
    return parseInt(matches[1], 10); // Retourne le mois (1-12)
  }
  
  // Fallback amélioré pour éviter les décalages
  console.warn("⚠️ Format de date non reconnu:", dateString);
  const date = new Date(dateString + 'T00:00:00'); // Forcer l'heure locale
  return date.getMonth() + 1;
}

// ✅ FONCTION UTILITAIRE POUR EXTRAIRE LE JOUR SANS DÉCALAGE - CORRIGÉE
function extraireJourSansDecalage(dateString) {
  if (!dateString) return null;
  
  const matches = dateString.match(/^\d{4}-\d{2}-(\d{2})/);
  if (matches) {
    return parseInt(matches[1], 10); // Retourne le jour (1-31)
  }
  
  console.warn("⚠️ Format de date non reconnu:", dateString);
  const date = new Date(dateString + 'T00:00:00'); // Forcer l'heure locale
  return date.getDate();
}







// VÉRIFICATION DES ÉLÉMENTS AVANT UTILISATION
if (!moisSelect || !anneeSelect || !groupeSelect || !reunionSelect) {
  console.error("❌ Éléments HTML manquants ! Vérifiez vos IDs dans le HTML.");
  return;
}


  // Récupérer les paramètres URL
  const params = new URLSearchParams(window.location.search);
  const groupeIdURL = params.get("groupe");
  const moisURL = params.get("mois");
  const anneeURL = params.get("annee");
  const reunionIdURL = params.get("reunion_id") || params.get("reunion");

  // Initialiser les années - AVEC VÉRIFICATION
  const currentYear = new Date().getFullYear();
  console.log("📅 Année actuelle détectée:", currentYear);
  for (let y = currentYear - 2; y <= currentYear + 1; y++) {
    const option = new Option(y, y);
    if (anneeSelect) {
      anneeSelect.append(option);
    }
  }

  // Initialiser les mois - AVEC VÉRIFICATION
  moisNoms.forEach((nom, index) => {
    if (moisSelect) {
      moisSelect.append(new Option(nom, index + 1));
    }
  });

  // Définir les valeurs par défaut ou depuis l'URL
  if (moisURL && moisSelect) moisSelect.value = moisURL;
  else if (moisSelect) moisSelect.value = new Date().getMonth() + 1;
  
  if (anneeURL && anneeSelect) anneeSelect.value = anneeURL;
  else if (anneeSelect) anneeSelect.value = currentYear;

  // FONCTION POUR BASCULER ENTRE VUE MENSUELLE ET ANNUELLE
  function afficherVueMensuelle() {
    console.log("🔄 Basculement vers vue mensuelle");
    if (tableMensuelWrapper) tableMensuelWrapper.classList.remove("hidden");
    if (resumeTable) resumeTable.classList.remove("hidden");
    if (texteMensuel) texteMensuel.classList.remove("hidden");
    if (tableAnnuel) tableAnnuel.classList.add("hidden");
    
    // Afficher les contrôles mensuels
    if (moisSelect) moisSelect.parentElement.style.display = "inline-block";
  }

  function afficherVueAnnuelle() {
    console.log("🔄 Basculement vers vue annuelle");
    if (tableMensuelWrapper) tableMensuelWrapper.classList.add("hidden");
    if (resumeTable) resumeTable.classList.add("hidden");
    if (texteMensuel) texteMensuel.classList.add("hidden");
    if (tableAnnuel) tableAnnuel.classList.remove("hidden");
    
    // Masquer les contrôles mensuels
    if (moisSelect) moisSelect.parentElement.style.display = "none";
  }

  // MAPPING CORRIGÉ DES TYPES DE RÉUNION
  const reunionTypes = {
  'tous': 1,        // Culte de Dimanche (ID: 1) 
  'reunion': 2,     // Survol Doctrinal (ID: 2) ← VOICI VOTRE PROBLÈME !
  'croissance': 3,  // Groupe de Croissance (ID: 3)
  'atelier': 4      // Groupe de Personne (ID: 4)
  };

  // GESTION DES ÉVÉNEMENTS POUR LES BOUTONS DE NAVIGATION
  
  // ▶️ Vue mensuelle
  if (btnVueMensuelle) {
    btnVueMensuelle.addEventListener("click", () => {
      console.log("👆 Clic sur Vue Mensuelle");
      if (typeSelect) typeSelect.value = "";
      afficherVueMensuelle();
      chargerPresence();
    });
  }

  // ▶️ Groupe de personne (Annuel)
  if (btnGroupePersonneAnnuel) {
    btnGroupePersonneAnnuel.addEventListener("click", () => {
      console.log("👆 Clic sur Groupe de personne (Annuel)");

      // CORRECTION : Vérifier le bon type pour "Groupe de Personne"
      // Vous devez adapter cette valeur selon votre base de données
      const type = "atelier"; // ou "groupe_personne" selon votre API
      const reunionId = reunionTypes[type];

      console.log("🔍 Configuration Groupe de Personne:", { type, reunionId });

      if (typeSelect) typeSelect.value = type;
      if (reunionSelect && reunionId) {
        reunionSelect.value = reunionId;
        console.log("✅ Réunion sélectionnée:", reunionSelect.value);
      }

      afficherVueAnnuelle();
      chargerPresenceAnnuelle();
    });
  }

  // ▶️ Présence de l'année (Tous types)
  if (btnPresenceAnnee) {
    btnPresenceAnnee.addEventListener("click", () => {
      console.log("👆 Clic sur Présence de l'année");

      if (typeSelect) typeSelect.value = "tous";
      // Ne pas modifier reunionSelect pour "tous"

      afficherVueAnnuelle();
      chargerPresenceAnnuelle();
    });
  }









  // ✅ BOUTON CULTE (ID: 1)
const btnCulte = document.getElementById("btnCulte");
if (btnCulte) {
  btnCulte.addEventListener("click", () => {
    console.log("👆 Clic sur Culte (Annuel)");
    
    if (typeSelect) typeSelect.value = "tous";
    if (reunionSelect) reunionSelect.value = 1;
    
    afficherVueAnnuelle();
    chargerPresenceAnnuelle();
  });
}

// ✅ BOUTON SURVOL DOCTRINAL (ID: 2)
const btnSurvolDoctrinal = document.getElementById("btnSurvolDoctrinal");
if (btnSurvolDoctrinal) {
  btnSurvolDoctrinal.addEventListener("click", () => {
    console.log("👆 Clic sur Survol Doctrinal (Annuel)");
    
    const type = "reunion";
    const reunionId = reunionTypes[type];
    
    if (typeSelect) typeSelect.value = type;
    if (reunionSelect) reunionSelect.value = reunionId;
    
    afficherVueAnnuelle();
    chargerPresenceAnnuelle();
  });
}

// ✅ BOUTON GROUPE DE CROISSANCE (ID: 3) - NOUVEAU
const btnGroupeCroissance = document.getElementById("btnGroupeCroissance");
if (btnGroupeCroissance) {
  btnGroupeCroissance.addEventListener("click", () => {
    console.log("👆 Clic sur Groupe de Croissance (Annuel)");
    
    const type = "croissance";
    const reunionId = reunionTypes[type];
    
    console.log("🔍 Configuration Groupe de Croissance:", { type, reunionId });
    
    if (typeSelect) typeSelect.value = type;
    if (reunionSelect) reunionSelect.value = reunionId;
    
    afficherVueAnnuelle();
    chargerPresenceAnnuelle();
  });
}

// ✅ BOUTON GROUPE DE PERSONNE (ID: 4) - CORRIGÉ
const btnGroupePersonne = document.getElementById("btnGroupePersonne");
if (btnGroupePersonne) {
  btnGroupePersonne.addEventListener("click", () => {
    console.log("👆 Clic sur Groupe de Personne (Annuel)");
    
    const type = "atelier";
    const reunionId = reunionTypes[type];
    
    if (typeSelect) typeSelect.value = type;
    if (reunionSelect) reunionSelect.value = reunionId;
    
    afficherVueAnnuelle();
    chargerPresenceAnnuelle();
  });
}

// TEST : Vérifiez que tous les IDs correspondent
console.log("🔍 Test mapping des réunions:");
console.log("ID 1 (Culte):", reunionTypes['tous']);
console.log("ID 2 (Survol):", reunionTypes['reunion']);
console.log("ID 3 (Croissance):", reunionTypes['croissance']);
console.log("ID 4 (Groupe Personne):", reunionTypes['atelier']);











  // ▶️ Réagir au changement du menu déroulant (typeSelect)
  if (typeSelect) {
    typeSelect.addEventListener("change", () => {
      const type = typeSelect.value;
      const reunionId = reunionTypes[type];

      console.log("🔄 Changement de type :", type, "=> reunionId:", reunionId);

      // Met à jour la réunion sélectionnée
      if (reunionSelect && reunionId && type !== "tous") {
        reunionSelect.value = reunionId;
        console.log("✅ Réunion mise à jour:", reunionSelect.value);
      }

      // Affiche la bonne vue
      if (type === "" || type === null) {
        afficherVueMensuelle();
        chargerPresence();
      } else {
        afficherVueAnnuelle();
        chargerPresenceAnnuelle();
      }
    });
  }

  // Charger les groupes avec gestion d'erreur améliorée
  fetchAvecAuth("/api/groupes")
  .then(res => {
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      return res.json();
    })
    .then(groupes => {
      console.log("✅ Groupes chargés:", groupes);
      
      if (!Array.isArray(groupes)) {
        throw new Error("Les données des groupes ne sont pas un tableau");
      }

      groupes.forEach(groupe => {
        if (groupeSelect && groupe.nom && groupe.id) {
          groupeSelect.append(new Option(groupe.nom, groupe.id));
        }
      });
      
      // Sélectionner le groupe depuis l'URL ou localStorage
      if (groupeIdURL && groupeSelect) {
        groupeSelect.value = groupeIdURL;
      } else if (groupeSelect) {
        const storedGroupe = localStorage.getItem("groupe");
        if (storedGroupe) groupeSelect.value = storedGroupe;
      }
      
      // Sélectionner la réunion depuis l'URL ou localStorage
      if (reunionIdURL && reunionSelect) {
        reunionSelect.value = reunionIdURL;
      } else if (reunionSelect) {
        const storedReunion = localStorage.getItem("reunion");
        if (storedReunion) {
          reunionSelect.value = storedReunion;
        }
      }
      
      // Charger les présences si tous les paramètres sont disponibles
      if (groupeSelect && reunionSelect && groupeSelect.value && reunionSelect.value) {
        chargerPresence();
      }
    })
    .catch(err => {
      console.error("❌ Erreur chargement groupes :", err);
    });

  // FONCTION POUR CHARGER LES PRÉSENCES ANNUELLES - VERSION CORRIGÉE
  function chargerPresenceAnnuelle() {
    const groupeId = groupeSelect?.value;
    const annee = anneeSelect?.value;
    const typeReunion = typeSelect?.value;

    console.log("📅 Chargement présences annuelles:", { groupeId, annee, typeReunion });

    if (!groupeId || !annee) {
      console.log("❌ Paramètres manquants pour vue annuelle");
      return;
    }

    if (!tableAnnuel) {
      console.error("❌ Table annuelle non trouvée");
      return;
    }

    // CONSTRUCTION DE L'URL CORRIGÉE
    let url = `/api/presences/annuel?groupe=${groupeId}&annee=${annee}`;
    
    // Ajouter le paramètre type seulement si ce n'est pas "tous"
    if (typeReunion && typeReunion !== "tous" && typeReunion !== "") {
      url += `&type=${typeReunion}`;
    }
    
    // ALTERNATIVE : Si votre API attend un reunion_id au lieu d'un type
    if (typeReunion && typeReunion !== "tous" && typeReunion !== "" && reunionTypes[typeReunion]) {
      url += `&reunion_id=${reunionTypes[typeReunion]}`;
    }

    console.log("🌐 URL API annuelle:", url);

    // Afficher un indicateur de chargement
    const tbody = tableAnnuel.querySelector("tbody");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; padding: 20px;">🔄 Chargement des données...</td></tr>';
    }

    fetchAvecAuth(url)
      .then(res => {
        console.log("📡 Réponse API:", res.status, res.statusText);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        console.log("📥 Données annuelles reçues:", data);
        
        if (!data || !data.membres) {
          throw new Error("Données manquantes dans la réponse");
        }
        
        construireTableauAnnuel(data);
      })
      .catch(err => {
        console.error("❌ Erreur chargement données annuelles:", err);
        if (tableAnnuel) {
          const tbody = tableAnnuel.querySelector("tbody");
          if (tbody) {
            tbody.innerHTML = `<tr><td colspan="13" style="color: red; text-align: center; padding: 20px;">❌ Erreur: ${err.message}</td></tr>`;
          }
        }
      });
  }

  // FONCTION POUR CONSTRUIRE LE TABLEAU ANNUEL - VERSION CORRIGÉE
  function construireTableauAnnuel(data) {
    if (!tableAnnuel) return;

    const thead = tableAnnuel.querySelector("thead");
    const tbody = tableAnnuel.querySelector("tbody");

    if (!thead || !tbody) {
      console.error("❌ Structure de table annuelle manquante");
      return;
    }

    console.log("🔍 Données reçues pour le tableau annuel:", data);

    // Construire l'en-tête
    thead.innerHTML = `
      <tr>
        <th>Membre</th>
        ${moisNoms.map(mois => `<th>${mois}</th>`).join('')}
        <th>Total</th>
      </tr>
    `;

    // Construire le corps du tableau
    const membres = data.membres || [];
    const donnees = data.donnees || {};
    const presences = data.presences || []; // Fallback pour format simple

    console.log("👥 Membres:", membres.length);
    console.log("📊 Données par mois:", Object.keys(donnees));
    console.log("📊 Présences directes:", presences.length);

    if (membres.length === 0) {
      tbody.innerHTML = '<tr><td colspan="13" style="text-align: center; padding: 20px;">Aucun membre trouvé pour ce groupe</td></tr>';
      return;
    }

    tbody.innerHTML = membres.map(membre => {
      let totalPresences = 0;
      
      const cellulesPresences = moisNoms.map((_, moisIndex) => {
        const moisNum = moisIndex + 1;
        let presencesMois = 0;

        // Gérer les deux formats possibles de données
        if (donnees[moisNum]) {
          // Format avec données structurées par mois
          presencesMois = donnees[moisNum]?.presences_par_membre?.[membre.id] || 0;
        } else if (presences.length > 0) {
          // Format avec array simple de présences
          
          presencesMois = presences.filter(p => {
            const membreMatch = parseInt(p.membre_id, 10) === membre.id;
            // Utiliser la fonction utilitaire pour éviter les décalages
            const moisPresence = extraireMoisSansDecalage(p.date_presence);
            return membreMatch && moisPresence === moisNum;
          }).length;
        }


        totalPresences += presencesMois;
        
        // Déterminer la classe CSS selon le nombre de présences
        let classeCSS = "vide";
        if (presencesMois > 0) {
      



        classeCSS = "present"; 
      }
      // Optionnel : Si vous voulez différencier selon le nombre :
       if (presencesMois === 0) {
        classeCSS = "vide";
       } else if (presencesMois >= 3) {
        classeCSS = "present"; // Vert
       } else {
        classeCSS = "partial"; // Nouvelle classe pour présence partielle
       }
      




        return `<td class="${classeCSS}">${presencesMois || '-'}</td>`;
      }).join('');

      return `
        <tr>
          <td>${membre.nom}</td>
          ${cellulesPresences}
          <td class="total">${totalPresences}</td>
        </tr>
      `;
    }).join('');

    console.log("✅ Tableau annuel construit avec", membres.length, "membres");
  }




// ✅ TEST DE LA FONCTION UTILITAIRE
console.log("🧪 Test extraction mois:");
console.log("2024-01-15T00:00:00 ->", extraireMoisSansDecalage("2024-01-15T00:00:00")); // Doit afficher: 1
console.log("2024-12-25 ->", extraireMoisSansDecalage("2024-12-25")); // Doit afficher: 12

// ✅ COMPARAISON AVEC L'ANCIENNE MÉTHODE
console.log("📊 Comparaison méthodes:");
const testDate = "2024-01-15T00:00:00";
console.log("Ancienne méthode (avec décalage):", new Date(testDate).getMonth() + 1);
console.log("Nouvelle méthode (sans décalage):", extraireMoisSansDecalage(testDate));


  function chargerPresence() {
    const groupeId = groupeSelect?.value;
    const reunionId = reunionSelect?.value;
    const mois = moisSelect?.value;
    const annee = anneeSelect?.value;

    console.log("🔍 Chargement présences:", { groupeId, reunionId, mois, annee });

    if (!groupeId || !reunionId || !mois || !annee) {
        console.log("❌ Paramètres manquants");
        return;
    }

    // S'assurer qu'on est en vue mensuelle
    afficherVueMensuelle();

    // Créer l'en-tête du tableau avec tous les jours du mois
    const nbJoursMois = new Date(annee, mois, 0).getDate();
    if (headerRow) {
      headerRow.innerHTML = `<th>Membre</th>` +
          Array.from({ length: nbJoursMois }, (_, i) => `<th>${i + 1}</th>`).join("");
    }

    if (tableBody) {
      tableBody.innerHTML = "";
    }

    // URL API
    const url = `/api/presences?groupe=${groupeId}&mois=${mois}&annee=${annee}&reunion_id=${reunionId}`;
    console.log("🌐 URL API:", url);

    fetchAvecAuth(url)
      .then(res => {
            if (!res.ok) {
                console.error("❌ Erreur HTTP:", res.status, res.statusText);
                throw new Error(`HTTP ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("📥 Données reçues:", data);
            const membres = data.membres || [];
            const presences = data.presences || [];

            if (membres.length === 0) {
                if (tableBody) {
                  tableBody.innerHTML = `<tr><td colspan="${nbJoursMois + 1}">Aucun membre trouvé pour ce groupe.</td></tr>`;
                }
                if (texteMensuel) {
                  texteMensuel.innerHTML = "<p>Aucun membre trouvé.</p>";
                }
                const resumeTableBody = document.querySelector("#resumeTable tbody");
                if (resumeTableBody) {
                  resumeTableBody.innerHTML = "";
                }
                return;
            }

            // Construire le tableau
            if (tableBody) {
              tableBody.innerHTML = membres.map(membre => {
                  const ligne = Array.from({ length: nbJoursMois }, (_, i) => {
                      const jour = i + 1;
                      const dateStr = `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
                    
                    // Commentaire ChargePresence
                      /*
                      // Vérifier si le membre est présent ce jour-là
                      const estPresent = presences.some(p => {
                          const datePres = p.date_presence.split('T')[0];
                          return parseInt(p.membre_id, 10) === membre.id && datePres === dateStr;
                      });
                    */


                    // NOUVEAU CODE (sans décalage) :
                    const estPresent = presences.some(p => {
                      // Extraire la date sans décalage de timezone
                      const datePres = p.date_presence.split('T')[0]; // Format YYYY-MM-DD
                      const jourPresence = extraireJourSansDecalage(p.date_presence);
                      
                      // Vérifier correspondance membre ET jour exact
                      return parseInt(p.membre_id, 10) === membre.id && 
                            datePres === dateStr && 
                            jourPresence === jour;
                    });





                      return `<td class="clickable-cell ${estPresent ? 'present' : ''}" data-membre-id="${membre.id}" data-date="${dateStr}">${estPresent ? '✔' : ''}</td>`;
                  }).join("");

                  return `<tr><td>${membre.nom}</td>${ligne}</tr>`;
              }).join("");
            }

            // Ajouter les événements de clic pour modifier les présences
            ajouterEvenementsClick(groupeId, reunionId);

            // Afficher les résumés
            afficherResumeMensuel(groupeId, mois, annee, reunionId);
            afficherResumeTableCorrigee(groupeId, reunionId, mois, annee);
        })
        .catch(err => {
            console.error("❌ Erreur lors du chargement:", err);
            if (texteMensuel) {
              texteMensuel.innerHTML = "<p>Erreur lors du chargement des présences.</p>";
            }
        });
  }




// 🧪 TESTS DE VALIDATION DES CORRECTIONS
console.log("🧪 Test corrections de date :");

// Test avec dates problématiques
const testDates = [
  "2024-02-04T00:00:00",  // 4 février
  "2024-02-04T23:59:59",  // 4 février tard le soir  
  "2024-02-05",           // 5 février
  "2024-01-31T22:00:00",  // 31 janvier
  "2024-12-25T12:00:00"   // 25 décembre
];

testDates.forEach(dateTest => {
  console.log(`📅 ${dateTest}:`);
  console.log(`  Mois: ${extraireMoisSansDecalage(dateTest)}`);
  console.log(`  Jour: ${extraireJourSansDecalage(dateTest)}`);
  
  // Comparaison avec l'ancienne méthode
  const oldMethod = new Date(dateTest).getMonth() + 1;
  const newMethod = extraireMoisSansDecalage(dateTest);
  
  if (oldMethod !== newMethod) {
    console.log(`  ⚠️ DÉCALAGE DÉTECTÉ: ${oldMethod} vs ${newMethod}`);
  } else {
    console.log(`  ✅ Pas de décalage`);
  }
});

// Test spécifique pour le 4 février
console.log("\n🎯 Test spécifique 4 février:");
const feb4 = "2024-02-04T00:00:00";
console.log(`Date: ${feb4}`);
console.log(`Mois extrait: ${extraireMoisSansDecalage(feb4)} (devrait être 2)`);
console.log(`Jour extrait: ${extraireJourSansDecalage(feb4)} (devrait être 4)`);



  function ajouterEvenementsClick(groupeId, reunionId) {
    if (!tableBody) {
      console.error("❌ tableBody n'existe pas, impossible d'ajouter les événements de clic");
      return;
    }

    tableBody.querySelectorAll("td[data-date]").forEach(cell => {
      cell.addEventListener("click", async () => {
        const date = cell.dataset.date;
        const membreId = parseInt(cell.dataset.membreId, 10);
        const estPresent = cell.classList.contains("present");

        console.log("👆 Clic sur cellule:", { date, membreId, reunionId, estPresent });

        const method = estPresent ? "DELETE" : "POST";
        const body = estPresent
          ? { membre_id: membreId, date_presence: date, reunion_id: reunionId }
          : [{ membre_id: membreId, date_presence: date, reunion_id: reunionId }];

        try {
          const response = await fetchAvecAuth("/api/presences", {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          if (!response.ok) throw new Error("Erreur lors de la mise à jour");

          // Mettre à jour l'affichage
          cell.classList.toggle("present");
          cell.textContent = estPresent ? "" : "✔";
          
          // Rafraîchir les résumés
          const mois = moisSelect?.value;
          const annee = anneeSelect?.value;
          if (mois && annee) {
            afficherResumeMensuel(groupeId, mois, annee, reunionId);
            afficherResumeTableCorrigee(groupeId, reunionId, mois, annee);
          }
        } catch (err) {
          console.error("❌ Erreur mise à jour présence:", err);
          alert("Erreur lors de la mise à jour de la présence");
        }
      });
    });
  }

  function afficherResumeTableCorrigee(groupeId, reunionId, mois, annee) {
    console.log("📊 Chargement tableau résumé CORRIGÉ:", { groupeId, reunionId, mois, annee });

    const url = `/api/presences?groupe=${groupeId}&mois=${mois}&annee=${annee}&reunion_id=${reunionId}`;
    
    fetchAvecAuth(url)
      .then(res => res.json())
      .then(data => {
        console.log("📈 Données reçues pour calcul:", data);

        const membres = data.membres || [];
        const presences = data.presences || [];

        const datesReunions = new Set();
        presences.forEach(presence => {
          const dateUniquement = presence.date_presence.split('T')[0];
          datesReunions.add(dateUniquement);
        });

        const nombreReunionsCeMois = datesReunions.size;
        console.log("🎯 Réunions réelles ce mois:", nombreReunionsCeMois, "Dates:", Array.from(datesReunions));

        const tbody = document.querySelector("#resumeTable tbody");
        if (tbody) {
          tbody.innerHTML = "";
          
          membres.forEach(membre => {
            const presencesMembre = presences.filter(p => 
              parseInt(p.membre_id, 10) === membre.id
            ).length;

            const taux = nombreReunionsCeMois > 0
              ? Math.round((presencesMembre / nombreReunionsCeMois) * 100)
              : 0;

            console.log(`👤 ${membre.nom}: ${presencesMembre}/${nombreReunionsCeMois} = ${taux}%`);

            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td>${membre.nom}</td>
              <td>${presencesMembre}</td>
              <td>${nombreReunionsCeMois}</td>
              <td>${taux}%</td>
            `;
            tbody.appendChild(tr);
          });
        }
      })
      .catch(err => {
        console.error("❌ Erreur chargement résumé tableau:", err);
      });
  }

  function afficherResumeMensuel(groupeId, mois, annee, reunionId) {
    const url = `/api/presences/resume?groupe=${groupeId}&mois=${mois}&annee=${annee}&reunion_id=${reunionId}`;
    
    fetchAvecAuth(url)
      .then(res => res.json())
      .then(data => {
        const texte = `
          ✅ <strong>Présents ce mois</strong> :
          <ul>${(data.presents || []).map(p => `<li>${p.nom}</li>`).join("")}</ul>
          ❌ <strong>Absents ce mois</strong> :
          <ul>${(data.absents || []).map(p => `<li>${p.nom}</li>`).join("")}</ul>
        `;
        if (texteMensuel) {
          texteMensuel.innerHTML = texte;
        }
      })
      .catch(err => {
        console.error("❌ Erreur résumé:", err);
        if (texteMensuel) {
          texteMensuel.innerHTML = "<p style='color:red'>Erreur de chargement du résumé.</p>";
        }
      });
  }

  // Event listeners pour les changements de sélection
  [moisSelect, anneeSelect, groupeSelect, reunionSelect].forEach(element => {
    if (element) {
      element.addEventListener("change", () => {
        // Si on change une sélection, revenir à la vue mensuelle par défaut
        afficherVueMensuelle();
        if (typeSelect) typeSelect.value = "";
        chargerPresence();
      });
    }
  });

  // Export CSV
  const btnExportCSV = document.getElementById("btnExportCSV");
  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", () => {
      const table = document.getElementById("presenceTable");
      if (!table) {
        alert("Tableau non trouvé pour l'export");
        return;
      }
      
      const rows = Array.from(table.rows);
      
      const csvContent = rows.map(row => {
        return Array.from(row.cells).map(cell => {
          return `"${cell.textContent.replace(/"/g, '""')}"`;
        }).join(",");
      }).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `presences_${groupeSelect?.value || 'groupe'}_${moisSelect?.value || 'mois'}_${anneeSelect?.value || 'annee'}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }





  // ===========================================
  // NOUVELLES FONCTIONNALITÉS - À AJOUTER À LA FIN DE VOTRE FICHIER JS
  // ===========================================

  // Variables pour les nouvelles rubriques
  let membresDataNouvelles = [];

  // Fonction pour récupérer les paramètres actuels
  function getCurrentParamsNouvelles() {
    const groupeSelect = document.getElementById('groupe');
    const reunionSelect = document.getElementById('reunion');
    const moisSelect = document.getElementById('mois');
    const anneeSelect = document.getElementById('annee');

    return {
      groupe: groupeSelect?.value || '',
      reunion: reunionSelect?.value || '',
      mois: moisSelect?.value || '',
      annee: anneeSelect?.value || ''
    };
  }

  // Charger les membres pour les formulaires
  function chargerMembresFormulaires() {
    const params = getCurrentParamsNouvelles();
    if (!params.groupe) return;

    fetch(`/api/membres?groupe_id=${params.groupe}`)
      .then(res => res.json())
      .then(membres => {
        membresDataNouvelles = membres;
        
        // Remplir les selects de membres
        ['absenceMembre', 'retardMembre', 'reactiviteMembre'].forEach(selectId => {
          const select = document.getElementById(selectId);
          if (select) {
            select.innerHTML = '<option value="">-- Choisir un membre --</option>';
            membres.forEach(membre => {
              select.innerHTML += `<option value="${membre.id}">${membre.nom}</option>`;
            });
          }
        });
      })
      .catch(err => console.error('Erreur chargement membres:', err));
  }

  // Fonction utilitaire pour afficher les messages
  function afficherMessage(containerId, message, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const className = type === 'success' ? 'success-message' : 'error-message';
    container.innerHTML = `<div class="${className}">${message}</div>`;
    
    setTimeout(() => {
      container.innerHTML = '';
    }, 5000);
  }

  // GESTION DES ABSENCES
  function toggleFormAbsence() {
    const form = document.getElementById('formAbsence');
    if (!form) return;
    
    const isVisible = form.style.display !== 'none';
    form.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      chargerMembresFormulaires();
      document.getElementById('absenceDate').value = new Date().toISOString().split('T')[0];
    }
  }

  function sauvegarderAbsence() {
    const params = getCurrentParamsNouvelles();
    const membreId = document.getElementById('absenceMembre').value;
    const date = document.getElementById('absenceDate').value;
    const motif = document.getElementById('absenceMotif').value;
    const justification = document.getElementById('absenceJustification').value;

    if (!membreId || !date) {
      afficherMessage('messageAbsence', 'Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const donnees = {
      membre_id: membreId,
      reunion_id: params.reunion || 1,
      date_absence: date,
      motif: motif,
      justification: justification
    };

    fetchAvecAuth('/api/absences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        afficherMessage('messageAbsence', 'Absence enregistrée avec succès', 'success');
        document.getElementById('formAbsence').style.display = 'none';
        resetFormAbsence();
        chargerAbsences();
      } else {
        afficherMessage('messageAbsence', 'Erreur lors de l\'enregistrement', 'error');
      }
    })
    .catch(err => {
      console.error('Erreur sauvegarde absence:', err);
      afficherMessage('messageAbsence', 'Erreur de connexion', 'error');
    });
  }

  function chargerAbsences() {
    const params = getCurrentParamsNouvelles();
    if (!params.groupe || !params.mois || !params.annee) return;

    const url = `/api/absences?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}&reunion_id=${params.reunion || ''}`;
    
    fetchAvecAuth(url)
      .then(res => res.json())

      .then(absences => {
        const liste = document.getElementById('listeAbsences');
        if (!liste) return;
        
        if (absences.length === 0) {
          liste.innerHTML = '<div class="empty-state">Aucune absence justifiée enregistrée</div>';
        } else {
          liste.innerHTML = absences.map(absence => `
            <div class="item-row">
              <div class="item-info">
                <div class="item-nom">${absence.membres?.nom || 'Inconnu'}</div>
                <div class="item-date">${new Date(absence.date_absence).toLocaleDateString('fr-FR')}</div>
                <div class="item-details">
                  <strong>Motif:</strong> ${absence.motif || 'Non précisé'}<br>
                  <small>${absence.justification || ''}</small>
                </div>
              </div>
              <button class="btn-delete" onclick="supprimerAbsence(${absence.id})">Suppr.</button>
            </div>
          `).join('');
        }

        // Mettre à jour les statistiques
        const statTotal = document.getElementById('statAbsencesTotal');
        const statJustifiees = document.getElementById('statAbsencesJustifiees');
        if (statTotal) statTotal.textContent = absences.length;
        if (statJustifiees) statJustifiees.textContent = absences.filter(a => a.justification).length;
      })
      .catch(err => console.error('Erreur chargement absences:', err));
  }

  function resetFormAbsence() {
    document.getElementById('absenceMembre').value = '';
    document.getElementById('absenceDate').value = '';
    document.getElementById('absenceMotif').value = '';
    document.getElementById('absenceJustification').value = '';
  }

  // GESTION DES RETARDS
  function toggleFormRetard() {
    const form = document.getElementById('formRetard');
    if (!form) return;
    
    const isVisible = form.style.display !== 'none';
    form.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      chargerMembresFormulaires();
      document.getElementById('retardDate').value = new Date().toISOString().split('T')[0];
    }
  }

  function sauvegarderRetard() {
    const params = getCurrentParamsNouvelles();
    const membreId = document.getElementById('retardMembre').value;
    const date = document.getElementById('retardDate').value;
    const duree = document.getElementById('retardDuree').value;
    const motif = document.getElementById('retardMotif').value;

    if (!membreId || !date) {
      afficherMessage('messageRetard', 'Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const donnees = {
      membre_id: membreId,
      reunion_id: params.reunion || 1,
      date_retard: date,
      duree_retard: duree || null,
      motif: motif
    };

    fetchAvecAuth('/api/retards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        afficherMessage('messageRetard', 'Retard enregistré avec succès', 'success');
        document.getElementById('formRetard').style.display = 'none';
        resetFormRetard();
        chargerRetards();
      } else {
        afficherMessage('messageRetard', 'Erreur lors de l\'enregistrement', 'error');
      }
    })
    .catch(err => {
      console.error('Erreur sauvegarde retard:', err);
      afficherMessage('messageRetard', 'Erreur de connexion', 'error');
    });
  }

  function chargerRetards() {
    const params = getCurrentParamsNouvelles();
    if (!params.groupe || !params.mois || !params.annee) return;

    const url = `/api/retards?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}&reunion_id=${params.reunion || ''}`;
    
    fetchAvecAuth(url)
      .then(res => res.json())
      .then(retards => {
        const liste = document.getElementById('listeRetards');
        if (!liste) return;
        
        if (retards.length === 0) {
          liste.innerHTML = '<div class="empty-state">Aucun retard enregistré</div>';
        } else {
          liste.innerHTML = retards.map(retard => `
            <div class="item-row">
              <div class="item-info">
                <div class="item-nom">${retard.membres?.nom || 'Inconnu'}</div>
                <div class="item-date">${new Date(retard.date_retard).toLocaleDateString('fr-FR')}</div>
                <div class="item-details">
                  <strong>${retard.duree_retard || '?'} min</strong> - ${retard.motif || 'Non précisé'}
                </div>
              </div>
              <button class="btn-delete" onclick="supprimerRetard(${retard.id})">Suppr.</button>
            </div>
          `).join('');
        }

        // Statistiques des retards
        const dureesMoyenne = retards.filter(r => r.duree_retard).reduce((acc, r) => acc + r.duree_retard, 0) / retards.filter(r => r.duree_retard).length || 0;
        
        const statTotal = document.getElementById('statRetardsTotal');
        const statMoyenne = document.getElementById('statRetardsMoyenne');
        if (statTotal) statTotal.textContent = retards.length;
        if (statMoyenne) statMoyenne.textContent = Math.round(dureesMoyenne);
      })
      .catch(err => console.error('Erreur chargement retards:', err));
  }

  function resetFormRetard() {
    document.getElementById('retardMembre').value = '';
    document.getElementById('retardDate').value = '';
    document.getElementById('retardDuree').value = '';
    document.getElementById('retardMotif').value = '';
  }

  // GESTION DE LA RÉACTIVITÉ WHATSAPP
  function toggleFormReactivite() {
    const form = document.getElementById('formReactivite');
    if (!form) return;
    
    const isVisible = form.style.display !== 'none';
    form.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      chargerMembresFormulaires();
      document.getElementById('reactiviteDate').value = new Date().toISOString().split('T')[0];
    }
  }

  function sauvegarderReactivite() {
    const params = getCurrentParamsNouvelles();
    const membreId = document.getElementById('reactiviteMembre').value;
    const date = document.getElementById('reactiviteDate').value;
    const type = document.getElementById('reactiviteType').value;
    const score = document.getElementById('reactiviteScore').value;
    const contenu = document.getElementById('reactiviteContenu').value;

    if (!membreId || !date || !type) {
      afficherMessage('messageReactivite', 'Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }

    const donnees = {
      membre_id: membreId,
      groupe_id: params.groupe,
      date_activite: date,
      type_activite: type,
      contenu: contenu,
      score_reactivite: parseInt(score)
    };

    fetchAvecAuth('/api/reactivite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        afficherMessage('messageReactivite', 'Activité enregistrée avec succès', 'success');
        document.getElementById('formReactivite').style.display = 'none';
        resetFormReactivite();
        chargerReactivite();
      } else {
        afficherMessage('messageReactivite', 'Erreur lors de l\'enregistrement', 'error');
      }
    })
    .catch(err => {
      console.error('Erreur sauvegarde réactivité:', err);
      afficherMessage('messageReactivite', 'Erreur de connexion', 'error');
    });
  }





  

/*

  function chargerReactivite() {
    const params = getCurrentParamsNouvelles();
    if (!params.groupe || !params.mois || !params.annee) return;

    const url = `/api/reactivite?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const activites = data.activites || [];
        const stats = data.statistiques || {};
        const liste = document.getElementById('listeReactivite');
        
        if (!liste) return;
        
        if (activites.length === 0) {
          liste.innerHTML = '<div class="empty-state">Aucune activité WhatsApp enregistrée</div>';
        } else {
          liste.innerHTML = activites.map(activite => `
            <div class="item-row">
              <div class="item-info">
                <div class="item-nom">${activite.membres?.nom || 'Inconnu'}</div>
                <div class="item-date">${new Date(activite.date_activite).toLocaleDateString('fr-FR')}</div>
                <div class="item-details">
                  <span class="type-badge">${activite.type_activite}</span>
                  Score: ${activite.score_reactivite}/5<br>
                  <small>${activite.contenu || ''}</small>
                </div>
              </div>
            </div>
          `).join('');
        }

        // Statistiques de réactivité
        const scoreMoyen = activites.reduce((acc, a) => acc + (a.score_reactivite || 0), 0) / activites.length || 0;
        
        const statTotal = document.getElementById('statReactiviteTotal');
        const statMembres = document.getElementById('statReactiviteMembres');
        const statScore = document.getElementById('statReactiviteScore');
        
        if (statTotal) statTotal.textContent = activites.length;
        if (statMembres) statMembres.textContent = Object.keys(stats).length;
        if (statScore) statScore.textContent = scoreMoyen.toFixed(1);
      })
      .catch(err => console.error('Erreur chargement réactivité:', err));
  }


  */





  // ===========================================
// MODIFICATIONS POUR LA RÉACTIVITÉ WHATSAPP AMÉLIORÉE
// Remplacez la fonction chargerReactivite() existante par celle-ci
// ===========================================

function chargerReactivite() {
  const params = getCurrentParamsNouvelles();
  if (!params.groupe || !params.mois || !params.annee) return;

  const url = `/api/reactivite?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}`;
  
  fetchAvecAuth(url)
    .then(res => res.json())
    .then(data => {
      const activites = data.activites || [];
      const stats = data.statistiques || {};
      const liste = document.getElementById('listeReactivite');
      
      if (!liste) return;
      
      // Récupérer tous les membres du groupe pour identifier les non-actifs
     fetchAvecAuth(`/api/membres?groupe_id=${params.groupe}`)
        .then(res => res.json())
        .then(tousMembres => {
          // Identifier les membres actifs et non-actifs
          const membresActifs = Object.keys(stats).map(id => parseInt(id));
          const membresNonActifs = tousMembres.filter(membre => !membresActifs.includes(membre.id));
          
          let contenuHTML = '';
          
          // Section des activités
          if (activites.length > 0) {
            contenuHTML += `
              <div style="margin-bottom: 20px;">
                <h4 style="color: #28a745; margin-bottom: 10px;">📱 Activités du mois</h4>
                ${activites.map(activite => `
                  <div class="item-row">
                    <div class="item-info">
                      <div class="item-nom">${activite.membres?.nom || 'Inconnu'}</div>
                      <div class="item-date">${new Date(activite.date_activite).toLocaleDateString('fr-FR')}</div>
                      <div class="item-details">
                        <span class="type-badge">${activite.type_activite}</span>
                        Score: ${activite.score_reactivite}/5<br>
                        <small>${activite.contenu || ''}</small>
                      </div>
                    </div>
                    <button class="btn-delete" onclick="supprimerActiviteWhatsApp(${activite.id})">Suppr.</button>
                  </div>
                `).join('')}
              </div>
            `;
          }
          
          // Section des membres non-actifs
          if (membresNonActifs.length > 0) {
            contenuHTML += `
              <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid rgba(220, 53, 69, 0.2);">
                <h4 style="color: #dc3545; margin-bottom: 10px;">😴 Membres non actifs ce mois</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                  ${membresNonActifs.map(membre => `
                    <div style="background: rgba(220, 53, 69, 0.1); padding: 8px 12px; border-radius: 6px; border-left: 3px solid #dc3545;">
                      <span style="font-weight: 600;">${membre.nom}</span>
                      <br><small style="color: #6c757d;">Aucune activité enregistrée</small>
                    </div>
                  `).join('')}
                </div>
                <div style="margin-top: 15px; padding: 10px; background: rgba(255, 193, 7, 0.1); border-radius: 6px; border-left: 3px solid #ffc107;">
                  <strong>💡 Suggestion:</strong> Encouragez ces membres à participer davantage aux échanges WhatsApp du groupe.
                </div>
              </div>
            `;
          }
          
          if (activites.length === 0 && membresNonActifs.length === 0) {
            liste.innerHTML = '<div class="empty-state">Aucune donnée disponible</div>';
          } else {
            liste.innerHTML = contenuHTML;
          }


          /*
          // Mettre à jour les statistiques
          const scoreMoyen = activites.reduce((acc, a) => acc + (a.score_reactivite || 0), 0) / activites.length || 0;
          
          const statTotal = document.getElementById('statReactiviteTotal');
          const statMembres = document.getElementById('statReactiviteMembres');
          const statScore = document.getElementById('statReactiviteScore');
          
          if (statTotal) statTotal.textContent = activites.length;
          if (statMembres) statMembres.textContent = `${Object.keys(stats).length}/${tousMembres.length}`;
          if (statScore) statScore.textContent = scoreMoyen.toFixed(1);

          */

          // Mettre à jour les statistiques complètes
          const scoreMoyen = activites.reduce((acc, a) => acc + (a.score_reactivite || 0), 0) / activites.length || 0;
          
          const statTotal = document.getElementById('statReactiviteTotal');
          const statMembres = document.getElementById('statReactiviteMembres');
          const statScore = document.getElementById('statReactiviteScore');
          const statPasActifs = document.getElementById('statMembresPasActifs');
          
          if (statTotal) statTotal.textContent = activites.length;
          if (statMembres) statMembres.textContent = `${Object.keys(stats).length}/${tousMembres.length}`;
          if (statScore) statScore.textContent = scoreMoyen.toFixed(1);
          if (statPasActifs) statPasActifs.textContent = membresNonActifs.length;

        })
        .catch(err => console.error('Erreur chargement membres:', err));
    })
    .catch(err => console.error('Erreur chargement réactivité:', err));
}

// Fonction pour supprimer une activité WhatsApp
window.supprimerActiviteWhatsApp = function(id) {
  if (!confirm('Supprimer cette activité WhatsApp ?')) return;
  
  fetchAvecAuth(`/api/reactivite/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        afficherMessage('messageReactivite', 'Activité supprimée', 'success');
        chargerReactivite();

        //chargerResumeEtendu(); // Mettre à jour le résumé global
        
      } else {
        afficherMessage('messageReactivite', 'Erreur lors de la suppression', 'error');
      }
    })
    .catch(err => {
      console.error('Erreur suppression activité:', err);
      afficherMessage('messageReactivite', 'Erreur de connexion', 'error');
    });
};


  function resetFormReactivite() {
    document.getElementById('reactiviteMembre').value = '';
    document.getElementById('reactiviteDate').value = '';
    document.getElementById('reactiviteType').value = '';
    document.getElementById('reactiviteScore').value = '3';
    document.getElementById('reactiviteContenu').value = '';
  }






  // RÉSUMÉ ÉTENDU
  function chargerResumeEtendu() {
    const params = getCurrentParamsNouvelles();
    if (!params.groupe || !params.mois || !params.annee) return;

    const url = `/api/resume-etendu?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}&reunion_id=${params.reunion || ''}`;
    
    fetchAvecAuth(url)
      .then(res => res.json())
      .then(data => {
        const resume = data.resume_global || {};
        
        const resumePresences = document.getElementById('resumePresences');
        const resumeAbsences = document.getElementById('resumeAbsences');
        const resumeRetards = document.getElementById('resumeRetards');
        const resumeReactivite = document.getElementById('resumeReactivite');
        
        if (resumePresences) resumePresences.textContent = resume.total_presences || 0;
        if (resumeAbsences) resumeAbsences.textContent = resume.total_absences_justifiees || 0;
        if (resumeRetards) resumeRetards.textContent = resume.total_retards || 0;
        if (resumeReactivite) resumeReactivite.textContent = resume.membres_actifs_whatsapp || 0;
        
        const details = document.getElementById('resumeDetails');
        if (details) {
          const totalMembres = resume.total_presences + resume.total_absences_justifiees || 1;
          const tauxPresence = Math.round((resume.total_presences / totalMembres) * 100);
          
          details.innerHTML = `
            <h4 style="margin-bottom: 15px; color: #2c3e50;">Analyse du mois</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              <div>
                <strong>Taux de présence:</strong><br>
                <span style="font-size: 1.2em; color: ${tauxPresence >= 80 ? '#28a745' : tauxPresence >= 60 ? '#ffc107' : '#dc3545'};">
                  ${tauxPresence}%
                </span>
              </div>
              <div>
                <strong>Engagement WhatsApp:</strong><br>
                <span style="font-size: 1.2em; color: #17a2b8;">
                  ${resume.membres_actifs_whatsapp} membres actifs
                </span>
              </div>
              <div>
                <strong>Ponctualité:</strong><br>
                <span style="font-size: 1.2em; color: ${resume.total_retards <= 2 ? '#28a745' : '#dc3545'};">
                  ${resume.total_retards} retard${resume.total_retards > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          `;
        }
      })
      .catch(err => console.error('Erreur résumé étendu:', err));
  }

  // FONCTIONS GLOBALES POUR LES SUPPRESSIONS
  window.supprimerAbsence = function(id) {
    if (!confirm('Supprimer cette absence ?')) return;

    fetchAvecAuth(`/api/absences/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          afficherMessage('messageAbsence', 'Absence supprimée', 'success');
          chargerAbsences();
        }
      })
      .catch(err => console.error('Erreur suppression:', err));
  };

  window.supprimerRetard = function(id) {
    if (!confirm('Supprimer ce retard ?')) return;
    
    fetchAvecAuth(`/api/retards/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          afficherMessage('messageRetard', 'Retard supprimé', 'success');
          chargerRetards();
        }
      })
      .catch(err => console.error('Erreur suppression:', err));
  };

  // EVENT LISTENERS POUR LES NOUVELLES RUBRIQUES
  setTimeout(() => {
    // Boutons d'ajout
    const btnAddAbsence = document.getElementById('btnAddAbsence');
    const btnAddRetard = document.getElementById('btnAddRetard');
    const btnAddReactivite = document.getElementById('btnAddReactivite');
    
    if (btnAddAbsence) btnAddAbsence.addEventListener('click', toggleFormAbsence);
    if (btnAddRetard) btnAddRetard.addEventListener('click', toggleFormRetard);
    if (btnAddReactivite) btnAddReactivite.addEventListener('click', toggleFormReactivite);

    // Boutons de sauvegarde
    const btnSaveAbsence = document.getElementById('btnSaveAbsence');
    const btnSaveRetard = document.getElementById('btnSaveRetard');
    const btnSaveReactivite = document.getElementById('btnSaveReactivite');
    
    if (btnSaveAbsence) btnSaveAbsence.addEventListener('click', sauvegarderAbsence);
    if (btnSaveRetard) btnSaveRetard.addEventListener('click', sauvegarderRetard);
    if (btnSaveReactivite) btnSaveReactivite.addEventListener('click', sauvegarderReactivite);

    // Boutons d'annulation
    const btnCancelAbsence = document.getElementById('btnCancelAbsence');
    const btnCancelRetard = document.getElementById('btnCancelRetard');
    const btnCancelReactivite = document.getElementById('btnCancelReactivite');
    
    if (btnCancelAbsence) {
      btnCancelAbsence.addEventListener('click', () => {
        document.getElementById('formAbsence').style.display = 'none';
        resetFormAbsence();
      });
    }
    if (btnCancelRetard) {
      btnCancelRetard.addEventListener('click', () => {
        document.getElementById('formRetard').style.display = 'none';
        resetFormRetard();
      });
    }
    if (btnCancelReactivite) {
      btnCancelReactivite.addEventListener('click', () => {
        document.getElementById('formReactivite').style.display = 'none';
        resetFormReactivite();
      });
    }

    // Bouton refresh résumé
    const btnRefreshResume = document.getElementById('btnRefreshResume');
    if (btnRefreshResume) {
      btnRefreshResume.addEventListener('click', chargerResumeEtendu);
    }

    // Observer les changements de paramètres
    ['groupe', 'mois', 'annee', 'reunion'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => {
          setTimeout(() => {
            chargerAbsences();
            chargerRetards();
            chargerReactivite();
            chargerResumeEtendu();
          }, 100);
        });
      }
    });

    // Chargement initial des nouvelles données
    setTimeout(() => {
      chargerAbsences();
      chargerRetards();
      chargerReactivite();
      chargerResumeEtendu();
    }, 1000);

  }, 500);



// ===========================================
  // GESTION DES GRAPHIQUES ET EXPORTS
  // ===========================================

  let chartsInstances = {
    presences: null,
    engagement: null,
    reactivite: null
  };

  let donneesExport = {
    presences: 0,
    absences: 0,
    retards: 0,
    reactiviteWhatsApp: 0,
    membresActifs: 0,
    membresTotaux: 0,
    detailsReactivite: []
  };

  function creerGraphiquePresences(presences, absences, retards) {
    const ctx = document.getElementById('chartPresences');
    if (!ctx) return;

    if (chartsInstances.presences) {
      chartsInstances.presences.destroy();
    }

    chartsInstances.presences = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Présents', 'Absences justifiées', 'Retards'],
        datasets: [{
          data: [presences, absences, retards],
          backgroundColor: [
            'rgba(40, 167, 69, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(220, 53, 69, 0.8)'
          ],
          borderColor: [
            'rgba(40, 167, 69, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(220, 53, 69, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  function creerGraphiqueEngagement(membresActifs, membresTotaux, scoreWhatsApp) {
    const ctx = document.getElementById('chartEngagement');
    if (!ctx) return;

    if (chartsInstances.engagement) {
      chartsInstances.engagement.destroy();
    }

    const tauxPresence = membresTotaux > 0 ? (membresActifs / membresTotaux * 100).toFixed(1) : 0;

    chartsInstances.engagement = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Taux de présence', 'Score WhatsApp'],
        datasets: [{
          label: 'Pourcentage',
          data: [tauxPresence, scoreWhatsApp],
          backgroundColor: [
            'rgba(102, 126, 234, 0.8)',
            'rgba(23, 162, 184, 0.8)'
          ],
          borderColor: [
            'rgba(102, 126, 234, 1)',
            'rgba(23, 162, 184, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  function creerGraphiqueReactivite(detailsReactivite) {
    const ctx = document.getElementById('chartReactivite');
    if (!ctx) return;

    if (chartsInstances.reactivite) {
      chartsInstances.reactivite.destroy();
    }

    const noms = detailsReactivite.map(d => d.nom);
    const scores = detailsReactivite.map(d => d.score_total || 0);
    const activites = detailsReactivite.map(d => d.total_activites || 0);

    chartsInstances.reactivite = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: noms,
        datasets: [
          {
            label: 'Score total',
            data: scores,
            backgroundColor: 'rgba(40, 167, 69, 0.6)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: "Nombre d'activités",
            data: activites,
            backgroundColor: 'rgba(23, 162, 184, 0.6)',
            borderColor: 'rgba(23, 162, 184, 1)',
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Score total'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: "Nombre d'activités"
            },
            grid: {
              drawOnChartArea: false,
            }
          }
        }
      }
    });
  }

  function genererAnalyseTextuelle(resume, membresActifs, membresTotaux) {
    const analyseDiv = document.getElementById('analyseTextuelle');
    if (!analyseDiv) return;

    const totalMembres = resume.total_presences + resume.total_absences_justifiees || 1;
    const tauxPresence = Math.round((resume.total_presences / totalMembres) * 100);
    const tauxEngagement = membresTotaux > 0 ? Math.round((membresActifs / membresTotaux) * 100) : 0;

    let analyse = '<h4 style="margin-bottom: 15px; color: #2c3e50;">📊 Analyse du mois</h4>';
    analyse += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">';

    const couleurPresence = tauxPresence >= 80 ? '#28a745' : tauxPresence >= 60 ? '#ffc107' : '#dc3545';
    analyse += `
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${couleurPresence};">
        <strong style="color: ${couleurPresence};">Taux de présence: ${tauxPresence}%</strong><br>
        <small>${tauxPresence >= 80 ? '✅ Excellent' : tauxPresence >= 60 ? '⚠️ Acceptable' : '❌ À améliorer'}</small>
      </div>
    `;

    const couleurRetards = resume.total_retards <= 2 ? '#28a745' : '#dc3545';
    analyse += `
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${couleurRetards};">
        <strong style="color: ${couleurRetards};">Ponctualité: ${resume.total_retards} retard(s)</strong><br>
        <small>${resume.total_retards <= 2 ? '✅ Très bien' : '⚠️ À surveiller'}</small>
      </div>
    `;

    const couleurWhatsApp = tauxEngagement >= 70 ? '#28a745' : tauxEngagement >= 40 ? '#ffc107' : '#dc3545';
    analyse += `
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid ${couleurWhatsApp};">
        <strong style="color: ${couleurWhatsApp};">Engagement WhatsApp: ${tauxEngagement}%</strong><br>
        <small>${membresActifs}/${membresTotaux} membres actifs</small>
      </div>
    `;

    analyse += `
      <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8;">
        <strong style="color: #17a2b8;">Absences justifiées: ${resume.total_absences_justifiees}</strong><br>
        <small>${resume.total_absences_justifiees === 0 ? '✅ Aucune' : '📋 Suivies'}</small>
      </div>
    `;

    analyse += '</div>';
    analyseDiv.innerHTML = analyse;
  }

  // REMPLACER chargerResumeEtendu par cette version
  function chargerResumeEtendu() {
    const params = getCurrentParamsNouvelles();
    if (!params.groupe || !params.mois || !params.annee) return;

    const url = `/api/resume-etendu?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}&reunion_id=${params.reunion || ''}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        const resume = data.resume_global || {};
        
        const resumePresences = document.getElementById('resumePresences');
        const resumeAbsences = document.getElementById('resumeAbsences');
        const resumeRetards = document.getElementById('resumeRetards');
        const resumeReactivite = document.getElementById('resumeReactivite');
        
        if (resumePresences) resumePresences.textContent = resume.total_presences || 0;
        if (resumeAbsences) resumeAbsences.textContent = resume.total_absences_justifiees || 0;
        if (resumeRetards) resumeRetards.textContent = resume.total_retards || 0;
        if (resumeReactivite) resumeReactivite.textContent = resume.membres_actifs_whatsapp || 0;

        donneesExport = {
          presences: resume.total_presences || 0,
          absences: resume.total_absences_justifiees || 0,
          retards: resume.total_retards || 0,
          reactiviteWhatsApp: resume.membres_actifs_whatsapp || 0,
          periode: `${params.mois}/${params.annee}`,
          groupe: params.groupe
        };

        fetch(`/api/reactivite?groupe=${params.groupe}&mois=${params.mois}&annee=${params.annee}`)
          .then(res => res.json())
          .then(reactiviteData => {
            const stats = reactiviteData.statistiques || {};
            const detailsReactivite = Object.values(stats);
            donneesExport.detailsReactivite = detailsReactivite;

            fetch(`/api/membres?groupe_id=${params.groupe}`)
              .then(res => res.json())
              .then(membres => {
                const membresTotaux = membres.length;
                const membresActifs = Object.keys(stats).length;
                
                donneesExport.membresActifs = membresActifs;
                donneesExport.membresTotaux = membresTotaux;

                const scoreWhatsAppMoyen = membresTotaux > 0 ? (membresActifs / membresTotaux * 100).toFixed(1) : 0;

                creerGraphiquePresences(
                  resume.total_presences || 0,
                  resume.total_absences_justifiees || 0,
                  resume.total_retards || 0
                );

                creerGraphiqueEngagement(
                  membresActifs,
                  membresTotaux,
                  parseFloat(scoreWhatsAppMoyen)
                );

                creerGraphiqueReactivite(detailsReactivite);
                genererAnalyseTextuelle(resume, membresActifs, membresTotaux);
              });
          });
      })
      .catch(err => console.error('Erreur résumé étendu:', err));
  }

  async function exporterPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(102, 126, 234);
    doc.text('Rapport de Présences', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Période: ${donneesExport.periode}`, 105, 30, { align: 'center' });
    
    let y = 50;
    doc.setFontSize(14);
    doc.text('📊 Statistiques globales', 20, y);
    
    y += 10;
    doc.setFontSize(11);
    doc.text(`• Présences: ${donneesExport.presences}`, 30, y);
    y += 7;
    doc.text(`• Absences justifiées: ${donneesExport.absences}`, 30, y);
    y += 7;
    doc.text(`• Retards: ${donneesExport.retards}`, 30, y);
    y += 7;
    doc.text(`• Membres actifs WhatsApp: ${donneesExport.membresActifs}/${donneesExport.membresTotaux}`, 30, y);
    
    if (donneesExport.detailsReactivite && donneesExport.detailsReactivite.length > 0) {
      y += 15;
      doc.setFontSize(14);
      doc.text('💬 Réactivité WhatsApp', 20, y);
      
      y += 10;
      doc.setFontSize(10);
      donneesExport.detailsReactivite.forEach(membre => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`• ${membre.nom}: ${membre.total_activites} activités (Score: ${membre.score_total})`, 30, y);
        y += 6;
      });
    }
    
    const canvas1 = document.getElementById('chartPresences');
    const canvas2 = document.getElementById('chartEngagement');
    
    if (canvas1 && canvas2) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('📈 Graphiques', 105, 20, { align: 'center' });
      
      const img1 = canvas1.toDataURL('image/png');
      const img2 = canvas2.toDataURL('image/png');
      
      doc.addImage(img1, 'PNG', 15, 30, 85, 65);
      doc.addImage(img2, 'PNG', 110, 30, 85, 65);
    }
    
    doc.save(`rapport_${donneesExport.periode.replace('/', '-')}.pdf`);
  }

  function exporterExcel() {
    let csv = 'Rapport de Présences\n\n';
    csv += `Période,${donneesExport.periode}\n\n`;
    
    csv += 'Statistiques Globales\n';
    csv += 'Indicateur,Valeur\n';
    csv += `Présences,${donneesExport.presences}\n`;
    csv += `Absences justifiées,${donneesExport.absences}\n`;
    csv += `Retards,${donneesExport.retards}\n`;
    csv += `Membres actifs WhatsApp,${donneesExport.membresActifs}/${donneesExport.membresTotaux}\n\n`;
    
    if (donneesExport.detailsReactivite && donneesExport.detailsReactivite.length > 0) {
      csv += 'Réactivité WhatsApp Détaillée\n';
      csv += 'Membre,Nombre d\'activités,Score total\n';
      donneesExport.detailsReactivite.forEach(membre => {
        csv += `"${membre.nom}",${membre.total_activites},${membre.score_total}\n`;
      });
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport_${donneesExport.periode.replace('/', '-')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exporterGraphiques() {
    const canvases = [
      { canvas: document.getElementById('chartPresences'), nom: 'repartition_presences' },
      { canvas: document.getElementById('chartEngagement'), nom: 'engagement_groupe' },
      { canvas: document.getElementById('chartReactivite'), nom: 'reactivite_whatsapp' }
    ];
    
    for (const item of canvases) {
      if (item.canvas) {
        const url = item.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${item.nom}_${donneesExport.periode.replace('/', '-')}.png`;
        link.href = url;
        link.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  // Event listeners pour exports
  setTimeout(() => {
    const btnPDF = document.getElementById('btnExportPDF');
    const btnExcel = document.getElementById('btnExportExcel');
    const btnGraphiques = document.getElementById('btnExportGraphiques');
    
    if (btnPDF) btnPDF.addEventListener('click', exporterPDF);
    if (btnExcel) btnExcel.addEventListener('click', exporterExcel);
    if (btnGraphiques) btnGraphiques.addEventListener('click', exporterGraphiques);
  }, 1000);
            


});

