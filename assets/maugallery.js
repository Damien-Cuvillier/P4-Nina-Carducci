(function($) {
  $.fn.mauGallery = function(options) {
    const normalizedOptions = $.extend({}, $.fn.mauGallery.defaults, options);
    let tagsCollection = [];

    return this.each(function() {
      const $this = $(this);
      $.fn.mauGallery.methods.createRowWrapper($this);

      if (normalizedOptions.lightBox) {
        $.fn.mauGallery.methods.createLightBox($this, normalizedOptions.lightboxId, normalizedOptions.navigation);
      }

      $.fn.mauGallery.listeners(normalizedOptions);

      $this.children(".gallery-item").each(function(index) {
        const $item = $(this);
        $.fn.mauGallery.methods.responsiveImageItem($item);
        $.fn.mauGallery.methods.moveItemInRowWrapper($item);
        $.fn.mauGallery.methods.wrapItemInColumn($item, normalizedOptions.columns);

        const theTag = $item.data("gallery-tag");
        if (normalizedOptions.showTags && theTag && !tagsCollection.includes(theTag)) {
          tagsCollection.push(theTag);
        }
      });

      if (normalizedOptions.showTags) {
        $.fn.mauGallery.methods.showItemTags($this, normalizedOptions.tagsPosition, tagsCollection);
      }

      $this.fadeIn(500);
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
    $(".gallery").on("click", ".gallery-item", function() {
      const $this = $(this);
      if (options.lightBox && $this.prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($this, options.lightboxId);
      }
    });

    $(".gallery").on("click", ".nav-link", $.fn.mauGallery.methods.filterByTag);
    $(".gallery").on("click", ".mg-prev", () => $.fn.mauGallery.methods.prevImage());
    $(".gallery").on("click", ".mg-next", () => $.fn.mauGallery.methods.nextImage());
  };

  function navigateImage(direction) {
    const $lightboxImage = $(".lightboxImage");
    const activeImageSrc = $lightboxImage.attr("src");

    const imagesCollection = $("img.gallery-item").map(function() {
      return $(this).attr("src");
    }).get();

    const currentIndex = imagesCollection.indexOf(activeImageSrc);

    if (currentIndex === -1) {
      console.error("Image active non trouvée dans la collection.");
      return;
    }

    let newIndex = currentIndex;

    if (direction === 'next') {
      newIndex = (currentIndex + 1) % imagesCollection.length;
    } else if (direction === 'prev') {
      newIndex = (currentIndex - 1 + imagesCollection.length) % imagesCollection.length;
    }

    $lightboxImage.attr("src", imagesCollection[newIndex]);
  }

  $.fn.mauGallery.methods = {
    createRowWrapper(element) {
      if (!element.children().first().hasClass("row")) {
        element.append('<div class="gallery-items-row row"></div>');
      }
    },
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
    moveItemInRowWrapper(element) {
      element.appendTo(".gallery-items-row");
    },
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    openLightBox(element, lightboxId) {
      const $lightbox = $(`#${lightboxId ? lightboxId : "galleryLightbox"}`);
      $lightbox.find(".lightboxImage").attr("src", element.attr("src"));
      $lightbox.modal("toggle");
    },
    prevImage() {
      navigateImage('prev');
    },
    nextImage() {
      navigateImage('next');
    },
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
    },
    filterByTag() {
      if ($(this).hasClass("active-tag")) {
        return;
      }
      
      $(".active-tag").removeClass("active active-tag");
      $(this).addClass("active-tag");

      const tag = $(this).data("images-toggle");

      $(".gallery-item").each(function() {
        const parentColumn = $(this).parents(".item-column");
        parentColumn.hide();

        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          parentColumn.show(300);
        }
      });
    }
  };
})(jQuery);
