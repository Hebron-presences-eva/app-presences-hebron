
console.log("JS chargé !");

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
  fetch("/api/groupes")
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

    fetch(url)
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

    fetch(url)
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
          const response = await fetch("/api/presences", {
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
    
    fetch(url)
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
    
    fetch(url)
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
});

