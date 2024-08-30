(function($) {
  $.fn.mauGallery = function(options) {
    var options = $.extend($.fn.mauGallery.defaults, options);
    var tagsCollection = [];
    return this.each(function() {
      $.fn.mauGallery.methods.createRowWrapper($(this));
      if (options.lightBox) {
        $.fn.mauGallery.methods.createLightBox(
          $(this),
          options.lightboxId,
          options.navigation
        );
      }
      $.fn.mauGallery.listeners(options);

      $(this)
        .children(".gallery-item")
        .each(function(index) {
          $.fn.mauGallery.methods.responsiveImageItem($(this));
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this));
          $.fn.mauGallery.methods.wrapItemInColumn($(this), options.columns);
          var theTag = $(this).data("gallery-tag");
          if (
            options.showTags &&
            theTag !== undefined &&
            tagsCollection.indexOf(theTag) === -1
          ) {
            tagsCollection.push(theTag);
          }
        });

      if (options.showTags) {
        $.fn.mauGallery.methods.showItemTags(
          $(this),
          options.tagsPosition,
          tagsCollection
        );
      }

      $(this).fadeIn(500);
    });
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  $.fn.mauGallery.listeners = function(options) {
    $(".gallery-item").on("click", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId);
      } else {
        return;
      }
    });

    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage()
    );
    $(".gallery").on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage()
    );
  };

  // Fonction principale de navigation d'images dans la lightbox
  function navigateImage(direction) {
    // Récupère l'URL de l'image actuellement affichée
    let activeImageSrc = $(".lightboxImage").attr("src");
    console.log("Image active src:", activeImageSrc);

    // Filtre pour trouver l'image actuellement affichée dans la lightbox
    let activeImage = $("img.gallery-item").filter(function() {
      return $(this).attr("src") === activeImageSrc;
    });

    if (activeImage.length === 0) {
      console.error("Image active non trouvée.");
      return;
    }

    // Récupère le tag actif pour filtrer les images
    let activeTag = $(".tags-bar span.active-tag").data("images-toggle");
    console.log("Tag actif:", activeTag);

    let imagesCollection = [];
    $(".item-column").each(function() {
      let img = $(this).children("img");
      if (activeTag === "all" || img.data("gallery-tag") === activeTag) {
        imagesCollection.push(img);
      }
    });

    console.log("Images dans la collection:", imagesCollection.map(img => img.attr("src")));

    if (imagesCollection.length === 0) {
      console.error("Aucune image trouvée dans la collection.");
      return;
    }

    // Trouve l'index de l'image active dans la collection d'images
    let index = imagesCollection.findIndex(img => img.attr("src") === activeImageSrc);
    console.log("Index de l'image active:", index);

    if (index === -1) {
      console.error("Index de l'image active non trouvé dans la collection.");
      return;
    }

    // Détermine l'image suivante ou précédente en fonction de la direction
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (index + 1) % imagesCollection.length;
    } else {
      nextIndex = (index - 1 + imagesCollection.length) % imagesCollection.length;
    }

    console.log("Index de l'image suivante:", nextIndex);
    $(".lightboxImage").attr("src", imagesCollection[nextIndex].attr("src"));
  }

  $.fn.mauGallery.methods = {
    createRowWrapper(element) {
      if (
        !element
          .children()
          .first()
          .hasClass("row")
      ) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },
    wrapItemInColumn(element, columns) {
      if (columns.constructor === Number) {
        element.wrap(
          `<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`
        );
      } else if (columns.constructor === Object) {
        var columnClasses = "";
        if (columns.xs) {
          columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        }
        if (columns.sm) {
          columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        }
        if (columns.md) {
          columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        }
        if (columns.lg) {
          columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        }
        if (columns.xl) {
          columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        }
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(
          `Columns should be defined as numbers or objects. ${typeof columns} is not supported.`
        );
      }
    },
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },
    prevImage() {
      navigateImage('prev');
    },
    nextImage() {
      navigateImage('next');
    },
    createLightBox(gallery, lightboxId, navigation) {
      gallery.append(`<div class="modal fade" id="${
        lightboxId ? lightboxId : "galleryLightbox"
      }" tabindex="-1" role="dialog" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-body">
                        ${
                          navigation
                            ? '<div class="mg-prev"></div>'
                            : '<span class="hidden-element;"></span>'
                        }
                        <img class="lightboxImage img-fluid" alt="Contenu de l\'image affichée dans la modale au clique">
                        ${
                          navigation
                            ? '<div class="mg-next"></div>'
                            : '<span style="display:none;" />'
                        }
                    </div>
                </div>
            </div>
        </div>`);
    },
    showItemTags(gallery, position, tags) {
      var tagItems =
        '<li class="nav-item"><span class="nav-link active active-tag"  data-images-toggle="all">Tous</span></li>';
      $.each(tags, function(index, value) {
        tagItems += `<li class="nav-item active">
                <span class="nav-link"  data-images-toggle="${value}">${value}</span></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        gallery.append(tagsRow);
      } else if (position === "top") {
        gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },
    filterByTag() {
      if ($(this).hasClass("active-tag")) {
        return;
      }
      $(".active-tag").removeClass("active active-tag");
      $(this).addClass("active-tag");

      var tag = $(this).data("images-toggle");

      $(".gallery-item").each(function() {
        $(this)
          .parents(".item-column")
          .hide();
        if (tag === "all") {
          $(this)
            .parents(".item-column")
            .show(300);
        } else if ($(this).data("gallery-tag") === tag) {
          $(this)
            .parents(".item-column")
            .show(300);
        }
      });
    }
  };
})(jQuery);
