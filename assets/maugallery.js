(function($) {
  // Définition du plugin jQuery 'mauGallery'
  $.fn.mauGallery = function(options) {
    // Normalisation des options en combinant les options par défaut avec celles fournies
    const normalizedOptions = $.extend({}, $.fn.mauGallery.defaults, options);
    let tagsCollection = []; // Collection pour stocker les tags uniques

    return this.each(function() {
      const $this = $(this);
      // Création de la structure de la galerie si elle n'existe pas encore
      $.fn.mauGallery.methods.createRowWrapper($this);

      // Création de la lightbox si l'option est activée
      if (normalizedOptions.lightBox) {
        $.fn.mauGallery.methods.createLightBox($this, normalizedOptions.lightboxId, normalizedOptions.navigation);
      }

      // Ajout des écouteurs d'événements
      $.fn.mauGallery.listeners(normalizedOptions);

      // Traitement de chaque élément de la galerie
      $this.children(".gallery-item").each(function(index) {
        const $item = $(this);
        $.fn.mauGallery.methods.responsiveImageItem($item);
        $.fn.mauGallery.methods.moveItemInRowWrapper($item);
        $.fn.mauGallery.methods.wrapItemInColumn($item, normalizedOptions.columns);

        // Récupération des tags uniques
        const theTag = $item.data("gallery-tag");
        if (normalizedOptions.showTags && theTag && !tagsCollection.includes(theTag)) {
          tagsCollection.push(theTag);
        }
      });

      // Affichage des tags si l'option est activée
      if (normalizedOptions.showTags) {
        $.fn.mauGallery.methods.showItemTags($this, normalizedOptions.tagsPosition, tagsCollection);
      }

      // Affichage de la galerie avec un effet de fondu
      $this.fadeIn(500);

      // Assurer que le bouton "Tous" est actif par défaut au chargement de la page
      $(".nav-link[data-images-toggle='all']").addClass("active-tag");
    });
  };

  // Options par défaut du plugin
  $.fn.mauGallery.defaults = {
    columns: 3, // Nombre de colonnes dans la galerie
    lightBox: true, // Activation de la lightbox
    lightboxId: null, // ID de la lightbox, si spécifique
    showTags: true, // Affichage des tags
    tagsPosition: "bottom", // Position des tags (haut ou bas)
    navigation: true // Activation de la navigation dans la lightbox
  };

  // Définition des écouteurs d'événements
  $.fn.mauGallery.listeners = function(options) {
    // Écouteur de clic sur les éléments de la galerie pour ouvrir la lightbox
    $(".gallery").on("click", ".gallery-item", function() {
      const $this = $(this);
      if (options.lightBox && $this.prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($this, options.lightboxId);
      }
    });

    // Écouteur de clic sur les liens de filtre pour filtrer les images
    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);

    // Écouteurs de clic pour la navigation dans la lightbox
    $(".gallery").on("click", ".mg-prev", () => $.fn.mauGallery.methods.prevImage());
    $(".gallery").on("click", ".mg-next", () => $.fn.mauGallery.methods.nextImage());
  };

  // Fonction pour naviguer entre les images dans la lightbox
  function navigateImage(direction) {
    const $lightboxImage = $(".lightboxImage"); //selectionne l'image actuelle de la lightbox
    const activeImageSrc = $lightboxImage.attr("src");// récupère l'URL (source) de l'image actuellement affichée dans la lightbox.

    // Récupération des URL des images dans la galerie avec la classe gallery-item
    const imagesCollection = $("img.gallery-item").map(function() { //utilise la méthode .map() de jQuery pour créer un tableau des URLs des images.
      return $(this).attr("src"); 
    }).get(); // convertit l'objet jQuery en un tableau JavaScript normal.

    const currentIndex = imagesCollection.indexOf(activeImageSrc); //trouve l'index de l'image actuellement affichée dans le tableau imagesCollection

    if (currentIndex === -1) { // Si l'index de l'image n'est pas trouvé dans le tableau, affiche message d'erreur
      console.error("Image active non trouvée dans la collection.");
      return;
    }

    let newIndex = currentIndex; //  initialise newIndex avec la valeur de currentIndex.

    // Détermination de l'index de la nouvelle image
    if (direction === 'next') {
      //newIndex est mis à jour permet de passer à l'image suivante et de revenir au début de la collection lorsqu'on atteint la fin.
      newIndex = (currentIndex + 1) % imagesCollection.length; 
    } else if (direction === 'prev') {
      //newIndex est mis à jour permet de passer à l'image précédente et de revenir à la fin de la collection lorsqu'on atteint le début.
      newIndex = (currentIndex - 1 + imagesCollection.length) % imagesCollection.length;
    }

    // met à jour l'URL de l'image affichée dans la lightbox avec celle de la nouvelle image déterminée par newIndex
    $lightboxImage.attr("src", imagesCollection[newIndex]);
  }

  // Méthodes du plugin
  $.fn.mauGallery.methods = {
    // Création d'un conteneur de lignes si nécessaire
    createRowWrapper(element) {
      if (!element.children().first().hasClass("row")) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },
    // Enveloppement des éléments de galerie dans des colonnes
    wrapItemInColumn(element, columns) {
      let columnClasses = "";

      if (typeof columns === "number") {
        columnClasses = `col-${Math.ceil(12 / columns)}`;
      } else if (typeof columns === "object") {
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
      } else {
        console.error(`Columns should be defined as numbers or objects. ${typeof columns} is not supported.`);
        return;
      }

      element.wrap(`<div class='item-column mb-4 ${columnClasses}'></div>`);
    },
    // Déplacement des éléments dans le conteneur de lignes
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },
    // Ajout de la classe responsive aux images
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    // Ouverture de la lightbox avec l'image cliquée
    openLightBox(element, lightboxId) {
      const $lightbox = $(`#${lightboxId ? lightboxId : "galleryLightbox"}`);
      $lightbox.find(".lightboxImage").attr("src", element.attr("src"));
      $lightbox.modal("toggle");
    },
    // Navigation vers l'image précédente
    prevImage() {
      navigateImage('prev');
    },
    // Navigation vers l'image suivante
    nextImage() {
      navigateImage('next');
    },
    // Création de la structure de la lightbox
    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`
        <div class="modal fade" id="${lightboxId ? lightboxId : "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body">
                ${navigation ? '<div class="mg-prev"></div>' : ''}
                <img class="lightboxImage img-fluid" alt="Contenu de l'image affichée dans la modale au clique">
                ${navigation ? '<div class="mg-next"></div>' : ''}
              </div>
            </div>
          </div>
        </div>`);
    },
    // Affichage des tags pour filtrer les images
    showItemTags(gallery, position, tags) {
      let tagItems = '<li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all">Tous</span></li>';
      
      tags.forEach((value) => {
        tagItems += `<li class="nav-item"><span class="nav-link" data-images-toggle="${value}">${value}</span></li>`;
      });

      const tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
      
      // Assurer que le bouton "Tous" est actif par défaut au chargement de la page
      $(".nav-link[data-images-toggle='all']").addClass("active-tag");
    },
    // Filtrage des images en fonction du tag sélectionné
    filterByTag() {
      if ($(this).hasClass("active-tag")) { // Vérifie si le tag est déjà actif
        return; // Si oui, ne fait rien et quitte la fonction
      }
       // Supprime la classe 'active-tag' du bouton actuellement actif
      $(".active-tag").removeClass("active active-tag");

      // Ajoute la classe 'active-tag' au bouton cliqué
      $(this).addClass("active-tag");

       // Récupère la valeur du data attribute 'images-toggle' du bouton cliqué
      const tag = $(this).data("images-toggle");

       // Parcourt chaque élément de la galerie
      $(".gallery-item").each(function() {
         // Récupère le parent de l'élément avec la classe 'item-column'
        const parentColumn = $(this).parents(".item-column");
          // Masque l'élément parent
        parentColumn.hide();

        // Vérifie si le tag est 'all' ou si l'élément a le même tag que celui cliqué puis affiche le parent si le tag correspond
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          // affiche le parent de l'élément avec un effet de transition de 300ms
          parentColumn.show(300);
        }
      });
    }
  };
})(jQuery);

// Assurer que le bouton "Tous" est actif par défaut au chargement de la page
$(document).ready(function() {
  $(".nav-link[data-images-toggle='all']").addClass("active-tag");
});
